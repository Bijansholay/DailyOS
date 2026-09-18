import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PieChart, Inbox, History, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Database, CheckCircle2, BookOpen, LogOut, User, LogIn, Lock, Bell, ListTodo, Settings, Sun, Moon
} from 'lucide-react';
import { requestNotificationPermission, startTaskNotificationScheduler, sendDesktopNotification } from './utils/notifications';

import TodayView from './components/TodayView';
import PatternsView from './components/PatternsView';
import BacklogView from './components/BacklogView';
import LogHistoryView from './components/LogHistoryView';
import UndoneTasksView from './components/UndoneTasksView';
import SettingsView from './components/SettingsView';
import LandingPage from './components/LandingPage';
import CompletionModal from './components/CompletionModal';
import AuthModal from './components/AuthModal';

export default function App() {
  const [activeView, setActiveView] = useState('today'); // today | undone | patterns | backlog | history | settings
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem('dailyos_theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('dailyos_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = (newTheme) => {
    const nextTheme = newTheme || (theme === 'dark' ? 'light' : 'dark');
    setTheme(nextTheme);
    showToast(`Switched to ${nextTheme === 'light' ? 'Light Sky' : 'Dark Journal'} theme`);
  };

  // Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('dailyos_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('dailyos_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalRegister, setAuthModalRegister] = useState(false);

  // Data states
  const [tasks, setTasks] = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [dailyLog, setDailyLog] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [dbMode, setDbMode] = useState('sqlite');

  // Completion modal state
  const [completionModalTask, setCompletionModalTask] = useState(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper fetch with Bearer token authentication header & 401 interceptor
  const authFetch = async (url, options = {}) => {
    const token = authToken || localStorage.getItem('dailyos_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401) {
        localStorage.removeItem('dailyos_token');
        localStorage.removeItem('dailyos_user');
        setCurrentUser(null);
        setAuthToken(null);
      }
      return res;
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    showToast(`Signed in as ${user.email}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('dailyos_token');
    localStorage.removeItem('dailyos_user');
    setCurrentUser(null);
    setAuthToken(null);
    setTasks([]);
    setBacklogTasks([]);
    setEvents([]);
    setDailyLog(null);
    setPattern(null);
    showToast('Logged out');
  };

  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      sendDesktopNotification('DailyOS Notifications Enabled 🔔', {
        body: 'You will receive desktop alerts when your scheduled tasks are due.'
      });
      showToast('Desktop notifications enabled!');
    } else {
      showToast('Notification permission denied');
    }
  };

  // Task Notification Scheduler effect
  useEffect(() => {
    if (notificationsEnabled && tasks.length > 0) {
      const stopScheduler = startTaskNotificationScheduler(tasks);
      return () => stopScheduler();
    }
  }, [notificationsEnabled, tasks]);

  // Fetch data when date, view, or auth changes
  useEffect(() => {
    if (authToken && currentUser) {
      fetchTodayData();
      fetchBacklogTasks();
      fetchPattern();
    }
    fetchHealth();
  }, [selectedDate, activeView, authToken]);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbMode(data.dbMode || 'sqlite');
      }
    } catch (e) {}
  };

  const fetchTodayData = async () => {
    try {
      const [tasksRes, eventsRes, logRes] = await Promise.all([
        authFetch(`/api/tasks?date=${selectedDate}`),
        authFetch(`/api/events?from=${selectedDate}&to=${selectedDate}`),
        authFetch(`/api/daily-log/${selectedDate}`)
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (eventsRes.ok) setEvents(await eventsRes.json());
      if (logRes.ok) setDailyLog(await logRes.json());
    } catch (err) {
      console.error('Error fetching today data:', err);
    }
  };

  const fetchBacklogTasks = async () => {
    try {
      const res = await authFetch('/api/tasks?backlog=true');
      if (res.ok) setBacklogTasks(await res.json());
    } catch (err) {
      console.error('Error fetching backlog:', err);
    }
  };

  const fetchPattern = async () => {
    try {
      const res = await authFetch('/api/patterns');
      if (res.ok) setPattern(await res.json());
    } catch (err) {
      console.error('Error fetching pattern:', err);
    }
  };

  // TASK ACTIONS
  const handleAddTask = async (taskData) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        showToast('Task added');
        fetchTodayData();
        fetchBacklogTasks();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleStatusChange = (task, newStatus) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (newStatus === 'done') {
      setCompletionModalTask(task);
    } else {
      updateTaskStatus(task.id, { status: newStatus });
    }
  };

  const handleCompletionSubmit = async (taskId, actualMinutes) => {
    await updateTaskStatus(taskId, {
      status: 'done',
      actual_minutes: actualMinutes
    });
    setCompletionModalTask(null);
    showToast('Task completed & time logged');
  };

  const updateTaskStatus = async (taskId, updates) => {
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchTodayData();
        fetchBacklogTasks();
        fetchPattern();
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleScheduleTask = async (taskId, dateStr) => {
    await updateTaskStatus(taskId, { scheduled_for: dateStr });
    showToast(`Scheduled for ${dateStr}`);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Task deleted');
        fetchTodayData();
        fetchBacklogTasks();
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // EVENT ACTIONS
  const handleAddEvent = async (eventData) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await authFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData)
      });
      if (res.ok) {
        showToast('Event added');
        fetchTodayData();
      }
    } catch (err) {
      console.error('Error adding event:', err);
    }
  };

  // AI BRIEFING GENERATOR ACTION
  const handleGenerateAiBrief = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      const res = await authFetch('/api/ai/daily-brief', {
        method: 'POST',
        body: JSON.stringify({ date: selectedDate })
      });
      if (res.ok) {
        showToast('Daily Schedule Updated');
        fetchTodayData();
      }
    } catch (err) {
      console.error('Error generating AI brief:', err);
    }
  };

  // RECOMPUTE PATTERN ACTION
  const handleRecomputePattern = async () => {
    try {
      const res = await authFetch('/api/patterns/recompute', { method: 'POST' });
      if (res.ok) {
        setPattern(await res.json());
        showToast('Patterns recomputed');
      }
    } catch (err) {
      console.error('Error recomputing pattern:', err);
    }
  };

  // REFLECTION ACTION
  const handleSaveReflection = async (dateStr, moodNote) => {
    try {
      const res = await authFetch(`/api/daily-log/${dateStr}/reflect`, {
        method: 'POST',
        body: JSON.stringify({ mood_note: moodNote })
      });
      if (res.ok) {
        setDailyLog(await res.json());
        showToast('Reflection saved');
      }
    } catch (err) {
      console.error('Error saving reflection:', err);
    }
  };

  // Calculate undone task count for navigation badge
  const undoneCount = tasks.filter(t => t.status !== 'done').length + backlogTasks.filter(t => t.status !== 'done').length;

  // Date Navigation Helpers
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  // If user is NOT signed in, show the Public Landing Page!
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(isReg) => {
            setAuthModalRegister(isReg);
            setShowAuthModal(true);
          }}
          onTryDemo={() => {
            const demoUser = { id: 'demo-user-123', email: 'demo@dailyos.local' };
            setCurrentUser(demoUser);
            setAuthToken('demo-token-123');
            showToast('Entered Interactive Demo Mode');
          }}
        />
        <AuthModal
          isOpen={showAuthModal}
          initialRegister={authModalRegister}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'light' ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#1C1B19] text-[#E8E6E3]'}`}>
      {/* SIDEBAR */}
      <aside className={`w-64 border-r flex flex-col justify-between p-6 shrink-0 hidden md:flex ${theme === 'light' ? 'bg-[#FFFFFF] border-slate-200' : 'bg-[#1C1B19] border-[#33302B]'}`}>
        <div className="space-y-8">
          {/* LOGO / JOURNAL TITLE */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-[#0284C7]' : 'bg-[#24221F] border-[#33302B] text-[#D4A24C]'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h1 className={`font-journal text-xl font-normal tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-[#E8E6E3]'}`}>DailyOS</h1>
              <p className={`text-[10px] uppercase tracking-wider font-semibold ${theme === 'light' ? 'text-slate-500' : 'text-[#9E9A92]'}`}>Personal Journal</p>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1">
            {[
              { id: 'today', label: 'Day Planner', icon: LayoutDashboard, badge: tasks.length },
              { id: 'undone', label: 'Undone Tasks', icon: ListTodo, badge: undoneCount },
              { id: 'patterns', label: 'Analytics', icon: PieChart },
              { id: 'backlog', label: 'Backlog', icon: Inbox, badge: backlogTasks.length },
              { id: 'history', label: 'Log History', icon: History },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive 
                      ? theme === 'light'
                        ? 'bg-sky-50 text-[#0284C7] border border-sky-200 font-semibold'
                        : 'bg-[#24221F] text-[#D4A24C] border border-[#33302B] font-semibold' 
                      : theme === 'light'
                        ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-[#9E9A92] hover:text-[#E8E6E3] hover:bg-[#24221F]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-[10px] rounded ${
                      isActive 
                        ? theme === 'light' ? 'bg-sky-100 text-[#0284C7]' : 'bg-[#D4A24C]/20 text-[#D4A24C]' 
                        : theme === 'light' ? 'bg-slate-100 text-slate-500' : 'bg-[#24221F] text-[#9E9A92]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ACCOUNT / SYSTEM STATUS BOX */}
        <div className="space-y-3">
          <div className={`p-3.5 rounded-lg border space-y-2 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-[#24221F] border-[#33302B]'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <User className={`w-3.5 h-3.5 shrink-0 ${theme === 'light' ? 'text-[#0284C7]' : 'text-[#D4A24C]'}`} />
                <span className={`text-xs truncate ${theme === 'light' ? 'text-slate-800' : 'text-[#E8E6E3]'}`}>{currentUser.email}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-[#24221F] border-[#33302B] text-[#9E9A92]'}`}>
            <div className="flex items-center gap-2">
              <Database className={`w-3 h-3 ${theme === 'light' ? 'text-[#0284C7]' : 'text-[#D4A24C]'}`} />
              <span className="capitalize">{dbMode} DB</span>
            </div>
            <span className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-[#0284C7]' : 'bg-[#D4A24C]'}`} />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 ${theme === 'light' ? 'bg-[#FFFFFF] border-slate-200' : 'bg-[#1C1B19] border-[#33302B]'}`}>
          {/* MOBILE NAV TABS */}
          <div className="flex items-center gap-1 md:hidden">
            {[
              { id: 'today', icon: LayoutDashboard },
              { id: 'undone', icon: ListTodo },
              { id: 'patterns', icon: PieChart },
              { id: 'backlog', icon: Inbox },
              { id: 'history', icon: History },
              { id: 'settings', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`p-2 rounded-lg ${activeView === item.id ? (theme === 'light' ? 'bg-sky-100 text-[#0284C7]' : 'bg-[#24221F] text-[#D4A24C]') : 'text-slate-400'}`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          {/* DATE SWITCHER */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className={`p-1.5 rounded-lg transition-colors border ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-[#24221F] hover:bg-[#292723] text-[#9E9A92] hover:text-[#E8E6E3] border-[#33302B]'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-semibold ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#24221F] border-[#33302B] text-[#E8E6E3]'}`}>
              <CalendarIcon className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-[#0284C7]' : 'text-[#D4A24C]'}`} />
              <span className="font-mono">{selectedDate}</span>
              {isTodaySelected && (
                <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold tracking-wider ${theme === 'light' ? 'bg-sky-100 text-[#0284C7]' : 'bg-[#D4A24C]/20 text-[#D4A24C]'}`}>
                  Today
                </span>
              )}
            </div>
            <button
              onClick={() => changeDate(1)}
              className={`p-1.5 rounded-lg transition-colors border ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200' : 'bg-[#24221F] hover:bg-[#292723] text-[#9E9A92] hover:text-[#E8E6E3] border-[#33302B]'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isTodaySelected && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className={`text-xs font-semibold hover:underline ml-2 ${theme === 'light' ? 'text-[#0284C7]' : 'text-[#D4A24C]'}`}
              >
                Go to Today
              </button>
            )}
          </div>

          {/* USER ACCOUNT BADGE & THEME / NOTIFICATION CONTROLS */}
          <div className="flex items-center gap-3">
            {/* Quick Theme Switcher Button */}
            <button
              onClick={() => handleToggleTheme()}
              title={theme === 'dark' ? 'Switch to Light Sky Theme' : 'Switch to Dark Journal Theme'}
              className={`p-1.5 rounded-lg border transition-all ${
                theme === 'light'
                  ? 'bg-sky-50 border-sky-200 text-[#0284C7]'
                  : 'bg-[#24221F] border-[#33302B] text-[#D4A24C]'
              }`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Desktop Notification Bell Button */}
            <button
              onClick={handleEnableNotifications}
              title={notificationsEnabled ? 'Desktop Notifications Active' : 'Click to Enable Desktop Notifications'}
              className={`p-1.5 rounded-lg border transition-all ${
                notificationsEnabled
                  ? theme === 'light' ? 'bg-sky-100 border-sky-200 text-[#0284C7]' : 'bg-[#D4A24C]/20 border-[#D4A24C]/40 text-[#D4A24C]'
                  : theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-[#24221F] border-[#33302B] text-[#9E9A92]'
              }`}
            >
              <Bell className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-xs text-[#9E9A92]">
              <User className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-[#0284C7]' : 'text-[#D4A24C]'}`} />
              <span className={`hidden sm:inline font-medium ${theme === 'light' ? 'text-slate-800' : 'text-[#E8E6E3]'}`}>{currentUser.email}</span>
              <button
                onClick={handleLogout}
                className="text-xs text-[#9E9A92] hover:text-rose-500 font-medium ml-1"
              >
                Log Out
              </button>
            </div>

            {/* TOAST NOTIFICATION */}
            {toastMessage && (
              <div className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 border text-xs rounded-lg animate-fadeIn ${theme === 'light' ? 'bg-sky-50 border-sky-200 text-[#0284C7]' : 'bg-[#24221F] border-[#D4A24C]/40 text-[#D4A24C]'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{toastMessage}</span>
              </div>
            )}
          </div>
        </header>

        {/* BODY VIEWS */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          <div className="max-w-4xl mx-auto">
            {activeView === 'today' && (
              <TodayView
                selectedDate={selectedDate}
                tasks={tasks}
                events={events}
                dailyLog={dailyLog}
                onStatusChange={handleStatusChange}
                onAddTask={handleAddTask}
                onAddEvent={handleAddEvent}
                onGenerateAiBrief={handleGenerateAiBrief}
              />
            )}

            {activeView === 'undone' && (
              <UndoneTasksView
                tasks={tasks}
                backlogTasks={backlogTasks}
                onStatusChange={handleStatusChange}
                onScheduleTask={handleScheduleTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeView === 'patterns' && (
              <PatternsView
                pattern={pattern}
                onRecomputePattern={handleRecomputePattern}
              />
            )}

            {activeView === 'backlog' && (
              <BacklogView
                backlogTasks={backlogTasks}
                onAddTask={handleAddTask}
                onScheduleTask={handleScheduleTask}
                onDeleteTask={handleDeleteTask}
              />
            )}

            {activeView === 'history' && (
              <LogHistoryView
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                dailyLog={dailyLog}
                onSaveReflection={handleSaveReflection}
              />
            )}

            {activeView === 'settings' && (
              <SettingsView
                theme={theme}
                onToggleTheme={handleToggleTheme}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleEnableNotifications}
                currentUser={currentUser}
                tasks={tasks}
                events={events}
              />
            )}
          </div>
        </main>
      </div>

      {/* AUTH MODAL */}
      <AuthModal
        isOpen={showAuthModal}
        initialRegister={authModalRegister}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* COMPLETION MODAL */}
      <CompletionModal
        isOpen={!!completionModalTask}
        task={completionModalTask}
        onClose={() => setCompletionModalTask(null)}
        onSubmit={handleCompletionSubmit}
      />
    </div>
  );
}
