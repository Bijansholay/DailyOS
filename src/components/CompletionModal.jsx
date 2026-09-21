import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, X } from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton } from './Button';

export default function CompletionModal({ isOpen, task, onClose, onSubmit }) {
  const [actualMinutes, setActualMinutes] = useState(30);

  useEffect(() => {
    if (task) {
      setActualMinutes(task.estimated_minutes || 30);
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(task.id, parseInt(actualMinutes, 10) || task.estimated_minutes || 30);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md journal-card rounded-xl p-6 border border-[var(--border-color)] shadow-2xl">
        <div className="absolute top-4 right-4">
          <IconButton onClick={onClose} icon={X} title="Close" />
        </div>

        <div className="flex items-center gap-3 text-[var(--accent-primary)] mb-4">
          <CheckCircle className="w-6 h-6" />
          <div>
            <h3 className="font-journal text-xl text-[var(--text-main)]">Complete Entry</h3>
            <p className="text-xs text-[var(--text-muted)]">Log actual time spent for pattern learning</p>
          </div>
        </div>

        <div className="bg-[var(--bg-base)] p-3.5 rounded-lg mb-6 border border-[var(--border-color)]">
          <span className="text-[10px] text-[var(--accent-primary)] font-semibold uppercase tracking-wider block mb-1">
            {task.category} • {task.priority} Priority
          </span>
          <h4 className="font-medium text-[var(--text-main)] text-sm">{task.title}</h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-[var(--text-muted)]">
            <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Estimated: <strong className="text-[var(--text-main)]">{task.estimated_minutes} min</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider">
              Actual Minutes Spent
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={actualMinutes}
              onChange={(e) => setActualMinutes(e.target.value)}
              className="w-full px-4 py-2.5 journal-input rounded-lg text-lg font-mono font-bold text-[var(--accent-primary)]"
              required
              autoFocus
            />
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Same', val: task.estimated_minutes || 30 },
              { label: '+15m', val: (task.estimated_minutes || 30) + 15 },
              { label: '+30m', val: (task.estimated_minutes || 30) + 30 },
              { label: '2x', val: (task.estimated_minutes || 30) * 2 },
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActualMinutes(preset.val)}
                className="px-2 py-1.5 bg-[var(--bg-base)] hover:bg-[var(--bg-card-hover)] hover:border-[var(--accent-primary)]/40 border border-[var(--border-color)] rounded-lg text-xs font-medium text-[var(--text-muted)] transition-colors"
              >
                {preset.label} ({preset.val}m)
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <SecondaryButton onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit">
              Save & Log Time
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

