import React, { useState } from 'react';
import { Inbox, Plus, Calendar, Clock, Trash2 } from 'lucide-react';

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
      <div className="border-b border-[#33302B] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[#D4A24C] uppercase">Unscheduled Queue</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[#E8E6E3] font-normal tracking-tight mt-1">
            Backlog
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] rounded-lg text-xs font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Backlog</span>
        </button>
      </div>

      {/* ADD BACKLOG TASK FORM */}
      {showForm && (
        <form onSubmit={handleSubmit} className="journal-card rounded-xl p-5 space-y-4 border border-[#D4A24C]/40">
          <h3 className="font-journal text-lg text-[#E8E6E3]">New Backlog Entry</h3>
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
              <label className="block text-[11px] font-medium text-[#9E9A92] mb-1">Category</label>
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
              <label className="block text-[11px] font-medium text-[#9E9A92] mb-1">Estimated Min</label>
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
              <label className="block text-[11px] font-medium text-[#9E9A92] mb-1">Priority</label>
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
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs text-[#9E9A92] hover:text-[#E8E6E3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] font-semibold rounded-lg text-xs"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* TASKS LIST */}
      {backlogTasks.length === 0 ? (
        <div className="journal-card rounded-xl p-12 text-center border border-[#33302B] space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#1C1B19] border border-[#33302B] flex items-center justify-center mx-auto text-[#9E9A92]">
            <Inbox className="w-5 h-5" />
          </div>
          <p className="text-[#9E9A92] font-serif italic text-base">Your backlog is empty.</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-[#D4A24C] font-semibold hover:underline"
          >
            + Add a task to your backlog
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#33302B]">
          {backlogTasks.map((task) => {
            const isHighPriority = task.priority === 'high';
            const isLowPriority = task.priority === 'low';

            return (
              <div
                key={task.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:bg-[#24221F]/40 px-3 rounded-lg transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <h4 className={`leading-snug ${
                    isHighPriority 
                      ? 'font-bold text-base md:text-lg text-[#E8E6E3]' 
                      : isLowPriority 
                        ? 'font-normal text-xs text-[#9E9A92]' 
                        : 'font-medium text-sm text-[#D1CECB]'
                  }`}>
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-[#9E9A92]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#66625B]" />
                      {task.estimated_minutes}m
                    </span>
                    <span className="capitalize text-[#66625B]">{task.category}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                  <button
                    onClick={() => onScheduleTask(task.id, todayStr)}
                    className="px-3 py-1.5 bg-[#D4A24C]/15 hover:bg-[#D4A24C]/25 text-[#D4A24C] text-xs font-semibold rounded-lg border border-[#D4A24C]/30 transition-all flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Today</span>
                  </button>
                  <button
                    onClick={() => onScheduleTask(task.id, tomorrowStr)}
                    className="px-3 py-1.5 bg-[#24221F] hover:bg-[#292723] text-[#9E9A92] hover:text-[#E8E6E3] text-xs font-medium rounded-lg border border-[#33302B] transition-all"
                  >
                    Tomorrow
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-[#66625B] hover:text-[#D4A24C] transition-colors"
                    title="Delete"
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
