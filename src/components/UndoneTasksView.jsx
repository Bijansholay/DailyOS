import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Calendar, 
  Trash2, XSquare, AlertCircle, ArrowUpRight, Check
} from 'lucide-react';

export default function UndoneTasksView({ 
  tasks, 
  backlogTasks, 
  onStatusChange, 
  onScheduleTask, 
  onDeleteTask 
}) {
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Aggregate all undone tasks:
  // 1. Overdue tasks (scheduled_for < today & status !== 'done')
  // 2. Today's undone tasks (scheduled_for === today & status !== 'done')
  // 3. Backlog tasks (scheduled_for == null)
  const allUndoneTasks = [];

  tasks.forEach(t => {
    if (t.status !== 'done') {
      const isOverdue = t.scheduled_for && t.scheduled_for < todayStr;
      allUndoneTasks.push({
        ...t,
        isOverdue,
        isToday: t.scheduled_for === todayStr,
        isBacklog: false
      });
    }
  });

  backlogTasks.forEach(t => {
    if (t.status !== 'done') {
      allUndoneTasks.push({
        ...t,
        isOverdue: false,
        isToday: false,
        isBacklog: true
      });
    }
  });

  // Filter tasks
  const filteredTasks = allUndoneTasks.filter(t => {
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  // Total estimated time remaining for undone tasks
  const totalEstMinutes = filteredTasks.reduce((acc, t) => acc + (t.estimated_minutes || 30), 0);
  const totalEstHours = (totalEstMinutes / 60).toFixed(1);

  const overdueCount = filteredTasks.filter(t => t.isOverdue).length;
  const todayCount = filteredTasks.filter(t => t.isToday).length;
  const backlogCount = filteredTasks.filter(t => t.isBacklog).length;

  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 py-2"
      title="Component: <UndoneTasksView /> — Centralized Undone Tasks & Overdue Focus Dashboard (src/components/UndoneTasksView.jsx)"
    >
      {/* HEADER BAR */}
      <div className="border-b border-[#33302B] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[#D4A24C] uppercase">Executive Focus Queue</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[#E8E6E3] font-normal tracking-tight mt-1">
            Undone Tasks Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#24221F] px-4 py-2 rounded-lg border border-[#33302B] text-xs font-medium text-[#E8E6E3]">
            <span className="text-[#9E9A92]">Remaining Workload:</span>{' '}
            <strong className="text-[#D4A24C] font-mono">{totalEstHours} hrs</strong> ({totalEstMinutes}m)
          </div>
        </div>
      </div>

      {/* OVERVIEW STATS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="journal-card rounded-xl p-4 border-l-4 border-l-rose-500/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9A92]">Overdue Tasks</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-journal text-2xl text-[#E8E6E3]">{overdueCount}</span>
            <span className="text-xs text-rose-400 font-medium">Needs Attention</span>
          </div>
        </div>

        <div className="journal-card rounded-xl p-4 border-l-4 border-l-[#D4A24C]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9A92]">Scheduled Today</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-journal text-2xl text-[#E8E6E3]">{todayCount}</span>
            <span className="text-xs text-[#D4A24C] font-medium">Active Focus</span>
          </div>
        </div>

        <div className="journal-card rounded-xl p-4 border-l-4 border-l-[#66625B]">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9A92]">Unscheduled Backlog</span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-journal text-2xl text-[#E8E6E3]">{backlogCount}</span>
            <span className="text-xs text-[#9E9A92] font-medium">In Queue</span>
          </div>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#24221F] p-3 rounded-lg border border-[#33302B]">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold text-[#9E9A92] uppercase tracking-wider">Filter:</span>
          
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 journal-input rounded-md text-xs"
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
            className="px-3 py-1.5 journal-input rounded-md text-xs"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority Only</option>
            <option value="medium">Medium Priority Only</option>
            <option value="low">Low Priority Only</option>
          </select>
        </div>

        <span className="text-xs text-[#9E9A92]">
          Showing {filteredTasks.length} undone item{filteredTasks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* UNDONE TASKS LISTING */}
      {filteredTasks.length === 0 ? (
        <div className="journal-card rounded-xl p-12 text-center border border-[#33302B] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#1C1B19] border border-[#33302B] flex items-center justify-center mx-auto text-[#D4A24C]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="font-serif italic text-lg text-[#E8E6E3]">All caught up! No undone tasks match your filters.</p>
          <p className="text-xs text-[#9E9A92]">Enjoy your productive momentum.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#33302B]">
          {filteredTasks.map((task) => {
            const isHighPriority = task.priority === 'high';
            const isLowPriority = task.priority === 'low';

            return (
              <div 
                key={task.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-[#24221F]/50 px-3 rounded-lg transition-colors"
                title={`Undone Task: ${task.title} | Status: ${task.isOverdue ? 'OVERDUE' : task.isToday ? 'TODAY' : 'BACKLOG'}`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Mark Complete Checkbox */}
                  <button
                    onClick={() => onStatusChange(task, 'done')}
                    title="Action: Mark as done and record actual duration"
                    className="mt-1 text-[#45413A] hover:text-[#D4A24C] transition-colors shrink-0"
                  >
                    <Circle className="w-5 h-5" />
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.isOverdue && (
                        <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[10px] font-semibold rounded uppercase">
                          Overdue ({task.scheduled_for})
                        </span>
                      )}
                      {task.isToday && (
                        <span className="px-2 py-0.5 bg-[#D4A24C]/20 border border-[#D4A24C]/30 text-[#D4A24C] text-[10px] font-semibold rounded uppercase">
                          Today
                        </span>
                      )}
                      {task.isBacklog && (
                        <span className="px-2 py-0.5 bg-[#24221F] border border-[#33302B] text-[#9E9A92] text-[10px] font-semibold rounded uppercase">
                          Unscheduled
                        </span>
                      )}
                    </div>

                    <h4 className={`leading-snug ${
                      isHighPriority 
                        ? 'font-bold text-base md:text-lg text-[#E8E6E3]' 
                        : isLowPriority 
                          ? 'font-normal text-xs text-[#9E9A92]' 
                          : 'font-medium text-sm text-[#D1CECB]'
                    }`}>
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-[#9E9A92]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#66625B]" />
                        {task.estimated_minutes}m est
                      </span>
                      <span className="capitalize text-[#66625B]">{task.category}</span>
                    </div>
                  </div>
                </div>

                {/* QUICK ACTION CONTROLS */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  {!task.isToday && (
                    <button
                      onClick={() => onScheduleTask(task.id, todayStr)}
                      title="Action: Reschedule task to Today"
                      className="px-3 py-1.5 bg-[#D4A24C]/15 hover:bg-[#D4A24C]/25 text-[#D4A24C] text-xs font-semibold rounded-lg border border-[#D4A24C]/30 transition-all flex items-center gap-1"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Do Today</span>
                    </button>
                  )}

                  <button
                    onClick={() => onStatusChange(task, 'skipped')}
                    title="Action: Mark task as skipped"
                    className="p-1.5 text-[#9E9A92] hover:text-[#D4A24C] transition-colors"
                  >
                    <XSquare className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    title="Action: Delete task"
                    className="p-1.5 text-[#66625B] hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
