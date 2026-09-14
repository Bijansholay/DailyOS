import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, PieChart, Inbox, History, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, Sparkles, Database, CheckCircle2 
} from 'lucide-react';

import TodayView from './components/TodayView';
import PatternsView from './components/PatternsView';
import BacklogView from './components/BacklogView';
import LogHistoryView from './components/LogHistoryView';
import CompletionModal from './components/CompletionModal';

export default function App() {
  const [activeView, setActiveView] = useState('today'); // today | patterns | backlog | history
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

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

  // Fetch data when date or view changes
  useEffect(() => {
    fetchTodayData();
    fetchBacklogTasks();
    fetchPattern();
    fetchHealth();
  }, [selectedDate, activeView]);

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
        fetch(`/api/tasks?date=${selectedDate}`),
        fetch(`/api/events?from=${selectedDate}&to=${selectedDate}`),
        fetch(`/api/daily-log/${selectedDate}`)
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
      const res = await fetch('/api/tasks?backlog=true');
      if (res.ok) setBacklogTasks(await res.json());
    } catch (err) {
      console.error('Error fetching backlog:', err);
    }
  };

  const fetchPattern = async () => {
    try {
      const res = await fetch('/api/patterns');
      if (res.ok) setPattern(await res.json());
    } catch (err) {
      console.error('Error fetching pattern:', err);
    }
  };

  // TASK ACTIONS
  const handleAddTask = async (taskData) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });
      if (res.ok) {
        showToast('Task added successfully');
        fetchTodayData();
        fetchBacklogTasks();
      }
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const handleStatusChange = (task, newStatus) => {
    if (newStatus === 'done') {
      // Prompt modal for actual_minutes
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
    showToast('Task completed & actual time recorded!');
  };

  const updateTaskStatus = async (taskId, updates) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
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
    showToast(`Task scheduled for ${dateStr}`);
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
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
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    try {
      const res = await fetch('/api/ai/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });
      if (res.ok) {
        showToast('Daily AI Brief generated!');
        fetchTodayData();
      }
    } catch (err) {
      console.error('Error generating AI brief:', err);
    }
  };

  // RECOMPUTE PATTERN ACTION
  const handleRecomputePattern = async () => {
    try {
      const res = await fetch('/api/patterns/recompute', { method: 'POST' });
      if (res.ok) {
        setPattern(await res.json());
        showToast('Patterns recomputed from last 30 days');
      }
    } catch (err) {
      console.error('Error recomputing pattern:', err);
    }
  };

  // REFLECTION ACTION
  const handleSaveReflection = async (dateStr, moodNote) => {
    try {
      const res = await fetch(`/api/daily-log/${dateStr}/reflect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood_note: moodNote })
      });
      if (res.ok) {
        setDailyLog(await res.json());
        showToast('Reflection saved!');
      }
    } catch (err) {
      console.error('Error saving reflection:', err);
    }
  };

  // Date Navigation Helpers
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isTodaySelected = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="flex h-screen overflow-hidden bg-dark-900 text-slate-100">
      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800/80 glass-card flex flex-col justify-between p-5 shrink-0 hidden md:flex">
        <div className="space-y-8">
          {/* LOGO */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <Sparkles className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white font-sans tracking-tight">DailyOS</h1>
              <p className="text-[10px] text-slate-400 font-medium">AI Task & Life Dashboard</p>
            </div>
          </div>

          {/* NAVIGATION LINKS */}
          <nav className="space-y-1.5">
            {[
              { id: 'today', label: 'Today', icon: LayoutDashboard, badge: tasks.length },
              { id: 'patterns', label: 'Patterns', icon: PieChart },
              { id: 'backlog', label: 'Backlog', icon: Inbox, badge: backlogTasks.length },
              { id: 'history', label: 'Log History', icon: History },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SYSTEM STATUS BADGE */}
        <div className="bg-dark-800/60 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-400" />
            <span className="capitalize">{dbMode} DB</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between glass-card shrink-0">
          {/* MOBILE NAV TABS */}
          <div className="flex items-center gap-1 md:hidden">
            {[
              { id: 'today', icon: LayoutDashboard },
              { id: 'patterns', icon: PieChart },
              { id: 'backlog', icon: Inbox },
              { id: 'history', icon: History },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`p-2 rounded-lg ${activeView === item.id ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
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
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 bg-dark-800 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-200">
              <CalendarIcon className="w-3.5 h-3.5 text-brand-400" />
              <span>{selectedDate}</span>
              {isTodaySelected && (
                <span className="px-1.5 py-0.2 bg-brand-500/20 text-brand-300 rounded text-[10px] uppercase">
                  Today
                </span>
              )}
            </div>
            <button
              onClick={() => changeDate(1)}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {!isTodaySelected && (
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs text-brand-400 font-medium hover:underline ml-1"
              >
                Go to Today
              </button>
            )}
          </div>

          {/* TOAST NOTIFICATION */}
          {toastMessage && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{toastMessage}</span>
            </div>
          )}
        </header>

        {/* BODY VIEWS */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
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
          </div>
        </main>
      </div>

      {/* COMPLETION MODAL FOR ACTUAL_MINUTES */}
      <CompletionModal
        isOpen={!!completionModalTask}
        task={completionModalTask}
        onClose={() => setCompletionModalTask(null)}
        onSubmit={handleCompletionSubmit}
      />
    </div>
  );
}
