import React, { useState } from 'react';
import { Inbox, Plus, Calendar, Clock, Trash2, Search, X } from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton, ActionPillButton } from './Button';

const PRIORITY_BORDER = { high: '#EC4899', medium: '#F59E0B', low: '#10B981' };
const CATEGORY_EMOJI = { work: '💼', school: '📚', personal: '🏠', health: '🏃', default: '📌' };

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
  const [search, setSearch] = useState('');

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

  const filtered = search.trim()
    ? backlogTasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || (t.category || '').toLowerCase().includes(search.toLowerCase()))
    : backlogTasks;

  const totalMinutes = backlogTasks.reduce((s, t) => s + (t.estimated_minutes || 30), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* HEADER */}
      <div className="border-b pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--accent-primary)' }}>Unscheduled Queue</span>
          <h1 className="font-journal text-3xl md:text-4xl font-normal tracking-tight mt-1" style={{ color: 'var(--text-main)' }}>
            Backlog
          </h1>
          {backlogTasks.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {backlogTasks.length} tasks · {totalHours} hrs estimated workload
            </p>
          )}
        </div>
        <PrimaryButton onClick={() => setShowForm(!showForm)} icon={Plus}>
          Add to Backlog
        </PrimaryButton>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 space-y-4 animate-slideUp"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-primary)', boxShadow: '0 0 0 1px var(--accent-bg-subtle)' }}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>New Backlog Entry</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-1 rounded-lg transition-colors" style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            placeholder="What do you want to do someday?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 journal-input rounded-xl text-sm"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl text-xs journal-input">
              <option value="work">💼 Work</option>
              <option value="school">📚 School</option>
              <option value="personal">🏠 Personal</option>
              <option value="health">🏃 Health</option>
            </select>
            <select value={estMinutes} onChange={(e) => setEstMinutes(e.target.value)} className="px-3 py-2 rounded-xl text-xs journal-input">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hrs</option>
              <option value="120">2 hours</option>
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-3 py-2 rounded-xl text-xs journal-input">
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryButton onClick={() => setShowForm(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Add to Backlog</PrimaryButton>
          </div>
        </form>
      )}

      {/* SEARCH */}
      {backlogTasks.length > 3 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search backlog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 journal-input rounded-2xl text-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* TASKS LIST */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl p-14 text-center space-y-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
            <Inbox className="w-6 h-6" style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
              {search ? 'No tasks match your search' : 'Your backlog is empty'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Try a different keyword' : 'Capture ideas here — schedule them when you\'re ready'}
            </p>
          </div>
          {!search && (
            <PrimaryButton onClick={() => setShowForm(true)} icon={Plus} className="mx-auto">
              Capture First Idea
            </PrimaryButton>
          )}
        </div>
      ) : (
        <div className="space-y-2 stagger-children">
          {filtered.map((task) => {
            const borderColor = PRIORITY_BORDER[task.priority] || PRIORITY_BORDER.medium;
            const emoji = CATEGORY_EMOJI[task.category] || CATEGORY_EMOJI.default;
            return (
              <div
                key={task.id}
                className="rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 transition-all hover:translate-x-0.5"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${borderColor}`
                }}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{ background: `${borderColor}15`, color: borderColor, border: `1px solid ${borderColor}30` }}>
                      {task.priority}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold truncate" style={{ color: 'var(--text-main)' }}>
                    {emoji} {task.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.estimated_minutes}m
                    </span>
                    <span className="capitalize">{task.category}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ActionPillButton onClick={() => onScheduleTask(task.id, todayStr)} icon={Calendar} active title="Do Today">
                    Today
                  </ActionPillButton>
                  <ActionPillButton onClick={() => onScheduleTask(task.id, tomorrowStr)} icon={Calendar} title="Do Tomorrow">
                    Tomorrow
                  </ActionPillButton>
                  <IconButton onClick={() => onDeleteTask(task.id)} icon={Trash2} danger title="Delete" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom summary */}
      {filtered.length > 0 && (
        <p className="text-center text-xs pb-4" style={{ color: 'var(--text-muted)' }}>
          {search ? `${filtered.length} of ${backlogTasks.length}` : backlogTasks.length} items in backlog
          {!search && ` · Schedule them regularly to keep this list lean`}
        </p>
      )}
    </div>
  );
}
