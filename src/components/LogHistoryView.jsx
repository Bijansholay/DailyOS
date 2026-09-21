import React, { useState, useEffect } from 'react';
import { CheckCircle2, XSquare, AlertCircle, MessageSquare, Send } from 'lucide-react';
import { PrimaryButton } from './Button';

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
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">Journal Archives</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[var(--text-main)] font-normal tracking-tight mt-1">
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
                  ? 'bg-[var(--accent-bg-subtle)] text-[var(--accent-primary)] border-[var(--accent-primary)] font-semibold'
                  : 'bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-main)]'
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
              <CheckCircle2 className="w-4 h-4 text-[var(--accent-primary)] mx-auto mb-1" />
              <span className="font-journal text-2xl text-[var(--text-main)]">{dailyLog?.tasks_completed || 0}</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Completed</p>
            </div>
            <div className="journal-card rounded-xl p-4 text-center">
              <XSquare className="w-4 h-4 text-[var(--text-muted)] mx-auto mb-1" />
              <span className="font-journal text-2xl text-[var(--text-main)]">{dailyLog?.tasks_skipped || 0}</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Skipped</p>
            </div>
            <div className="journal-card rounded-xl p-4 text-center">
              <AlertCircle className="w-4 h-4 text-[var(--text-muted)] mx-auto mb-1" />
              <span className="font-journal text-2xl text-[var(--text-main)]">{dailyLog?.tasks_late || 0}</span>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Late</p>
            </div>
          </div>

          {/* MOOD REFLECTION FORM */}
          <div className="journal-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-[var(--text-main)]">
              <MessageSquare className="w-4 h-4 text-[var(--accent-primary)]" />
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
                <PrimaryButton
                  type="submit"
                  disabled={isSaving}
                  icon={Send}
                >
                  {isSaving ? 'Saving...' : 'Save Reflection'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>

        {/* HISTORICAL PLAN INSIGHT (1 COL - NO AI CHIPS) */}
        <div className="journal-card rounded-xl p-5 space-y-3 border-l-4 border-l-[var(--accent-primary)]">
          <h3 className="font-journal text-lg text-[var(--text-main)]">Schedule Insight</h3>
          {aiSummary ? (
            <p className="text-sm text-[var(--text-main)] font-serif italic leading-relaxed">
              "{aiSummary.insight}"
            </p>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">
              No schedule insight recorded for this date.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

