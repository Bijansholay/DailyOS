import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, X, Zap } from 'lucide-react';

const PRESETS = [
  { label: 'Same', delta: 0 },
  { label: '+15m', delta: 15 },
  { label: '+30m', delta: 30 },
  { label: '×2', delta: null, multiplier: 2 },
];

const PRIORITY_COLORS = { high: '#EC4899', medium: '#F59E0B', low: '#10B981' };

export default function CompletionModal({ isOpen, task, onClose, onSubmit }) {
  const [actualMinutes, setActualMinutes] = useState(30);

  useEffect(() => {
    if (task) setActualMinutes(task.estimated_minutes || 30);
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task.id, parseInt(actualMinutes, 10) || task.estimated_minutes || 30);
  };

  const accuracy = actualMinutes && task.estimated_minutes
    ? Math.round((task.estimated_minutes / parseInt(actualMinutes, 10)) * 100)
    : null;

  const accuracyColor = accuracy == null ? null
    : accuracy >= 90 && accuracy <= 110 ? '#10B981'
    : accuracy >= 70 ? '#F59E0B'
    : '#EC4899';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden animate-slideUp sm:animate-scaleIn"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.6)'
        }}
      >
        {/* Accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #059669, #10B981, #34D399)' }} />

        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-journal text-xl" style={{ color: 'var(--text-main)' }}>Log Completion</h3>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>How long did this actually take?</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl transition-colors hover:bg-[var(--bg-base)]" style={{ color: 'var(--text-muted)' }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Task preview */}
          <div className="p-4 rounded-2xl space-y-2"
            style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  background: `${PRIORITY_COLORS[task.priority] || '#9333EA'}15`,
                  color: PRIORITY_COLORS[task.priority] || '#9333EA',
                  border: `1px solid ${PRIORITY_COLORS[task.priority] || '#9333EA'}30`
                }}>
                {task.priority} priority
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                {task.category}
              </span>
            </div>
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{task.title}</h4>
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock className="w-3.5 h-3.5" />
              <span>Estimated: <strong style={{ color: 'var(--text-main)' }}>{task.estimated_minutes} min</strong></span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Time input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Actual Minutes Spent
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={actualMinutes}
                  onChange={(e) => setActualMinutes(e.target.value)}
                  className="w-full px-4 py-3 pr-16 journal-input rounded-2xl text-2xl font-bold text-center font-mono"
                  style={{ color: 'var(--accent-primary)' }}
                  required
                  autoFocus
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>min</span>
              </div>

              {/* Live accuracy feedback */}
              {accuracy !== null && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold animate-fadeIn"
                  style={{ color: accuracyColor }}>
                  <Zap className="w-3.5 h-3.5" />
                  {accuracy >= 90 && accuracy <= 110
                    ? 'Accurate estimate! 🎯'
                    : accuracy > 110
                    ? `Completed faster than estimated (${accuracy}% efficient)`
                    : `Took longer than estimated (${accuracy}% efficiency)`
                  }
                </div>
              )}
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => {
                const val = preset.multiplier
                  ? (task.estimated_minutes || 30) * preset.multiplier
                  : (task.estimated_minutes || 30) + preset.delta;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setActualMinutes(val)}
                    className="py-2 rounded-2xl text-xs font-semibold transition-all hover:scale-105"
                    style={{
                      background: parseInt(actualMinutes) === val ? 'var(--accent-bg-subtle)' : 'var(--bg-base)',
                      border: parseInt(actualMinutes) === val ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      color: parseInt(actualMinutes) === val ? 'var(--accent-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium transition-all"
                style={{ background: 'var(--bg-base)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #059669, #10B981)',
                  color: '#fff',
                  boxShadow: '0 6px 20px -4px rgba(16,185,129,0.5)'
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                Save & Complete
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
