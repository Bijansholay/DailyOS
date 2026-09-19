import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Clock, Plus, 
  Calendar, RefreshCw, XSquare, AlertCircle, Sparkles, Flame, Zap
} from 'lucide-react';
import { AreaChart, Area, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  onSelectDate 
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

  // Chart pace data (today's pace vs average pace)
  const chartData = [
    { time: '7am', today: 1, average: 1.2 },
    { time: '9am', today: 2, average: 2.1 },
    { time: '11am', today: 2.5, average: 2.8 },
    { time: '1pm', today: 1.8, average: 2.4 },
    { time: '3pm', today: 4.2, average: 3.1 },
    { time: '5pm', today: 3.5, average: 3.8 },
    { time: '7pm', today: 2.8, average: 2.5 },
    { time: '9pm', today: 1.5, average: 1.8 },
  ];

  // DARK MODE LAYOUT (Reference A — Nixtio Style)
  if (theme === 'dark') {
    return (
      <div className="space-y-6">
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Today</h1>
            <p className="text-xs text-[#9C95A8] mt-1">{formattedJournalDate} • {completedCount} of {tasks.length} tasks completed</p>
          </div>
          <button
            onClick={() => setShowTaskForm(!showTaskForm)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#9333EA] to-[#A855F7] hover:from-[#7C3AED] hover:to-[#9333EA] text-white rounded-full text-xs font-semibold shadow-lg shadow-purple-950/40 shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Entry</span>
          </button>
        </div>

        {/* HORIZONTAL DATE RIBBON (Reference A Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {calendarDays.map((d) => {
            const isSelected = d.dateStr === selectedDate;
            return (
              <button
                key={d.dateStr}
                onClick={() => onSelectDate && onSelectDate(d.dateStr)}
                className={`flex flex-col items-center justify-center min-w-[64px] px-3 py-2.5 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-[#F5F1E8] text-[#121114] font-bold shadow-lg shadow-purple-950/40 scale-105'
                    : 'bg-[#1C1924] text-[#9C95A8] border border-[#2D273C] hover:text-white hover:border-[#423A57]'
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">{d.dayNum}</span>
                <span className="text-xs">{d.dayName}</span>
              </button>
            );
          })}
        </div>

        {/* TASK CREATION FORM */}
        {showTaskForm && (
          <form onSubmit={handleTaskSubmit} className="bg-[#1C1924] border border-[#9333EA]/40 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-semibold text-white">Add Task Entry</h3>
            <input
              type="text"
              placeholder="What do you plan to accomplish?"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#121114] border border-[#2D273C] text-xs text-white outline-none focus:border-[#9333EA]"
              required
              autoFocus
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="px-3 py-2 rounded-xl bg-[#121114] border border-[#2D273C] text-xs text-white">
                <option value="work">Work</option>
                <option value="school">School</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
              </select>
              <select value={taskEst} onChange={(e) => setTaskEst(e.target.value)} className="px-3 py-2 rounded-xl bg-[#121114] border border-[#2D273C] text-xs text-white">
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
              <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="px-3 py-2 rounded-xl bg-[#121114] border border-[#2D273C] text-xs text-white">
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="px-3 py-2 rounded-xl bg-[#121114] border border-[#2D273C] text-xs text-white" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-[#9333EA] hover:bg-[#7C3AED] text-white rounded-xl text-xs font-semibold">Save Task</button>
            </div>
          </form>
        )}

        {/* MAIN DASHBOARD CONTENT (Reference A Grid Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT 2 COLS: CHART & ACTIVE SCHEDULE */}
          <div className="lg:col-span-2 space-y-6">
            {/* PACE & ENERGY CHART (Reference A Statistics Area Chart) */}
            <div className="bg-[#1C1924] border border-[#2D273C] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Completion & Energy Pace</h3>
                  <p className="text-[11px] text-[#9C95A8]">Solid purple: Today • Dashed yellow: Average pace</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9333EA]" />
                    <span className="text-slate-300 text-[11px]">Today</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FACC15]" />
                    <span className="text-slate-300 text-[11px]">Avg Pace</span>
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
                    <XAxis dataKey="time" stroke="#665E75" fontSize={10} tickLine={false} />
                    <YAxis stroke="#665E75" fontSize={10} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#121114', borderColor: '#2D273C', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                    <Area type="monotone" dataKey="today" stroke="#9333EA" strokeWidth={3} fillOpacity={1} fill="url(#purpleGrad)" />
                    <Line type="monotone" dataKey="average" stroke="#FACC15" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI BRIEFING & TODAY TASKS */}
            <div className="bg-[#1C1924] border border-[#2D273C] rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2D273C] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#9333EA]" />
                  <h3 className="text-sm font-semibold text-white">Focus Schedule</h3>
                </div>
                <button
                  onClick={handleTriggerBrief}
                  disabled={isGeneratingBrief}
                  className="text-xs text-[#9C95A8] hover:text-[#9333EA] flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                  <span>AI Briefing</span>
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="py-8 text-center text-[#9C95A8] text-xs italic">
                  No tasks scheduled. Click "+ Add Entry" to populate your planner.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {tasks.map((t) => {
                    const isDone = t.status === 'done';
                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                          isDone 
                            ? 'bg-[#121114]/60 border-[#221D30] opacity-60' 
                            : 'bg-[#121114] border-[#2D273C] hover:border-[#9333EA]/40'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => onStatusChange(t, isDone ? 'pending' : 'done')}
                            className="text-slate-400 hover:text-[#9333EA] shrink-0"
                          >
                            {isDone ? <CheckCircle2 className="w-5 h-5 text-[#9333EA]" /> : <Circle className="w-5 h-5 text-slate-600" />}
                          </button>
                          <div className="min-w-0">
                            <h4 className={`text-xs font-semibold truncate ${isDone ? 'line-through text-slate-500' : 'text-white'}`}>
                              {t.title}
                            </h4>
                            <span className="text-[10px] text-[#9C95A8] capitalize">{t.category} • {t.estimated_minutes}m est</span>
                          </div>
                        </div>

                        <button
                          onClick={() => onStatusChange(t, isDone ? 'pending' : 'done')}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold shrink-0 transition-all ${
                            isDone ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40' : 'bg-[#9333EA] text-white hover:bg-[#7C3AED]'
                          }`}
                        >
                          {isDone ? 'Done ✓' : 'Start'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COL: UP NEXT, OVERDUE, & STREAK HERO CARD */}
          <div className="space-y-6">
            {/* UP NEXT LIST (Reference A "Starting Calls" List Style) */}
            <div className="bg-[#1C1924] border border-[#2D273C] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Up Next</h3>
              {upcomingTasks.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">All tasks completed!</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTasks.slice(0, 3).map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-[#121114] border border-[#2D273C] flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 text-xs font-bold shrink-0">
                          {t.category ? t.category.charAt(0).toUpperCase() : 'T'}
                        </div>
                        <span className="text-xs font-semibold text-slate-200 truncate">{t.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-purple-300 shrink-0">{t.estimated_minutes}m</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OVERDUE LIST (Reference A "Break" List Style with Elapsed Pills) */}
            <div className="bg-[#1C1924] border border-[#2D273C] rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#EC4899]">Overdue Queue</h3>
              {overdueTasks.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">No overdue items!</p>
              ) : (
                <div className="space-y-2">
                  {overdueTasks.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-[#121114] border border-[#2D273C] flex items-center justify-between">
                      <div className="min-w-0">
                        <h5 className="text-xs font-medium text-slate-200 truncate">{t.title}</h5>
                        <span className="text-[10px] text-slate-500 capitalize">{t.category}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#EC4899]/20 text-[#EC4899] border border-[#EC4899]/30 text-[10px] font-mono font-bold shrink-0">
                        Overdue
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* HERO GRADIENT STAT CARD (Reference A Bottom-Right Purple-Orange Card) */}
            <div className="bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#F59E0B] text-white rounded-3xl p-6 shadow-xl shadow-purple-950/40 relative overflow-hidden space-y-2">
              <div className="flex items-center gap-2 opacity-80">
                <Flame className="w-5 h-5 text-amber-200" />
                <span className="text-xs font-bold uppercase tracking-wider">Consistency Record</span>
              </div>
              <div className="pt-2">
                <h2 className="text-5xl font-extrabold tracking-tight">12</h2>
                <p className="text-xs font-semibold text-purple-100 mt-1">day streak achieved</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // LIGHT MODE LAYOUT (Reference B — Zentra + Mobile Task App Style)
  return (
    <div className="space-y-8">
      {/* HEADLINE + SUBTITLE (Reference B Headline Style) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E4E4E7] pb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-[#09090B] tracking-tight">Today</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{formattedJournalDate} • {completedCount} of {tasks.length} tasks completed</p>
        </div>
        <button
          onClick={() => setShowTaskForm(!showTaskForm)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#09090B] hover:bg-black text-white rounded-full text-xs font-semibold shadow-sm shrink-0 self-start md:self-auto transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </button>
      </div>

      {/* HORIZONTAL DAY-STRIP CALENDAR (Reference B Mobile Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {calendarDays.map((d) => {
          const isSelected = d.dateStr === selectedDate;
          return (
            <button
              key={d.dateStr}
              onClick={() => onSelectDate && onSelectDate(d.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[64px] px-3.5 py-2.5 rounded-2xl transition-all ${
                isSelected
                  ? 'bg-[#09090B] text-white font-bold shadow-md scale-105'
                  : 'bg-white text-slate-600 border border-[#E4E4E7] hover:border-slate-400'
              }`}
            >
              <span className="text-[10px] font-semibold uppercase">{d.dayNum}</span>
              <span className="text-xs">{d.dayName}</span>
            </button>
          );
        })}
      </div>

      {/* TASK FORM */}
      {showTaskForm && (
        <form onSubmit={handleTaskSubmit} className="bg-white border border-slate-300 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">New Planner Task</h3>
          <input
            type="text"
            placeholder="What needs to be done?"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-none focus:border-slate-900"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <option value="work">Work</option>
              <option value="school">School</option>
              <option value="personal">Personal</option>
              <option value="health">Health</option>
            </select>
            <select value={taskEst} onChange={(e) => setTaskEst(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">60 min</option>
            </select>
            <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <input type="time" value={taskTime} onChange={(e) => setTaskTime(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowTaskForm(false)} className="px-4 py-2 text-xs text-slate-500 hover:text-slate-900">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-[#09090B] text-white rounded-xl text-xs font-semibold">Save Task</button>
          </div>
        </form>
      )}

      {/* KPI ROW (Reference B Gross Volume / Stat Cards Style with Sparklines) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tasks Completed</span>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-slate-900">{completedCount} <span className="text-sm font-normal text-slate-400">/ {tasks.length}</span></h2>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completion Rate</span>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-slate-900">{completionRate}%</h2>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">+12% vs avg</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${completionRate}%` }} />
          </div>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-sm space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current Streak</span>
          <div className="flex items-baseline justify-between">
            <h2 className="text-3xl font-extrabold text-slate-900">12 <span className="text-sm font-normal text-slate-400">days</span></h2>
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">On Fire 🔥</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '85%' }} />
          </div>
        </div>
      </div>

      {/* TASK LIST (Reference B Mobile Screen Card Style) */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Today's Action Items</h3>
        {tasks.length === 0 ? (
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 text-center text-slate-400 text-xs italic shadow-sm">
            No active tasks scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((t) => {
              const isDone = t.status === 'done';
              return (
                <div
                  key={t.id}
                  className={`bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-4 ${
                    isDone ? 'opacity-60 bg-slate-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Category dot */}
                    <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0" />

                    <div className="min-w-0">
                      <h4 className={`text-base font-bold tracking-tight text-slate-900 truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                        {t.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium capitalize">
                        {t.category} • {t.estimated_minutes} min estimated
                      </p>
                    </div>
                  </div>

                  {/* Mobile Task Pill CTA */}
                  <button
                    onClick={() => onStatusChange(t, isDone ? 'pending' : 'done')}
                    className={`px-5 py-2 rounded-full text-xs font-semibold shrink-0 transition-all ${
                      isDone 
                        ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                        : 'bg-[#09090B] hover:bg-black text-white shadow-sm'
                    }`}
                  >
                    {isDone ? 'Completed ✓' : 'Start Task'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM GRADIENT HERO CARD (Reference B 75% Stat Card Style) */}
      <div className="bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Weekly Target Momentum</span>
          <h2 className="text-4xl font-extrabold tracking-tight">85%</h2>
          <p className="text-xs text-sky-100">Overall weekly task completion rate</p>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white text-xl border border-white/30">
          🎯
        </div>
      </div>
    </div>
  );
}
