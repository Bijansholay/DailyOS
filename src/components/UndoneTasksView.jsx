import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Calendar, 
  Trash2, XSquare, AlertCircle, ArrowUpRight, Check,
  Inbox, Layers, AlertTriangle, Filter, CalendarDays
} from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton, ActionPillButton } from './Button';
import { formatTime, formatTimeRange } from '../utils/timeFormat';
import SwipeableTaskCard from './SwipeableTaskCard';

function getTaskDateMeta(scheduledFor) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!scheduledFor) {
    return {
      label: 'Unscheduled Backlog',
      sublabel: 'Backlog',
      type: 'backlog',
      diffDays: 9999,
      badgeStyleDark: 'bg-[#2A2416] text-[#FACC15] border-[#4D3F1B]',
      badgeStyleLight: 'bg-amber-50 text-amber-800 border-amber-200',
      iconColor: 'text-[#FACC15]'
    };
  }

  const todayDate = new Date(todayStr + 'T00:00:00');
  const taskDate = new Date(scheduledFor + 'T00:00:00');

  const diffTime = taskDate.getTime() - todayDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  const options = { month: 'short', day: 'numeric' };
  if (taskDate.getFullYear() !== todayDate.getFullYear()) {
    options.year = 'numeric';
  }
  const formattedDate = taskDate.toLocaleDateString('en-US', options);
  const weekdayStr = taskDate.toLocaleDateString('en-US', { weekday: 'short' });

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    const agoText = daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
    return {
      label: `Overdue (${formattedDate} • ${agoText})`,
      sublabel: `Overdue • ${formattedDate}`,
      type: 'overdue',
      diffDays,
      badgeStyleDark: 'bg-rose-950/70 text-rose-300 border-rose-800/80',
      badgeStyleLight: 'bg-rose-50 text-rose-700 border-rose-200',
      iconColor: 'text-rose-400'
    };
  }

  if (diffDays === 0) {
    return {
      label: `Today (${formattedDate})`,
      sublabel: `Today • ${formattedDate}`,
      type: 'today',
      diffDays,
      badgeStyleDark: 'bg-purple-950/70 text-purple-300 border-purple-800/80',
      badgeStyleLight: 'bg-blue-50 text-blue-700 border-blue-200',
      iconColor: 'text-purple-400'
    };
  }

  if (diffDays === 1) {
    return {
      label: `Tomorrow (${weekdayStr}, ${formattedDate})`,
      sublabel: `Tomorrow • ${formattedDate}`,
      type: 'upcoming',
      diffDays,
      badgeStyleDark: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80',
      badgeStyleLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconColor: 'text-emerald-400'
    };
  }

  return {
    label: `${weekdayStr}, ${formattedDate}`,
    sublabel: `${weekdayStr}, ${formattedDate}`,
    type: 'upcoming',
    diffDays,
    badgeStyleDark: 'bg-indigo-950/70 text-indigo-300 border-indigo-800/80',
    badgeStyleLight: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconColor: 'text-indigo-400'
  };
}

