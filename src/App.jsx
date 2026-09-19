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
    <div className={`min-h-screen transition-colors ${
      theme === 'light' 
        ? 'bg-[#FAFAFA] text-[#09090B] flex flex-col overflow-x-hidden font-sans' 
        : 'bg-[#F5F1E8] p-2 sm:p-4 md:p-6 lg:p-8 flex items-center justify-center font-sans'
    }`}>
      {/* APP CONTAINER FRAME */}
      <div className={`w-full transition-all ${
        theme === 'light'
          ? 'flex flex-col min-h-screen'
          : 'max-w-7xl bg-[#121114] text-white rounded-[28px] shadow-2xl border border-[#2D273C] overflow-hidden flex flex-col md:flex-row h-[92vh] max-h-[920px] relative'
      }`}>
        {/* SIDEBAR NAVIGATION */}
        {theme === 'light' ? (
          /* LIGHT MODE: Top Plain Wordmark & Text-Only Horizontal Nav Bar (Reference B) */
          <header className="bg-white border-b border-[#E4E4E7] px-6 md:px-10 h-16 flex items-center justify-between shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                  D
                </div>
                <span className="font-bold text-lg tracking-tight text-[#09090B]">DailyOS</span>
              </div>

              {/* Text-only nav tabs (Reference B) */}
              <nav className="hidden md:flex items-center gap-6">
                {[
                  { id: 'today', label: 'Day Planner', badge: tasks.length },
                  { id: 'undone', label: 'Undone Tasks', badge: undoneCount },
                  { id: 'patterns', label: 'Analytics' },
                  { id: 'backlog', label: 'Backlog', badge: backlogTasks.length },
                  { id: 'history', label: 'Log History' },
                  { id: 'settings', label: 'Settings' },
                ].map((item) => {
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`py-5 text-sm transition-all relative flex items-center gap-1.5 ${
                        isActive
                          ? 'font-bold text-[#09090B] border-b-2 border-[#09090B]'
                          : 'font-medium text-slate-500 hover:text-[#09090B]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-semibold ${
                          isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Right Header Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleToggleTheme('dark')}
                title="Switch to Reference A Dark Mode"
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              >
                <Moon className="w-4 h-4" />
              </button>
              <button
                onClick={handleEnableNotifications}
                className={`p-2 rounded-full transition-all ${
                  notificationsEnabled ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Bell className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <span className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs">
                  {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                </span>
                <button onClick={handleLogout} className="hover:text-rose-600 transition-colors">
                  Logout
                </button>
              </div>
            </div>
          </header>
        ) : (
          /* DARK MODE: Compact Icon-Only Vertical Sidebar (Reference A) */
          <aside className="w-20 bg-[#0C0B0E] border-r border-[#1F192E] flex flex-col items-center justify-between py-6 shrink-0 hidden md:flex">
            <div className="flex flex-col items-center gap-8">
              {/* Logo icon */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#A855F7] text-white flex items-center justify-center shadow-lg shadow-purple-900/40">
                <BookOpen className="w-5 h-5" />
              </div>

              {/* Icon-Only Vertical Navigation Links */}
              <nav className="flex flex-col items-center gap-4">
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
                      title={item.label}
                      className={`relative p-3 rounded-2xl transition-all ${
                        isActive
                          ? 'bg-[#1C1924] text-[#A855F7] border border-[#2D273C] shadow-lg shadow-purple-950/40 scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-[#1C1924]/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-[#9333EA] text-white rounded-full border border-[#0C0B0E]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => handleToggleTheme('light')}
                title="Switch to Reference B Light Mode"
                className="p-2.5 rounded-xl bg-[#1C1924] text-[#FACC15] border border-[#2D273C] hover:scale-105 transition-all"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* HEADER BAR FOR DARK MODE */}
          {theme === 'dark' && (
            <header className="h-16 border-b border-[#1F192E] px-6 md:px-8 flex items-center justify-between shrink-0 bg-[#121114]">
              {/* Search Pill (Reference A) */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C1924] border border-[#2D273C] text-xs text-slate-300 w-52 sm:w-72">
                <span className="text-slate-500">🔍</span>
                <input
                  type="text"
                  placeholder="Search tasks or entries..."
                  className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-full"
                />
              </div>

              {/* Status Text & Avatar Cluster (Reference A) */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1924] border border-[#2D273C] text-xs">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    <span className="inline-block h-5 w-5 rounded-full ring-2 ring-[#121114] bg-purple-500 text-[9px] font-bold text-white text-center leading-5">A</span>
                    <span className="inline-block h-5 w-5 rounded-full ring-2 ring-[#121114] bg-indigo-500 text-[9px] font-bold text-white text-center leading-5">B</span>
                  </div>
                  <span className="font-semibold text-slate-200">
                    {tasks.filter(t => t.status === 'done').length} of {tasks.length} tasks done
                  </span>
                  {undoneCount > 0 && (
                    <span className="text-rose-400 font-bold ml-1">• {undoneCount} pending</span>
                  )}
                </div>

                <button
                  onClick={handleEnableNotifications}
                  className={`p-2 rounded-full border transition-all ${
                    notificationsEnabled ? 'bg-purple-900/30 border-purple-500/40 text-purple-400' : 'bg-[#1C1924] border-[#2D273C] text-slate-400'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span className="hidden lg:inline">{currentUser.email}</span>
                </div>
              </div>
            </header>
          )}

          {/* MAIN CONTAINER Scrollable */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className={theme === 'light' ? 'max-w-6xl mx-auto' : 'max-w-6xl mx-auto'}>
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
                  theme={theme}
                  onSelectDate={setSelectedDate}
                />
              )}

            {activeView === 'undone' && (
              <UndoneTasksView
                tasks={tasks}
                backlogTasks={backlogTasks}
                onStatusChange={handleStatusChange}
                onScheduleTask={handleScheduleTask}
                onDeleteTask={handleDeleteTask}
                theme={theme}
              />
            )}

            {activeView === 'patterns' && (
              <PatternsView
                pattern={pattern}
                onRecomputePattern={handleRecomputePattern}
                theme={theme}
              />
            )}

            {activeView === 'backlog' && (
              <BacklogView
                backlogTasks={backlogTasks}
                onAddTask={handleAddTask}
                onScheduleTask={handleScheduleTask}
                onDeleteTask={handleDeleteTask}
                theme={theme}
              />
            )}

            {activeView === 'history' && (
              <LogHistoryView
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                dailyLog={dailyLog}
                onSaveReflection={handleSaveReflection}
                theme={theme}
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
