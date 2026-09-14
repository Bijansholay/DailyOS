import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, CheckCircle2, XSquare, AlertCircle, 
  Sparkles, MessageSquare, Send, ChevronLeft, ChevronRight 
} from 'lucide-react';

export default function LogHistoryView({ 
  selectedDate, 
  onSelectDate, 
  dailyLog, 
  onSaveReflection 
}) {
  const [moodNote, setMoodNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dailyLog) {
      setMoodNote(dailyLog.mood_note || '');
    } else {
      setMoodNote('');
    }
  }, [dailyLog]);

  const handleReflectionSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveReflection(selectedDate, moodNote);
    setIsSaving(false);
  };

  // Generate 14-day calendar ribbon
  const calendarDays = [];
  const curr = new Date(selectedDate);
  for (let i = -6; i <= 7; i++) {
    const d = new Date(curr);
    d.setDate(d.getDate() + i);
    calendarDays.push(d.toISOString().split('T')[0]);
  }

  let aiSummary = null;
  if (dailyLog?.ai_summary) {
    try {
      aiSummary = typeof dailyLog.ai_summary === 'string'
        ? JSON.parse(dailyLog.ai_summary)
        : dailyLog.ai_summary;
    } catch (e) {
      aiSummary = { insight: dailyLog.ai_summary };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl text-white">Log History & Reflections</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Retrospective glance at past performance and daily reflections
          </p>
        </div>
      </div>

      {/* 14-DAY CALENDAR NAVIGATOR RIBBON */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-2 overflow-x-auto">
        {calendarDays.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const dateObj = new Date(dateStr);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = dateObj.getDate();

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex-1 min-w-[64px] py-3 px-2 rounded-xl text-center transition-all border ${
                isSelected
                  ? 'bg-brand-600 text-white border-brand-500 shadow-lg shadow-brand-500/20 font-bold scale-105'
                  : 'bg-dark-800/80 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block opacity-75">{dayName}</span>
              <span className="text-base font-semibold block mt-0.5">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* SELECTED DATE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STATS & MOOD REFLECTION (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* DAILY COUNTS */}
          <div className="grid grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="font-bold text-2xl text-white">{dailyLog?.tasks_completed || 0}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Completed</p>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-amber-500/20 text-center">
              <XSquare className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <span className="font-bold text-2xl text-white">{dailyLog?.tasks_skipped || 0}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Skipped</p>
            </div>
            <div className="glass-card rounded-2xl p-4 border border-rose-500/20 text-center">
              <AlertCircle className="w-5 h-5 text-rose-400 mx-auto mb-1" />
              <span className="font-bold text-2xl text-white">{dailyLog?.tasks_late || 0}</span>
              <p className="text-[11px] text-slate-400 mt-0.5">Late</p>
            </div>
          </div>

          {/* MOOD REFLECTION FORM */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-200">
              <MessageSquare className="w-5 h-5 text-brand-400" />
              <h3 className="font-semibold text-base">Daily Reflection & Mood Note</h3>
            </div>
            <form onSubmit={handleReflectionSubmit} className="space-y-3">
              <textarea
                rows={3}
                placeholder="How did today feel? Any friction, wins, or reflections on energy levels?"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="w-full px-4 py-3 glass-input rounded-xl text-sm"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-brand-500/20 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Reflection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* AI BRIEFING ARCHIVE (1 COL) */}
        <div className="glass-card rounded-2xl p-6 border border-brand-500/20 space-y-4">
          <div className="flex items-center gap-2 text-brand-400">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-semibold text-white text-base">Historical AI Briefing</h3>
          </div>
          {aiSummary ? (
            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-dark-800/80 p-3.5 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-brand-400 font-bold uppercase tracking-wider block mb-1">
                  Gemini Insight
                </span>
                <p className="leading-relaxed text-slate-200">{aiSummary.insight}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              No AI summary generated for this date.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
