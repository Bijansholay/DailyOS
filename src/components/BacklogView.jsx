import React, { useState } from 'react';
import { Inbox, Plus, Calendar, Clock, Trash2 } from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton, ActionPillButton } from './Button';

export default function BacklogView({ 
  backlogTasks, 
  onAddTask, 
  onScheduleTask, 
  onDeleteTask 
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('work');
  const [estMinutes, setEstMinutes] = useState('30');
  const [priority, setPriority] = useState('medium');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddTask({
      title: title.trim(),
      category,
      estimated_minutes: parseInt(estMinutes, 10) || 30,
      priority,
      scheduled_for: null
    });
    setTitle('');
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">Unscheduled Queue</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[var(--text-main)] font-normal tracking-tight mt-1">
            Backlog
          </h1>
        </div>
        <PrimaryButton
          onClick={() => setShowForm(!showForm)}
          icon={Plus}
        >
          Add Task
        </PrimaryButton>
      </div>

      {/* ADD BACKLOG TASK FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="journal-card rounded-xl p-5 space-y-4 border border-[var(--border-color)]">
          <h3 className="font-journal text-lg text-[var(--text-main)]">New Backlog Entry</h3>
          <input
            type="text"
            placeholder="Task Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 journal-input rounded-lg text-sm"
            required
            autoFocus
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 journal-input rounded-lg text-xs"
              >
                <option value="work">Work</option>
                <option value="school">School</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Estimated Min</label>
              <select
                value={estMinutes}
                onChange={(e) => setEstMinutes(e.target.value)}
                className="w-full px-3 py-2 journal-input rounded-lg text-xs"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 journal-input rounded-lg text-xs"
              >
                <option value="high">High (Bigger text)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <SecondaryButton onClick={() => setShowForm(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Create Task
            </PrimaryButton>
          </div>
        </form>
      )}

      {/* TASKS LIST */}
      {backlogTasks.length === 0 ? (
        <div className="journal-card rounded-xl p-12 text-center border border-[var(--border-color)] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-base)] border border-[var(--border-color)] flex items-center justify-center mx-auto text-[var(--text-muted)]">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-[var(--text-muted)] font-serif italic text-base">Your backlog is empty.</p>
          <PrimaryButton
            onClick={() => setShowForm(true)}
            icon={Plus}
            className="mx-auto"
          >
            Add Task
          </PrimaryButton>
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-color)]">
          {backlogTasks.map((task) => {
            const isHighPriority = task.priority === 'high';
            const isLowPriority = task.priority === 'low';

            return (
              <div
                key={task.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-[var(--bg-card-hover)] px-3 rounded-lg transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className={`leading-snug ${
                    isHighPriority 
                      ? 'font-bold text-base md:text-lg text-[var(--text-main)]' 
                      : isLowPriority 
                        ? 'font-normal text-xs text-[var(--text-muted)]' 
                        : 'font-medium text-sm text-[var(--text-main)]'
                  }`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                      {task.estimated_minutes}m
                    </span>
                    <span className="capitalize text-[var(--text-muted)]">{task.category}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  <ActionPillButton
                    onClick={() => onScheduleTask(task.id, todayStr)}
                    icon={Calendar}
                    active
                    title="Schedule for Today"
                  >
                    Do Today
                  </ActionPillButton>
                  <ActionPillButton
                    onClick={() => onScheduleTask(task.id, tomorrowStr)}
                    icon={Calendar}
                    title="Schedule for Tomorrow"
                  >
                    Do Tomorrow
                  </ActionPillButton>
                  <IconButton
                    onClick={() => onDeleteTask(task.id)}
                    icon={Trash2}
                    danger
                    title="Delete task"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
