import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { 
  LayoutDashboard, PieChart, Inbox, History, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Database, CheckCircle2, BookOpen, LogOut, User, LogIn, Lock, Bell, ListTodo, Settings, Sun, Moon, Target
} from 'lucide-react';
import { requestNotificationPermission, startTaskNotificationScheduler, sendDesktopNotification } from './utils/notifications';

import TodayView from './components/TodayView';
import PatternsView from './components/PatternsView';
import BacklogView from './components/BacklogView';
import LogHistoryView from './components/LogHistoryView';
import UndoneTasksView from './components/UndoneTasksView';
import SettingsView from './components/SettingsView';
import GoalsView from './components/GoalsView';
import LandingPage from './components/LandingPage';
import CompletionModal from './components/CompletionModal';
import AuthModal from './components/AuthModal';

const NAV_CONFIG = [
  { id: 'today', label: 'Day Planner', icon: LayoutDashboard },
  { id: 'undone', label: 'Undone Tasks', icon: ListTodo },
  { id: 'goals', label: 'Goals & Review', icon: Target },
  { id: 'patterns', label: 'Analytics', icon: PieChart },
  { id: 'backlog', label: 'Backlog', icon: Inbox },
  { id: 'history', label: 'Log History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function App() {
  const [activeView, setActiveView] = useState('today'); // today | undone | goals | patterns | backlog | history | settings
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Theme State ('dark' | 'light')
  const [theme, setTheme] = useState(() => localStorage.getItem('dailyos_theme') || 'dark');

  // Time Format Preference ('12h' | '24h' | 'range')
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem('dailyos_time_format') || '12h');

  // Daily Goal Targets
  const [dailyTaskTarget, setDailyTaskTarget] = useState(() => Number(localStorage.getItem('dailyos_task_target')) || 5);
  const [dailyFocusTarget, setDailyFocusTarget] = useState(() => Number(localStorage.getItem('dailyos_focus_target')) || 240);

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

  const handleToggleTimeFormat = (newFormat) => {
    setTimeFormat(newFormat);
    localStorage.setItem('dailyos_time_format', newFormat);
    showToast(`Time format set to ${newFormat === '12h' ? '12-Hour AM/PM' : newFormat === '24h' ? '24-Hour Exact' : 'Time Range Display'}`);
  };

  const handleUpdateDailyTaskTarget = (targetVal) => {
    setDailyTaskTarget(targetVal);
    localStorage.setItem('dailyos_task_target', targetVal);
  };

  const handleUpdateDailyFocusTarget = (targetVal) => {
    setDailyFocusTarget(targetVal);
    localStorage.setItem('dailyos_focus_target', targetVal);
  };

  // Clerk Authentication Hooks
  const { isLoaded: isClerkLoaded, userId: clerkUserId, getToken, signOut: clerkSignOut, isSignedIn: isClerkSignedIn } = useAuth();
  const { user: clerkUser } = useUser();

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

  // Sync Clerk User on sign in
  useEffect(() => {
    if (isClerkSignedIn && clerkUserId && clerkUser) {
      const email = clerkUser.primaryEmailAddress?.emailAddress || clerkUser.emailAddresses?.[0]?.emailAddress || '';
      const syncedUser = { id: clerkUserId, email };
      setCurrentUser(syncedUser);
      localStorage.setItem('dailyos_user', JSON.stringify(syncedUser));

      (async () => {
        try {
          const token = await getToken();
          if (token) {
            localStorage.setItem('dailyos_token', token);
            setAuthToken(token);
          }
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token || clerkUserId}`
            },
            body: JSON.stringify({ email })
          });
        } catch (e) {
          console.warn('Clerk user sync notice:', e);
        }
      })();
    }
  }, [isClerkSignedIn, clerkUserId, clerkUser]);

  // Data states
  const [tasks, setTasks] = useState([]);
  const [backlogTasks, setBacklogTasks] = useState([]);
  const [allUndoneTasks, setAllUndoneTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [dailyLog, setDailyLog] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [dbMode, setDbMode] = useState('supabase');

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
    let token = null;
    if (isClerkSignedIn && getToken) {
      try {
        token = await getToken();
      } catch (e) {
        token = clerkUserId;
      }
    }
    if (!token) {
      token = authToken || localStorage.getItem('dailyos_token') || (currentUser ? currentUser.id : null);
    }

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.status === 401 && !isClerkSignedIn) {
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

  const handleLogout = async () => {
    if (isClerkSignedIn && clerkSignOut) {
      await clerkSignOut();
    }
    localStorage.removeItem('dailyos_token');
    localStorage.removeItem('dailyos_user');
    setCurrentUser(null);
    setAuthToken(null);
    setTasks([]);
    setBacklogTasks([]);
    setAllUndoneTasks([]);
    setEvents([]);
    setDailyLog(null);
    setPattern(null);
    showToast('Signed out successfully');
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
      fetchUndoneTasks();
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

  const fetchUndoneTasks = async () => {
    try {
      const res = await authFetch('/api/tasks?undone=true');
      if (res.ok) setAllUndoneTasks(await res.json());
    } catch (err) {
      console.error('Error fetching undone tasks:', err);
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
        fetchUndoneTasks();
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
        fetchUndoneTasks();
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
        fetchUndoneTasks();
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
  const undoneCount = allUndoneTasks.length > 0 
    ? allUndoneTasks.filter(t => t.status !== 'done').length
    : tasks.filter(t => t.status !== 'done').length + backlogTasks.filter(t => t.status !== 'done').length;

  const navItems = NAV_CONFIG.map((item) => ({
    ...item,
    badge: item.id === 'today' ? tasks.length : item.id === 'undone' ? undoneCount : item.id === 'backlog' ? backlogTasks.length : undefined
  }));

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
          onTryDemo={async () => {
            try {
              const res = await fetch('/api/auth/demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
              });
              if (res.ok) {
                const data = await res.json();
                localStorage.setItem('dailyos_token', data.token);
                localStorage.setItem('dailyos_user', JSON.stringify(data.user));
                setCurrentUser(data.user);
                setAuthToken(data.token);
                showToast('Entered Interactive Demo Mode');
              } else {
                const errData = await res.json();
                showToast(errData.error || 'Failed to enter demo mode');
              }
            } catch (err) {
              console.error('Error entering demo mode:', err);
              showToast('Error entering demo mode');
            }
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
          : 'max-w-7xl bg-[#121114] text-white rounded-2xl sm:rounded-[28px] shadow-2xl border border-[#2D273C] overflow-hidden flex flex-col md:flex-row min-h-[90vh] md:h-[92vh] md:max-h-[920px] relative'
      }`}>
        {/* SIDEBAR / TOP NAVIGATION */}
        {theme === 'light' ? (
          /* LIGHT MODE: Top Plain Wordmark & Text-Only Horizontal Nav Bar (Reference B) */
          <>
            <header className="bg-white border-b border-[#E4E4E7] px-4 md:px-10 h-16 flex items-center justify-between shrink-0 sticky top-0 z-30">
              <div className="flex items-center gap-6 md:gap-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    D
                  </div>
                  <span className="font-bold text-lg tracking-tight text-[#09090B]">DailyOS</span>
                </div>

                {/* Text-only nav tabs for Desktop (Reference B) */}
                <nav className="hidden md:flex items-center gap-6">
                  {navItems.map((item) => {
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
              <div className="flex items-center gap-3 md:gap-4">
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
                  <button onClick={handleLogout} className="hidden sm:inline hover:text-rose-600 transition-colors">
                    Logout
                  </button>
                </div>
              </div>
            </header>

            {/* LIGHT MODE MOBILE SUB-NAV TAB STRIP */}
            <div className="md:hidden bg-white border-b border-[#E4E4E7] px-4 py-2.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap sticky top-16 z-20 shadow-sm shrink-0 scrollbar-none">
              {navItems.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                      isActive
                        ? 'bg-[#09090B] text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold ${
                        isActive ? 'bg-white text-[#09090B]' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
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
                {navItems.map((item) => {
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
            <>
              <header className="h-16 border-b border-[#1F192E] px-4 md:px-8 flex items-center justify-between shrink-0 bg-[#121114]">
                {/* Search Pill (Reference A) */}
                <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-[#1C1924] border border-[#2D273C] text-xs text-slate-300 w-44 sm:w-72">
                  <span className="text-slate-500">🔍</span>
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-full"
                  />
                </div>

                {/* Status Text & Controls (Reference A) */}
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C1924] border border-[#2D273C] text-xs">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <span className="inline-block h-5 w-5 rounded-full ring-2 ring-[#121114] bg-purple-500 text-[9px] font-bold text-white text-center leading-5">A</span>
                      <span className="inline-block h-5 w-5 rounded-full ring-2 ring-[#121114] bg-indigo-500 text-[9px] font-bold text-white text-center leading-5">B</span>
                    </div>
                    <span className="font-semibold text-slate-200">
                      {tasks.filter(t => t.status === 'done').length} of {tasks.length} done
                    </span>
                    {undoneCount > 0 && (
                      <span className="text-rose-400 font-bold ml-1">• {undoneCount} pending</span>
                    )}
                  </div>

                  {/* Sun Theme Switcher for Mobile Dark Mode */}
                  <button
                    onClick={() => handleToggleTheme('light')}
                    title="Switch to Reference B Light Mode"
                    className="md:hidden p-2 rounded-full bg-[#1C1924] text-[#FACC15] border border-[#2D273C]"
                  >
                    <Sun className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleEnableNotifications}
                    className={`p-2 rounded-full border transition-all ${
                      notificationsEnabled ? 'bg-purple-900/30 border-purple-500/40 text-purple-400' : 'bg-[#1C1924] border-[#2D273C] text-slate-400'
                    }`}
                  >
                    <Bell className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs" title={currentUser.email || 'User'}>
                      {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
                    </span>
                    {currentUser && (
                      <button
                        onClick={handleLogout}
                        title="Sign Out of Account"
                        className="px-2.5 py-1.5 rounded-full bg-[#1C1924] border border-[#2D273C] text-slate-300 hover:text-rose-400 hover:border-rose-500/40 transition-all flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span className="hidden sm:inline text-xs font-semibold">Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              </header>

              {/* DARK MODE MOBILE SUB-NAV TAB STRIP */}
              <div className="md:hidden bg-[#0C0B0E] border-b border-[#1F192E] px-4 py-2.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap z-20 shrink-0 scrollbar-none">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                        isActive
                          ? 'bg-[#1C1924] text-[#A855F7] border border-[#2D273C] shadow-md shadow-purple-950/40'
                          : 'bg-[#16141B] text-slate-400 border border-transparent hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`px-1.5 py-0.2 text-[9px] rounded-full font-mono font-bold ${
                          isActive ? 'bg-[#9333EA] text-white' : 'bg-[#2D273C] text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
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
                  timeFormat={timeFormat}
                />
              )}

            {activeView === 'undone' && (
              <UndoneTasksView
                tasks={tasks}
                allUndoneTasks={allUndoneTasks}
                backlogTasks={backlogTasks}
                onStatusChange={handleStatusChange}
                onScheduleTask={handleScheduleTask}
                onDeleteTask={handleDeleteTask}
                theme={theme}
                timeFormat={timeFormat}
              />
            )}

            {activeView === 'goals' && (
              <GoalsView
                selectedDate={selectedDate}
                tasks={tasks}
                dailyLog={dailyLog}
                authFetch={authFetch}
                theme={theme}
                dailyTaskTarget={dailyTaskTarget}
                dailyFocusTarget={dailyFocusTarget}
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
                timeFormat={timeFormat}
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
                timeFormat={timeFormat}
                onToggleTimeFormat={handleToggleTimeFormat}
                dailyTaskTarget={dailyTaskTarget}
                onUpdateDailyTaskTarget={handleUpdateDailyTaskTarget}
                dailyFocusTarget={dailyFocusTarget}
                onUpdateDailyFocusTarget={handleUpdateDailyFocusTarget}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleEnableNotifications}
                currentUser={currentUser}
                onLogout={handleLogout}
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
