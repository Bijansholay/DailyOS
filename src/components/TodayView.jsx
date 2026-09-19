import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Plus, 
  Calendar, RefreshCw, XSquare, AlertCircle
} from 'lucide-react';

export default function TodayView({ 
  selectedDate, 
  tasks, 
  events, 
  dailyLog, 
  onStatusChange, 
  onAddTask, 
  onAddEvent,
  onGenerateAiBrief,
  theme 
}) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

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

  // Create map of suggested timings
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

  const handleTriggerBrief = async () => {
    setIsGeneratingBrief(true);
    await onGenerateAiBrief();
    setIsGeneratingBrief(false);
  };

  // Format date for journal header (e.g. "Tuesday, September 15")
  const formattedJournalDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Combine and sort events & tasks into a unified timeline
  const timelineItems = [];

  events.forEach(evt => {
    timelineItems.push({
      type: 'event',
      id: `evt-${evt.id}`,
      time: evt.event_time || '09:00',
      title: evt.title,
      category: evt.category,
      rawItem: evt
    });
  });

  tasks.forEach(task => {
    const suggestedTime = aiScheduleMap[task.id]?.suggested_time;
    const timeDisplay = task.scheduled_time || suggestedTime || 'Flex';
    timelineItems.push({
      type: 'task',
      id: task.id,
      time: timeDisplay,
      title: task.title,
      category: task.category,
      priority: task.priority,
      status: task.status,
      estimated_minutes: task.estimated_minutes,
      actual_minutes: task.actual_minutes,
      aiReason: aiScheduleMap[task.id]?.reason,
      rawItem: task
    });
  });

  // Sort timeline chronologically (Flex/Anytime at the bottom)
  timelineItems.sort((a, b) => {
    if (a.time === 'Flex') return 1;
    if (b.time === 'Flex') return -1;
    return a.time.localeCompare(b.time);
  });

  const completedCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div 
      className="max-w-4xl mx-auto space-y-8 py-2"
      title="Component: <TodayView /> — Chronological Day Planner & Timeline Engine (src/components/TodayView.jsx)"
    >
      {/* DAY JOURNAL HEADER */}
      <div 
        className={`border-b pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 transition-colors ${
          theme === 'light' ? 'border-slate-200/80' : 'border-[#27213A]'
        }`}
        title="Component: <JournalHeader /> — Renders date, completed task metrics, and entry triggers"
      >
        <div>
          <span className={`text-xs font-semibold tracking-widest uppercase ${
            theme === 'light' ? 'text-[#0284C7]' : 'text-[#A855F7]'
          }`}>
            Day Planner
          </span>
          <h1 className={`font-journal text-3xl md:text-4xl font-normal tracking-tight mt-1 ${
            theme === 'light' ? 'text-slate-900 font-semibold' : 'text-[#F5F3FF]'
          }`}>
            {formattedJournalDate}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${
            theme === 'light' ? 'text-slate-500' : 'text-[#948F9E]'
          }`} title="Function: Completion Progress Metric">
            {completedCount} of {tasks.length} tasks completed
          </span>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            title="Action: Opens inline task entry creation form"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all ${
              theme === 'light'
                ? 'bg-[#18181B] hover:bg-black text-white'
                : 'bg-[#A855F7] hover:bg-[#9333EA] text-white shadow-lg shadow-purple-600/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* PLAIN-TEXT PLAN INSIGHT HEADER CARD */}
      <div 
        className={`journal-card rounded-2xl p-6 relative group transition-all ${
          theme === 'light'
            ? 'border-l-4 border-l-[#0284C7] bg-gradient-to-r from-sky-50 to-white shadow-sm'
            : 'border-l-4 border-l-[#A855F7] bg-gradient-to-r from-[#A855F7]/15 via-[#9333EA]/5 to-[#141220] shadow-lg shadow-purple-950/20'
        }`}
        title="Component: <AIScheduleInsight /> — Generates plain-text energy-window analysis using Google Gemini API"
      >
        <div className="flex items-start justify-between gap-4">
          <p className={`text-sm md:text-base leading-relaxed font-serif italic ${
            theme === 'light' ? 'text-slate-800' : 'text-[#F5F3FF]'
          }`}>
            "{aiSummary?.insight || "Your afternoon fits best for deep focus — you complete 80% of tasks planned in your peak window."}"
          </p>
          <button
            onClick={handleTriggerBrief}
            disabled={isGeneratingBrief}
            title="Action: Triggers Google Gemini schedule optimization briefing"
            className={`transition-colors p-1 shrink-0 ${
              theme === 'light' ? 'text-slate-400 hover:text-[#0284C7]' : 'text-[#948F9E] hover:text-[#A855F7]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#A855F7] font-mono mt-2 block">
          💡 Component: &lt;AIScheduleInsight /&gt; — Gemini AI Telemetry Optimization
        </span>
      </div>

      {/* INLINE TASK / EVENT ADD FORM */}
      {showTaskForm && (
        <form 
          onSubmit={handleTaskSubmit} 
          className="journal-card rounded-xl p-5 space-y-4 border border-[#D4A24C]/40"
          title="Component: <TaskCreationForm /> — Captures task title, estimated duration, category, and priority weight"
        >
          <h3 className="font-journal text-lg text-[#E8E6E3]">New Schedule Item</h3>
          <input
            type="text"
            placeholder="What needs to be done today?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 journal-input rounded-lg text-sm"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-[#9E9A92] block mb-1">Category</label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                className="w-full px-3 py-2 journal-input rounded-lg text-xs"
              >
                <option value="work">Work</option>
                <option value="school">School</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#9E9A92] block mb-1">Estimated Time</label>
              <select
                value={taskEst}
                onChange={(e) => setTaskEst(e.target.value)}
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
              <label className="text-[11px] text-[#9E9A92] block mb-1">Priority</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full px-3 py-2 journal-input rounded-lg text-xs"
              >
                <option value="high">High (Bigger text)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-[#9E9A92] block mb-1">Time (Optional)</label>
              <input
                type="time"
                value={taskTime}
                onChange={(e) => setTaskTime(e.target.value)}
                className="w-full px-3 py-2 journal-input rounded-lg text-xs"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowTaskForm(false)}
              className="px-4 py-2 text-xs text-[#9E9A92] hover:text-[#E8E6E3]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] font-semibold rounded-lg text-xs"
            >
              Save to Planner
            </button>
          </div>
        </form>
      )}

      {/* RUNNING TIMELINE / DAY PLANNER LIST */}
      <div 
        className="space-y-0 relative"
        title="Component: <TimelineList /> — Chronological day execution timeline"
      >
        {timelineItems.length === 0 ? (
          <div className="py-12 text-center text-[#9E9A92] border-t border-b border-[#33302B]">
            <p className="font-serif italic text-lg">No entries scheduled for today.</p>
            <button
              onClick={() => setShowTaskForm(true)}
              className="mt-3 text-xs text-[#D4A24C] font-semibold hover:underline"
            >
              + Write your first entry
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#33302B]/60">
            {timelineItems.map((item) => {
              if (item.type === 'event') {
                return (
                  <div 
                    key={item.id} 
                    className="py-4 flex items-start gap-6 group hover:bg-[#24221F]/40 px-3 rounded-lg transition-colors"
                    title={`Component: <EventRow /> — Calendar Event: ${item.title}`}
                  >
                    {/* Time on the Left */}
                    <div className="w-20 shrink-0 text-right">
                      <span className="font-mono text-xs font-semibold text-[#D4A24C]">{item.time}</span>
                    </div>
                    {/* Timeline bar */}
                    <div className="w-2 h-2 rounded-full bg-[#D4A24C] mt-1.5 shrink-0" />
                    {/* Event Detail on Right */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-[#E8E6E3]">{item.title}</h4>
                      <span className="text-[11px] text-[#9E9A92] capitalize">{item.category} Event</span>
                    </div>
                  </div>
                );
              }

              const task = item.rawItem;
              const isDone = task.status === 'done';
              const isSkipped = task.status === 'skipped';
              const isLate = task.status === 'late';
              const isHighPriority = task.priority === 'high';
              const isLowPriority = task.priority === 'low';

              return (
                <div 
                  key={task.id}
                  title={`Component: <TaskItemRow id="${task.id}" /> — Priority: ${task.priority.toUpperCase()} | Est: ${task.estimated_minutes}m`}
                  className={`py-4 flex items-start gap-4 md:gap-6 group hover:bg-[#24221F]/50 px-3 rounded-lg transition-colors ${
                    isDone ? 'opacity-40' : isSkipped ? 'opacity-30' : ''
                  }`}
                >
                  {/* Time on the Left */}
                  <div className="w-16 md:w-20 shrink-0 text-right pt-0.5">
                    <span className={`font-mono text-xs ${isHighPriority ? 'text-[#D4A24C] font-semibold' : 'text-[#9E9A92]'}`}>
                      {item.time}
                    </span>
                  </div>

                  {/* Vertical Timeline Dot */}
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    isDone ? 'bg-[#33302B]' : isHighPriority ? 'bg-[#D4A24C]' : 'bg-[#45413A]'
                  }`} />

                  {/* Checkbox */}
                  <button
                    onClick={() => onStatusChange(task, isDone ? 'pending' : 'done')}
                    title="Action: Mark as completed and log actual duration"
                    className="mt-0.5 text-[#9E9A92] hover:text-[#D4A24C] transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-[#D4A24C]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#45413A]" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className={`leading-snug transition-all ${
                      isDone ? 'line-through text-[#9E9A92]' : ''
                    } ${
                      isHighPriority 
                        ? 'font-bold text-base md:text-lg text-[#E8E6E3]' 
                        : isLowPriority 
                          ? 'font-normal text-xs text-[#9E9A92]' 
                          : 'font-medium text-sm text-[#D1CECB]'
                    }`}>
                      {task.title}
                    </h4>

                    <div className="flex items-center gap-4 text-xs text-[#9E9A92]">
                      <span className="flex items-center gap-1" title="Telemetry: Estimated Duration">
                        <Clock className="w-3 h-3 text-[#66625B]" />
                        {task.estimated_minutes}m
                      </span>
                      {task.actual_minutes !== null && (
                        <span className="text-[#D4A24C] font-mono" title="Telemetry: Actual Logged Duration">
                          actual: {task.actual_minutes}m
                        </span>
                      )}
                      <span className="capitalize text-[#66625B]">{task.category}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isDone && (
                      <>
                        <button
                          onClick={() => onStatusChange(task, 'skipped')}
                          title="Action: Mark task as skipped (triggers skip streak detection)"
                          className="p-1.5 text-[#9E9A92] hover:text-[#D4A24C] transition-colors"
                        >
                          <XSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onStatusChange(task, 'late')}
                          title="Action: Mark task as late"
                          className="p-1.5 text-[#9E9A92] hover:text-[#D4A24C] transition-colors"
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
    </div>
  );
}
