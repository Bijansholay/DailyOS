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
      badgeStyle: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
      iconColor: 'text-amber-500'
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

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    const agoText = daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
    return {
      label: `Overdue (${formattedDate} • ${agoText})`,
      sublabel: `Overdue • ${formattedDate}`,
      type: 'overdue',
      diffDays,
      badgeStyle: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
      iconColor: 'text-rose-500'
    };
  }

  if (diffDays === 0) {
    return {
      label: `Today (${formattedDate})`,
      sublabel: `Today • ${formattedDate}`,
      type: 'today',
      diffDays,
      badgeStyle: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
      iconColor: 'text-purple-500'
    };
  }

  return {
    label: `Scheduled for ${formattedDate}`,
    sublabel: `Upcoming • ${formattedDate}`,
    type: 'upcoming',
    diffDays,
    badgeStyle: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
    iconColor: 'text-blue-500'
  };
}

export default function UndoneTasksView({ 
  tasks = [], 
  backlogTasks = [], 
  allUndoneTasks: propAllUndone,
  onStatusChange, 
  onScheduleTask, 
  onDeleteTask,
  theme,
  timeFormat = '12h'
}) {
  const [filterDateGroup, setFilterDateGroup] = useState('all');
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
    <div className="max-w-5xl mx-auto space-y-8 py-2">
      {/* HEADER BAR */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)]">
            Master Focus Queue • All Days
          </span>
          <h1 className="font-journal text-3xl md:text-4xl text-[var(--text-main)] tracking-tight mt-1 font-bold">
            All Undone Tasks
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Comprehensive view of all pending, overdue, and upcoming scheduled tasks across your entire workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-medium shadow-sm">
            <span className="text-[var(--text-muted)]">Total Undone Workload:</span>{' '}
            <strong className="font-mono text-sm ml-1 text-[var(--accent-primary)]">{totalEstHours} hrs</strong> ({totalEstMinutes}m)
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'overdue' ? 'all' : 'overdue')}
          className={`p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-left transition-all ${
            filterDateGroup === 'overdue' ? 'ring-2 ring-rose-500 shadow-lg' : 'hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Overdue</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-main)]">{overdueCount}</span>
            <span className="text-[10px] font-semibold text-rose-500">Past due</span>
          </div>
        </button>

        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'today' ? 'all' : 'today')}
          className={`p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-left transition-all ${
            filterDateGroup === 'today' ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Scheduled Today</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-main)]">{todayCount}</span>
            <span className="text-[10px] font-semibold text-purple-500">Active today</span>
          </div>
        </button>

        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-left transition-all ${
            filterDateGroup === 'upcoming' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Upcoming Days</span>
            <CalendarDays className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-main)]">{upcomingCount}</span>
            <span className="text-[10px] font-semibold text-blue-500">Scheduled future</span>
          </div>
        </button>

        <button
          onClick={() => setFilterDateGroup(filterDateGroup === 'backlog' ? 'all' : 'backlog')}
          className={`p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-left transition-all ${
            filterDateGroup === 'backlog' ? 'ring-2 ring-amber-500 shadow-lg' : 'hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Backlog</span>
            <Inbox className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-[var(--text-main)]">{backlogCount}</span>
            <span className="text-[10px] font-semibold text-amber-500">Unscheduled</span>
          </div>
        </button>
      </div>

      {/* FILTERS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          <select
            value={filterDateGroup}
            onChange={(e) => setFilterDateGroup(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] font-medium outline-none"
          >
            <option value="all">All Days ({undoneWithMeta.length})</option>
            <option value="overdue">Overdue Only ({overdueCount})</option>
            <option value="today">Scheduled Today ({todayCount})</option>
            <option value="upcoming">Upcoming Days ({upcomingCount})</option>
            <option value="backlog">Unscheduled Backlog ({backlogCount})</option>
          </select>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] font-medium outline-none"
          >
            <option value="all">All Categories</option>
            <option value="work">Work</option>
            <option value="school">School</option>
            <option value="personal">Personal</option>
            <option value="health">Health</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-main)] font-medium outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>

        <span className="text-xs font-medium text-[var(--text-muted)]">
          Showing <strong className="text-[var(--text-main)]">{filteredTasks.length}</strong> undone task{filteredTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* UNDONE TASKS LISTING */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-3xl p-12 text-center border border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-main)]">
            All Caught Up!
          </h3>
          <p className="text-xs max-w-sm mx-auto text-[var(--text-muted)]">
            No undone tasks match your selected filter criteria. Great job staying on top of your responsibilities!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isHighPriority = task.priority === 'high';
            const meta = task.dateMeta;

            return (
              <SwipeableTaskCard
                key={task.id}
                onSwipeRight={() => onStatusChange(task, 'done')}
                onSwipeLeft={() => onScheduleTask(task.id, todayStr)}
                swipeLeftLabel="Do Today"
              >
                <div 
                  className="p-4 md:p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-primary)]/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group shadow-sm"
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <button
                      onClick={() => onStatusChange(task, 'done')}
                      title="Action: Mark as done"
                      className="mt-0.5 transition-colors shrink-0 text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                    >
                      <Circle className="w-5 h-5" />
                    </button>

                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${meta.badgeStyle}`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{meta.label}</span>
                        </span>

                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-muted)]">
                          {task.category || 'general'}
                        </span>

                        {isHighPriority && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 border border-rose-500/20">
                            High Priority
                          </span>
                        )}
                      </div>

                      <h4 className={`leading-snug ${isHighPriority ? 'font-bold text-base text-[var(--text-main)]' : 'font-semibold text-sm text-[var(--text-main)]'}`}>
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {task.scheduled_time 
                            ? formatTimeRange(task.scheduled_time, task.estimated_minutes || 30, timeFormat)
                            : `${task.estimated_minutes || 30}m estimated`}
                        </span>
                      </div>
                    </div>
                  </div>

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
}
