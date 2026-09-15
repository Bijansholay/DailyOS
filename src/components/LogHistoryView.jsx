import React, { useState, useEffect } from 'react';
import { CheckCircle2, XSquare, AlertCircle, MessageSquare, Send } from 'lucide-react';

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
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      <div className="border-b border-[#33302B] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[#D4A24C] uppercase">Journal Archives</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[#E8E6E3] font-normal tracking-tight mt-1">
            Log History & Reflections
          </h1>
        </div>
      </div>

      {/* 14-DAY CALENDAR NAVIGATOR RIBBON */}
      <div className="journal-card rounded-xl p-3 flex items-center gap-2 overflow-x-auto">
        {calendarDays.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const dateObj = new Date(dateStr);
          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = dateObj.getDate();

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`flex-1 min-w-[56px] py-2.5 px-2 rounded-lg text-center transition-all border ${
                isSelected
                  ? 'bg-[#24221F] text-[#D4A24C] border-[#D4A24C] font-semibold'
                  : 'bg-[#1C1B19] text-[#9E9A92] border-[#33302B] hover:bg-[#24221F] hover:text-[#E8E6E3]'
              }`}
            >
              <span className="text-[10px] uppercase tracking-wider block font-mono">{dayName}</span>
              <span className="text-sm font-semibold block mt-0.5">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* SELECTED DATE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* STATS & MOOD REFLECTION (2 COLS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* DAILY COUNTS */}
          <div className="grid grid-cols-3 gap-3">
            <div className="journal-card rounded-xl p-4 text-center">
              <CheckCircle2 className="w-4 h-4 text-[#D4A24C] mx-auto mb-1" />
              <span className="font-journal text-2xl text-[#E8E6E3]">{dailyLog?.tasks_completed || 0}</span>
              <p className="text-[11px] text-[#9E9A92] mt-0.5">Completed</p>
            </div>
            <div className="journal-card rounded-xl p-4 text-center">
              <XSquare className="w-4 h-4 text-[#9E9A92] mx-auto mb-1" />
              <span className="font-journal text-2xl text-[#E8E6E3]">{dailyLog?.tasks_skipped || 0}</span>
              <p className="text-[11px] text-[#9E9A92] mt-0.5">Skipped</p>
            </div>
            <div className="journal-card rounded-xl p-4 text-center">
              <AlertCircle className="w-4 h-4 text-[#66625B] mx-auto mb-1" />
              <span className="font-journal text-2xl text-[#E8E6E3]">{dailyLog?.tasks_late || 0}</span>
              <p className="text-[11px] text-[#9E9A92] mt-0.5">Late</p>
            </div>
          </div>

          {/* MOOD REFLECTION FORM */}
          <div className="journal-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[#E8E6E3]">
              <MessageSquare className="w-4 h-4 text-[#D4A24C]" />
              <h3 className="font-journal text-lg">Daily Reflection</h3>
            </div>
            <form onSubmit={handleReflectionSubmit} className="space-y-3">
              <textarea
                rows={3}
                placeholder="How did today feel? Any reflections on energy levels or friction?"
                value={moodNote}
                onChange={(e) => setMoodNote(e.target.value)}
                className="w-full px-3.5 py-2.5 journal-input rounded-lg text-sm"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] font-semibold rounded-lg text-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Reflection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* HISTORICAL PLAN INSIGHT (1 COL - NO AI CHIPS) */}
        <div className="journal-card rounded-xl p-5 space-y-3 border-l-4 border-l-[#D4A24C]">
          <h3 className="font-journal text-lg text-[#E8E6E3]">Schedule Insight</h3>
          {aiSummary ? (
            <p className="text-sm text-[#E8E6E3] font-serif italic leading-relaxed">
              "{aiSummary.insight}"
            </p>
          ) : (
            <p className="text-xs text-[#9E9A92] italic">
              No schedule insight recorded for this date.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
