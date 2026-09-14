import React, { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, Circle, AlertCircle, Clock, Plus, 
  Calendar, Zap, Tag, ChevronRight, RefreshCw, XSquare, Check 
} from 'lucide-react';

export default function TodayView({ 
  selectedDate, 
  tasks, 
  events, 
  dailyLog, 
  onStatusChange, 
  onAddTask, 
  onAddEvent,
  onGenerateAiBrief 
}) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState('work');
  const [taskEst, setTaskEst] = useState('30');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskTime, setTaskTime] = useState('');

  // New event form state
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [eventCategory, setEventCategory] = useState('meeting');

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

  // Create map of AI suggested timing
  const aiScheduleMap = {};
  if (aiSummary?.schedule) {
    aiSummary.schedule.forEach(item => {
      if (item.task_id) {
        aiScheduleMap[item.task_id] = item;
      }
    });
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

  const handleEventSubmit = (e) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    onAddEvent({
      title: eventTitle.trim(),
      event_date: selectedDate,
      event_time: eventTime || null,
      category: eventCategory
    });
    setEventTitle('');
    setShowEventForm(false);
  };

  const handleTriggerAi = async () => {
    setIsGeneratingAi(true);
    await onGenerateAiBrief();
    setIsGeneratingAi(false);
  };

  const categoryColors = {
    work: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
    school: 'border-violet-500/40 text-violet-400 bg-violet-500/10',
    personal: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    health: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    meeting: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
  };

  return (
    <div className="space-y-6">
      {/* AI INSIGHT BANNER */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-brand-500/30">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-brand-500/20 to-violet-500/20 rounded-xl border border-brand-500/30 text-brand-400 shadow-inner">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-lg text-white">Daily AI Briefing</h2>
                <span className="px-2 py-0.5 bg-brand-500/20 text-brand-300 rounded-md text-[10px] uppercase font-bold tracking-wider">
                  Gemini AI
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-1 leading-relaxed max-w-2xl">
                {aiSummary?.insight || "Click below to compute today's AI-optimized task sequence and behavioral productivity reflection based on historical performance."}
              </p>
            </div>
          </div>
          <button
            onClick={handleTriggerAi}
            disabled={isGeneratingAi}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-lg shadow-brand-500/20 transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAi ? 'Analyzing Data...' : 'Generate Daily Brief'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TASKS LISTING (2 COLS) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-200 text-lg">Today's Tasks</h3>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full font-medium">
                {tasks.length}
              </span>
            </div>
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 rounded-xl text-xs font-medium border border-brand-500/30 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>

          {/* ADD TASK INLINE FORM */}
          {showTaskForm && (
            <form onSubmit={handleTaskSubmit} className="glass-card rounded-xl p-4 space-y-3 border border-brand-500/30">
              <input
                type="text"
                placeholder="What do you need to accomplish?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                required
                autoFocus
              />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select
                  value={taskCategory}
                  onChange={(e) => setTaskCategory(e.target.value)}
                  className="px-2 py-1.5 glass-input rounded-lg text-xs"
                >
                  <option value="work">Work</option>
                  <option value="school">School</option>
                  <option value="personal">Personal</option>
                  <option value="health">Health</option>
                </select>
                <select
                  value={taskEst}
                  onChange={(e) => setTaskEst(e.target.value)}
                  className="px-2 py-1.5 glass-input rounded-lg text-xs"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="px-2 py-1.5 glass-input rounded-lg text-xs"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
                <input
                  type="time"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                  className="px-2 py-1.5 glass-input rounded-lg text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTaskForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {tasks.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center text-slate-400 border border-slate-800">
              <p className="text-sm">No tasks scheduled for today.</p>
              <button
                onClick={() => setShowTaskForm(true)}
                className="mt-3 text-xs text-brand-400 font-medium hover:underline"
              >
                + Add your first task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const aiSuggestion = aiScheduleMap[task.id];
                const catClass = categoryColors[task.category] || categoryColors.personal;
                const isDone = task.status === 'done';
                const isSkipped = task.status === 'skipped';
                const isLate = task.status === 'late';

                return (
                  <div
                    key={task.id}
                    className={`glass-card glass-card-hover rounded-xl p-4 relative flex items-center justify-between gap-4 border ${
                      isDone ? 'border-emerald-500/30 opacity-75' : isSkipped ? 'border-slate-800 opacity-50' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => onStatusChange(task, isDone ? 'pending' : 'done')}
                        className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${catClass}`}>
                            {task.category}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase ${
                            task.priority === 'high' ? 'text-rose-400' : task.priority === 'medium' ? 'text-amber-400' : 'text-slate-400'
                          }`}>
                            {task.priority}
                          </span>
                          {aiSuggestion?.suggested_time && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] rounded-md font-medium">
                              <Sparkles className="w-2.5 h-2.5" />
                              AI Suggest: {aiSuggestion.suggested_time}
                            </span>
                          )}
                        </div>

                        <h4 className={`font-medium text-slate-200 text-sm truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                          {task.title}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            Est: {task.estimated_minutes}m
                          </span>
                          {task.actual_minutes !== null && (
                            <span className="text-emerald-400 font-medium">
                              Actual: {task.actual_minutes}m
                            </span>
                          )}
                          {task.scheduled_time && (
                            <span className="text-slate-400">
                              Time: {task.scheduled_time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* STATUS QUICK TOGGLES */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isDone && (
                        <>
                          <button
                            onClick={() => onStatusChange(task, 'skipped')}
                            title="Mark Skipped"
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              isSkipped 
                                ? 'bg-slate-700 text-slate-300 border-slate-600' 
                                : 'bg-dark-800 text-slate-500 border-slate-800 hover:text-amber-400 hover:border-amber-500/30'
                            }`}
                          >
                            <XSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onStatusChange(task, 'late')}
                            title="Mark Late"
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              isLate 
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                                : 'bg-dark-800 text-slate-500 border-slate-800 hover:text-rose-400 hover:border-rose-500/30'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* EVENTS & TIMELINE (1 COL) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-200 text-lg">Scheduled Events</h3>
              <span className="px-2.5 py-0.5 bg-slate-800 text-slate-400 text-xs rounded-full font-medium">
                {events.length}
              </span>
            </div>
            <button
              onClick={() => setShowEventForm(!showEventForm)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Event</span>
            </button>
          </div>

          {/* ADD EVENT FORM */}
          {showEventForm && (
            <form onSubmit={handleEventSubmit} className="glass-card rounded-xl p-4 space-y-3 border border-slate-700">
              <input
                type="text"
                placeholder="Event Title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                required
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="px-2 py-1.5 glass-input rounded-lg text-xs"
                />
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value)}
                  className="px-2 py-1.5 glass-input rounded-lg text-xs"
                >
                  <option value="meeting">Meeting</option>
                  <option value="personal">Personal</option>
                  <option value="work">Work</option>
                  <option value="health">Health</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEventForm(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium"
                >
                  Add Event
                </button>
              </div>
            </form>
          )}

          {events.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center text-slate-400 border border-slate-800">
              <p className="text-xs">No events scheduled today.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((evt) => (
                <div key={evt.id} className="glass-card rounded-xl p-3.5 border border-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-medium text-slate-200 text-xs truncate">{evt.title}</h5>
                    <p className="text-[11px] text-slate-400">
                      {evt.event_time || 'All Day'} • <span className="capitalize">{evt.category}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
