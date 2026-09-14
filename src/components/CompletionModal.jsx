import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, X } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-brand-500/30 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-emerald-400 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Complete Task</h3>
            <p className="text-xs text-slate-400">Log actual outcome for pattern learning</p>
          </div>
        </div>

        <div className="bg-dark-800/80 p-3 rounded-xl mb-6 border border-slate-700/50">
          <span className="text-xs text-brand-400 font-medium uppercase tracking-wider block mb-1">
            {task.category} • {task.priority} Priority
          </span>
          <h4 className="font-medium text-slate-200">{task.title}</h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Estimated: <strong className="text-slate-300">{task.estimated_minutes} min</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Actual Minutes Spent
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={actualMinutes}
              onChange={(e) => setActualMinutes(e.target.value)}
              className="w-full px-4 py-2.5 glass-input rounded-xl text-lg font-semibold text-brand-400 focus:ring-2 focus:ring-brand-500"
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
                className="px-2 py-1.5 bg-slate-800/60 hover:bg-brand-500/20 hover:border-brand-500/40 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-all"
              >
                {preset.label} ({preset.val}m)
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-brand-500/20 transition-all"
            >
              Save & Finish
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
