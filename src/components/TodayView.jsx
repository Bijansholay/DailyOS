import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Plus, 
  RefreshCw, Sparkles, Flame, Download
} from 'lucide-react';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { PrimaryButton, SecondaryButton } from './Button';
import { formatTime, formatTimeRange } from '../utils/timeFormat';
import { generateIcsContent, downloadIcsFile } from '../utils/icsExport';
import SwipeableTaskCard from './SwipeableTaskCard';

const PRIORITY_CONFIG = {
  high:   { color: '#EC4899', bg: 'rgba(236,72,153,0.12)', label: 'High',   dot: '#EC4899' },
  medium: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  label: 'Med',    dot: '#F59E0B' },
  low:    { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  label: 'Low',    dot: '#10B981' },
};

const CATEGORY_EMOJI = {
  work: '💼', school: '📚', personal: '🏠', health: '🏃', default: '📌'
};

export default function TodayView({ 
  selectedDate, 
  tasks, 
  events, 
  dailyLog, 
  onStatusChange, 
  onAddTask, 
  onAddEvent,
  onGenerateAiBrief,
  theme,
  onSelectDate,
  timeFormat = '12h'
}) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');
  const [taskEst, setTaskEst] = useState('30');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskTime, setTaskTime] = useState('');

  // Parse AI Summary JSON if available
  let aiSummary = null;
  if (dailyLog?.ai_summary) {
    try {
      aiSummary = typeof dailyLog.ai_summary === 'string' 
        ? JSON.parse(dailyLog.ai_summary) 
        : dailyLog.ai_summary;
    } catch (e) {
      aiSummary = { insight: dailyLog.ai_summary, schedule: [] };
    }
  }

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    onAddTask({
      title: taskTitle.trim(),
      category: taskCategory,
      estimated_minutes: parseInt(taskEst, 10) || 30,
      priority: taskPriority,
      scheduled_for: selectedDate,
      scheduled_time: taskTime || null
    });
    setTaskTitle('');
    setShowTaskForm(false);
  };

  const handleTriggerBrief = async () => {
    setIsGeneratingBrief(true);
    await onGenerateAiBrief();
    setIsGeneratingBrief(false);
  };

  // Date Ribbon Generator (-3 to +3 days)
  const calendarDays = [];
  const currDate = new Date(selectedDate + 'T00:00:00');
  for (let i = -3; i <= 3; i++) {
    const d = new Date(currDate);
    d.setDate(d.getDate() + i);
    calendarDays.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate().toString().padStart(2, '0')
    });
  }

  // Format date for display
  const formattedJournalDate = currDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.scheduled_for && t.scheduled_for < selectedDate);
  const upcomingTasks = tasks.filter(t => t.status !== 'done');
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const estimatedMinutesTotal = tasks.reduce((acc, t) => acc + (parseInt(t.estimated_minutes, 10) || 0), 0);
  const completedMinutes = tasks.filter(t => t.status === 'done').reduce((acc, t) => acc + (parseInt(t.estimated_minutes, 10) || 0), 0);

  // Hourly completion pace calculated from real task records
  const timeSlots = [
    { label: '7am', hour: 7, avg: 1.2 },
    { label: '9am', hour: 9, avg: 2.1 },
    { label: '11am', hour: 11, avg: 2.8 },
    { label: '1pm', hour: 13, avg: 2.4 },
    { label: '3pm', hour: 15, avg: 3.1 },
    { label: '5pm', hour: 17, avg: 3.8 },
    { label: '7pm', hour: 19, avg: 2.5 },
    { label: '9pm', hour: 21, avg: 1.8 }
  ];

  const chartData = timeSlots.map(slot => {
    const todayCountForSlot = tasks.filter(t => {
      if (t.status === 'done' && t.completed_at) {
        const completedHour = new Date(t.completed_at).getHours();
        return Math.abs(completedHour - slot.hour) <= 1;
      }
      if (t.scheduled_time) {
        const scheduledHour = parseInt(t.scheduled_time.split(':')[0], 10);
        return Math.abs(scheduledHour - slot.hour) <= 1;
      }
      return false;
    }).length;

    return {
      time: slot.label,
      today: todayCountForSlot,
      average: slot.avg
    };
  });

  const streakCount = (dailyLog?.tasks_completed !== undefined) ? dailyLog.tasks_completed : completedCount;

  const handleExportIcs = () => {
    const content = generateIcsContent(tasks, events, selectedDate);
    downloadIcsFile(`DailyOS-Schedule-${selectedDate}.ics`, content);
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--accent-primary)' }}>Day Planner</p>
          <h1 className="font-journal text-3xl md:text-4xl font-normal tracking-tight" style={{ color: 'var(--text-main)' }}>{formattedJournalDate}</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {completedCount} of {tasks.length} tasks · {completionRate}% complete
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SecondaryButton onClick={handleExportIcs} icon={Download}>Export .ics</SecondaryButton>
          <PrimaryButton onClick={() => setShowTaskForm(!showTaskForm)} icon={Plus}>
            Add Task
          </PrimaryButton>
        </div>
      </div>

      {/* HORIZONTAL DATE RIBBON */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {calendarDays.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          const isToday = d.dateStr === new Date().toISOString().split('T')[0];
          return (
            <button
              key={d.dateStr}
              onClick={() => onSelectDate && onSelectDate(d.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[64px] px-3 py-2.5 rounded-2xl transition-all relative ${
                isSelected
                  ? 'shadow-lg scale-105'
                  : 'hover:scale-[1.02]'
              }`}
              style={{
                background: isSelected ? 'var(--btn-primary-bg)' : 'var(--bg-card)',
                color: isSelected ? 'var(--btn-primary-text)' : 'var(--text-muted)',
                border: isSelected ? '1px solid transparent' : '1px solid var(--border-color)',
                boxShadow: isSelected ? '0 6px 20px -4px rgba(147,51,234,0.4)' : undefined
              }}
            >
              {isToday && !isSelected && (
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
              )}
              <span className="text-[10px] font-bold uppercase">{d.dayName}</span>
              <span className={`text-lg font-extrabold leading-none mt-0.5 ${isSelected ? '' : 'text-[var(--text-main)]'}`}>{d.dayNum}</span>
              {isToday && (
                <span className={`text-[9px] font-semibold mt-0.5 ${isSelected ? 'opacity-80' : ''}`}
                  style={{ color: isSelected ? 'inherit' : 'var(--accent-primary)' }}>TODAY</span>
              )}
            </button>
          );
        })}
      </div>

      {/* TASK CREATION FORM */}
      {showTaskForm && (
        <form onSubmit={handleTaskSubmit} className="bg-[var(--bg-card)] border border-[var(--accent-primary)]/40 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">New Planner Task</h3>
          <input
            type="text"
            placeholder="What do you plan to accomplish?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)]">
              <option value="work">Work</option>
              <option value="school">School</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
            </select>
            <select value={taskEst} onChange={(e) => setTaskEst(e.target.value)} className="px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)]">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
            </select>
            <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)]">
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)]" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryButton onClick={() => setShowTaskForm(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Create Task</PrimaryButton>
          </div>
        </form>
      )}

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        <div className="rounded-2xl p-5 space-y-3 animate-slideUp"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Tasks Completed</span>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--text-main)' }}>
              {completedCount} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/ {tasks.length}</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
              {tasks.length > 0 ? `${completionRate}%` : 'Active'}
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="h-1.5 rounded-full progress-bar" style={{ width: `${completionRate}%`, background: 'var(--accent-primary)' }} />
          </div>
        </div>

        <div className="rounded-2xl p-5 space-y-3 animate-slideUp"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Focus Time</span>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--text-main)' }}>
              {completedMinutes} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>min</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(139,92,246,0.12)', color: '#8B5CF6', border: '1px solid rgba(139,92,246,0.25)' }}>
              {estimatedMinutesTotal}m planned
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="h-1.5 rounded-full progress-bar" style={{ width: `${completionRate}%`, background: '#8B5CF6' }} />
          </div>
        </div>

        <div className="rounded-2xl p-5 space-y-3 animate-slideUp"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Day Streak</span>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--text-main)' }}>
              {streakCount} <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>days</span>
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Flame className="w-3 h-3" /> On Fire
            </span>
          </div>
          <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ background: 'var(--bg-base)' }}>
            <div className="h-1.5 rounded-full progress-bar" style={{ width: `${Math.min(streakCount * 10, 100)}%`, background: '#F59E0B' }} />
          </div>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: CHART & ACTIVE SCHEDULE */}
        <div className="lg:col-span-2 space-y-6">
          {/* PACE CHART */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-main)]">Completion & Energy Pace</h3>
                <p className="text-[11px] text-[var(--text-muted)]">Solid line: Today • Dashed line: Average pace</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9333EA]" />
                  <span className="text-[var(--text-muted)] text-[11px]">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                  <span className="text-[var(--text-muted)] text-[11px]">Avg Pace</span>
                </div>
              </div>
            </div>

            <div className="h-52 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#9333EA" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#9333EA" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#888888" fontSize={10} tickLine={false} />
                  <YAxis stroke="#888888" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px', fontSize: '11px', color: 'var(--text-main)' }} />
                  <Area type="monotone" dataKey="today" stroke="#9333EA" strokeWidth={3} fillOpacity={1} fill="url(#purpleGrad)" />
                  <Line type="monotone" dataKey="average" stroke="#FACC15" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TODAY TASKS */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>Focus Schedule</h3>
                {tasks.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'var(--accent-bg-subtle)', color: 'var(--accent-primary)' }}>
                    {tasks.length}
                  </span>
                )}
              </div>
              <button
                onClick={handleTriggerBrief}
                disabled={isGeneratingBrief}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all disabled:opacity-50"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBrief ? 'animate-spin' : ''}`}
                  style={{ color: isGeneratingBrief ? 'var(--accent-primary)' : undefined }} />
                <span>{isGeneratingBrief ? 'Optimizing...' : 'AI Briefing'}</span>
              </button>
            </div>

            <div className="p-4">
            {tasks.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
                  style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
                  <Sparkles className="w-6 h-6" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>No tasks planned yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Click "+ Add Task" to start building your day</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 stagger-children">
                {tasks.map((t) => {
                  const isDone = t.status === 'done';
                  const priority = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                  const emoji = CATEGORY_EMOJI[t.category] || CATEGORY_EMOJI.default;
                  return (
                    <SwipeableTaskCard
                      key={t.id}
                      onSwipeRight={() => onStatusChange(t, isDone ? 'pending' : 'done')}
                      onSwipeLeft={() => onStatusChange(t, 'pending')}
                    >
                      <div
                        className={`p-3.5 rounded-xl border-l-[3px] flex items-center justify-between gap-3 transition-all ${
                          isDone ? 'opacity-55' : 'hover:border-l-[3px]'
                        }`}
                        style={{
                          background: isDone ? 'var(--bg-base)' : 'var(--bg-base)',
                          borderColor: isDone ? 'var(--border-color)' : priority.dot,
                          border: `1px solid var(--border-color)`,
                          borderLeft: `3px solid ${isDone ? 'var(--border-color)' : priority.dot}`
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => onStatusChange(t, isDone ? 'pending' : 'done')}
                            className="shrink-0 transition-all hover:scale-110"
                            style={{ color: isDone ? 'var(--accent-primary)' : 'var(--text-muted)' }}
                          >
                            {isDone
                              ? <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                              : <Circle className="w-5 h-5" />
                            }
                          </button>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-semibold truncate ${
                              isDone ? 'line-through' : ''
                            }`} style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-main)' }}>
                              {emoji} {t.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>
                                {t.scheduled_time
                                  ? formatTimeRange(t.scheduled_time, t.estimated_minutes, timeFormat)
                                  : `${t.estimated_minutes}m est`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onStatusChange(t, isDone ? 'pending' : 'done')}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 transition-all hover:scale-105 ${
                            isDone ? '' : ''
                          }`}
                          style={{
                            background: isDone ? 'rgba(16,185,129,0.1)' : 'var(--btn-primary-bg)',
                            color: isDone ? '#10B981' : 'var(--btn-primary-text)',
                            border: isDone ? '1px solid rgba(16,185,129,0.3)' : 'none'
                          }}
                        >
                          {isDone ? '✓ Done' : 'Mark Done'}
                        </button>
                      </div>
                    </SwipeableTaskCard>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </div>

        {/* RIGHT COL: UP NEXT, OVERDUE, & STREAK HERO CARD */}
        <div className="space-y-6">
          {/* UP NEXT LIST */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Up Next</h3>
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic py-2">All tasks completed!</p>
            ) : (
              <div className="space-y-2">
                {upcomingTasks.slice(0, 3).map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 text-xs font-bold shrink-0">
                        {t.category ? t.category.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-main)] truncate">{t.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--accent-primary)] shrink-0">
                      {t.scheduled_time ? formatTime(t.scheduled_time, timeFormat) : `${t.estimated_minutes}m`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OVERDUE LIST */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Overdue Queue</h3>
            {overdueTasks.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic py-1">No overdue items!</p>
            ) : (
              <div className="space-y-2">
                {overdueTasks.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-between">
                    <div className="min-w-0">
                      <h5 className="text-xs font-medium text-[var(--text-main)] truncate">{t.title}</h5>
                      <span className="text-[10px] text-[var(--text-muted)] capitalize">{t.category}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30 text-[10px] font-mono font-bold shrink-0">
                      Overdue
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HERO GRADIENT STAT CARD */}
          <div className="bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#F59E0B] text-white rounded-3xl p-6 shadow-xl relative overflow-hidden space-y-2">
            <div className="flex items-center gap-2 opacity-80">
              <Flame className="w-5 h-5 text-amber-200" />
              <span className="text-xs font-bold uppercase tracking-wider">Consistency Record</span>
            </div>
            <div className="pt-2">
              <h2 className="text-5xl font-extrabold tracking-tight">{streakCount}</h2>
              <p className="text-xs font-semibold text-purple-100 mt-1">day streak achieved</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