export default function UndoneTasksView({ 
  tasks = [], 
  allUndoneTasks: propAllUndone,
  backlogTasks = [], 
  onStatusChange, 
  onScheduleTask, 
  onDeleteTask,
  theme,
  timeFormat = '12h'
}) {
  const [filterDateGroup, setFilterDateGroup] = useState('all'); // all | overdue | today | upcoming | backlog
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Consolidate all undone tasks across ALL days:
  let rawUndoneList = [];
  if (propAllUndone && Array.isArray(propAllUndone)) {
    rawUndoneList = propAllUndone.filter(t => t.status !== 'done');
  } else {
    // Fallback: merge tasks state and backlogTasks state
    const seenIds = new Set();
    tasks.forEach(t => {
      if (t.status !== 'done' && !seenIds.has(t.id)) {
        seenIds.add(t.id);
        rawUndoneList.push(t);
      }
    });
    backlogTasks.forEach(t => {
      if (t.status !== 'done' && !seenIds.has(t.id)) {
        seenIds.add(t.id);
        rawUndoneList.push(t);
      }
    });
  }

  // Attach date metadata to every task
  const undoneWithMeta = rawUndoneList.map(t => {
    const meta = getTaskDateMeta(t.scheduled_for);
    return {
      ...t,
      dateMeta: meta
    };
  });

  // Sort tasks chronologically: Overdue first (oldest first), then Today, then Upcoming (earliest first), then Backlog
  undoneWithMeta.sort((a, b) => {
    if (a.dateMeta.type === 'overdue' && b.dateMeta.type !== 'overdue') return -1;
    if (b.dateMeta.type === 'overdue' && a.dateMeta.type !== 'overdue') return 1;
    if (a.dateMeta.type === 'today' && b.dateMeta.type !== 'today') return -1;
    if (b.dateMeta.type === 'today' && a.dateMeta.type !== 'today') return 1;
    return a.dateMeta.diffDays - b.dateMeta.diffDays;
  });

  // Filter tasks
  const filteredTasks = undoneWithMeta.filter(t => {
    if (filterDateGroup !== 'all' && t.dateMeta.type !== filterDateGroup) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  // Compute counts
  const overdueCount = undoneWithMeta.filter(t => t.dateMeta.type === 'overdue').length;
  const todayCount = undoneWithMeta.filter(t => t.dateMeta.type === 'today').length;
  const upcomingCount = undoneWithMeta.filter(t => t.dateMeta.type === 'upcoming').length;
  const backlogCount = undoneWithMeta.filter(t => t.dateMeta.type === 'backlog').length;

  const totalEstMinutes = filteredTasks.reduce((acc, t) => acc + (t.estimated_minutes || 30), 0);
  const totalEstHours = (totalEstMinutes / 60).toFixed(1);

  return (
    <div 
      className="max-w-5xl mx-auto space-y-8 py-2"
      title="Component: <UndoneTasksView /> — Centralized Undone Tasks Dashboard Across All Days (src/components/UndoneTasksView.jsx)"
    >
      {/* HEADER BAR */}
      <div className={`border-b pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 transition-colors ${
        theme === 'light' ? 'border-slate-200' : 'border-[#27213A]'
      }`}>
        <div>
          <span className={`text-xs font-semibold tracking-widest uppercase ${
            theme === 'light' ? 'text-[#0284C7]' : 'text-[#A855F7]'
          }`}>
            Master Focus Queue • All Days
          </span>
          <h1 className={`font-journal text-3xl md:text-4xl tracking-tight mt-1 ${
            theme === 'light' ? 'text-slate-900 font-bold' : 'text-white font-normal'
          }`}>
            All Undone Tasks
          </h1>
          <p className={`text-xs mt-1 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            Comprehensive view of all pending, overdue, and upcoming scheduled tasks across your entire workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2.5 rounded-2xl border text-xs font-medium shadow-sm transition-colors ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#1C1924] border-[#2D273C] text-white'
          }`}>
            <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>Total Undone Workload:</span>{' '}
            <strong className={`font-mono text-sm ml-1 ${theme === 'light' ? 'text-[#0284C7]' : 'text-[#A855F7]'}`}>{totalEstHours} hrs</strong> ({totalEstMinutes}m)
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterDateGroup === 'overdue'
              ? 'ring-2 ring-rose-500 shadow-lg'
              : ''
          } ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-rose-300'
              : 'bg-[#1C1924] border-[#2D273C] hover:border-rose-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{overdueCount}</span>
            <span className="text-[10px] font-semibold text-rose-500">Past due</span>
          </div>
        </button>

        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'today' ? 'all' : 'today')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterDateGroup === 'today'
              ? 'ring-2 ring-purple-500 shadow-lg'
              : ''
          } ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-blue-300'
              : 'bg-[#1C1924] border-[#2D273C] hover:border-purple-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Scheduled Today</span>
            <Clock className={`w-4 h-4 ${theme === 'light' ? 'text-blue-600' : 'text-purple-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{todayCount}</span>
            <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-blue-600' : 'text-purple-400'}`}>Active today</span>
          </div>
        </button>

        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterDateGroup === 'upcoming'
              ? 'ring-2 ring-indigo-500 shadow-lg'
              : ''
          } ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-indigo-300'
              : 'bg-[#1C1924] border-[#2D273C] hover:border-indigo-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Upcoming Days</span>
            <CalendarDays className={`w-4 h-4 ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{upcomingCount}</span>
            <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'}`}>Scheduled future</span>
          </div>
        </button>

        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'backlog' ? 'all' : 'backlog')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterDateGroup === 'backlog'
              ? 'ring-2 ring-amber-500 shadow-lg'
              : ''
          } ${
            theme === 'light'
              ? 'bg-white border-slate-200 hover:border-amber-300'
              : 'bg-[#1C1924] border-[#2D273C] hover:border-amber-900/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>Backlog</span>
            <Inbox className={`w-4 h-4 ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{backlogCount}</span>
            <span className={`text-[10px] font-semibold ${theme === 'light' ? 'text-amber-600' : 'text-amber-400'}`}>Unscheduled</span>
          </div>
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#1C1924] border-[#2D273C]'
      }`}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Date Group Filter */}
          <select
            value={filterDateGroup}
            onChange={(e) => setFilterDateGroup(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs border font-medium outline-none transition-all ${
              theme === 'light' 
                ? 'bg-slate-50 border-slate-200 text-slate-800' 
                : 'bg-[#121114] border-[#2D273C] text-white'
            }`}
          >
            <option value="all">All Days ({undoneWithMeta.length})</option>
            <option value="overdue">Overdue Only ({overdueCount})</option>
            <option value="today">Scheduled Today ({todayCount})</option>
            <option value="upcoming">Upcoming Days ({upcomingCount})</option>
            <option value="backlog">Unscheduled Backlog ({backlogCount})</option>
          </select>
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs border font-medium outline-none transition-all ${
              theme === 'light' 
                ? 'bg-slate-50 border-slate-200 text-slate-800' 
                : 'bg-[#121114] border-[#2D273C] text-white'
            }`}
          >
            <option value="all">All Categories</option>
            <option value="work">Work</option>
            <option value="school">School</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={`px-3 py-1.5 rounded-xl text-xs border font-medium outline-none transition-all ${
              theme === 'light' 
                ? 'bg-slate-50 border-slate-200 text-slate-800' 
                : 'bg-[#121114] border-[#2D273C] text-white'
            }`}
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <span className={`text-xs font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          Showing <strong className={theme === 'light' ? 'text-slate-900' : 'text-white'}>{filteredTasks.length}</strong> undone task{filteredTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* UNDONE TASKS LISTING */}
      {filteredTasks.length === 0 ? (
        <div className={`rounded-3xl p-12 text-center border space-y-3 ${
          theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#1C1924] border-[#2D273C]'
        }`}>
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-slate-800' : 'text-white'}`}>
            All Caught Up!
          </h3>
          <p className={`text-xs max-w-sm mx-auto ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
            No undone tasks match your selected filter criteria. Great job staying on top of your responsibilities!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isHighPriority = task.priority === 'high';
            const isLowPriority = task.priority === 'low';
            const meta = task.dateMeta;
            const badgeStyle = theme === 'light' ? meta.badgeStyleLight : meta.badgeStyleDark;

            return (
              <SwipeableTaskCard
                key={task.id}
                onSwipeRight={() => onStatusChange(task, 'done')}
                onSwipeLeft={() => onScheduleTask(task.id, todayStr)}
                swipeLeftLabel="Do Today"
              >
                <div 
                  className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group ${
                    theme === 'light' 
                      ? 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300' 
                      : 'bg-[#1C1924] border-[#2D273C] hover:bg-[#231F2E] hover:border-[#3B334D]'
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Mark Complete Checkbox */}
                    <button
                      onClick={() => onStatusChange(task, 'done')}
                      title="Action: Mark as done and record actual duration"
                      className={`mt-0.5 transition-colors shrink-0 ${
                        theme === 'light' ? 'text-slate-400 hover:text-emerald-600' : 'text-slate-500 hover:text-purple-400'
                      }`}
                    >
                      <Circle className="w-5 h-5" />
                    </button>

                    <div className="space-y-2 min-w-0 flex-1">
                      {/* ATTACHED DATE & CATEGORY BADGES */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* PROMINENT ATTACHED DATE BADGE */}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${badgeStyle}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </span>

                        {/* CATEGORY BADGE */}
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          theme === 'light'
                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                            : 'bg-[#121114] text-slate-400 border-[#2D273C]'
                        }`}>
                          {task.category || 'general'}
                        </span>

                        {/* PRIORITY BADGE */}
                        {isHighPriority && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            High Priority
                          </span>
                        )}
                      </div>

                      {/* TASK TITLE */}
                      <h4 className={`leading-snug ${
                        theme === 'light'
                          ? isHighPriority ? 'font-bold text-base text-slate-900' : 'font-semibold text-sm text-slate-800'
                          : isHighPriority ? 'font-bold text-base text-white' : 'font-medium text-sm text-slate-100'
                      }`}>
                        {task.title}
                      </h4>

                      {/* DURATION & SCHEDULED TIME METADATA */}
                      <div className={`flex items-center gap-4 text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {task.scheduled_time 
                            ? formatTimeRange(task.scheduled_time, task.estimated_minutes || 30, timeFormat)
                            : `${task.estimated_minutes || 30}m estimated`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACTION CONTROLS */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-color)]">
                    {meta.type !== 'today' && (
                      <ActionPillButton
                        onClick={() => onScheduleTask(task.id, todayStr)}
                        icon={Calendar}
                        active
                        title="Schedule for Today"
                      >
                        Do Today
                      </ActionPillButton>
                    )}

                    <IconButton
                      onClick={() => onStatusChange(task, 'skipped')}
                      icon={XSquare}
                      title="Skip task"
                    />

                    <IconButton
                      onClick={() => onDeleteTask(task.id)}
                      icon={Trash2}
                      danger
                      title="Delete task"
                    />
                  </div>
                </div>
              </SwipeableTaskCard>
            );
          })}
        </div>
      )}
    </div>
  );

