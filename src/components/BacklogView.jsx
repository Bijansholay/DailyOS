import React, { useState } from 'react';
import { 
  Inbox, Plus, Calendar, Clock, Trash2, ArrowRight, Tag, AlertCircle 
} from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl text-white">Backlog</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Unscheduled tasks queued for future daily briefings
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-brand-500/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Backlog</span>
        </button>
      </div>

      {/* ADD BACKLOG TASK FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-5 space-y-4 border border-brand-500/30">
          <h3 className="font-semibold text-sm text-slate-200">New Backlog Task</h3>
          <input
            type="text"
            placeholder="Task Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 glass-input rounded-xl text-sm"
            required
            autoFocus
          />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              >
                <option value="work">Work</option>
                <option value="school">School</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Estimated Min</label>
              <select
                value={estMinutes}
                onChange={(e) => setEstMinutes(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
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
              <label className="block text-[11px] font-medium text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-xl text-xs"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* TASKS LIST */}
      {backlogTasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-slate-400 text-sm font-medium">Your backlog is empty!</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-brand-400 font-semibold hover:underline"
          >
            + Add a task to your backlog
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {backlogTasks.map((task) => (
            <div
              key={task.id}
              className="glass-card glass-card-hover rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase rounded-md border border-slate-700">
                    {task.category}
                  </span>
                  <span className={`text-[10px] font-semibold uppercase ${
                    task.priority === 'high' ? 'text-rose-400' : task.priority === 'medium' ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {task.priority} Priority
                  </span>
                </div>
                <h4 className="font-medium text-slate-200 text-sm">{task.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Est: {task.estimated_minutes}m</span>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-0 border-slate-800">
                <button
                  onClick={() => onScheduleTask(task.id, todayStr)}
                  className="px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 text-xs font-medium rounded-lg border border-brand-500/30 transition-all flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Today</span>
                </button>
                <button
                  onClick={() => onScheduleTask(task.id, tomorrowStr)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-all flex items-center gap-1"
                >
                  <span>Tomorrow</span>
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
