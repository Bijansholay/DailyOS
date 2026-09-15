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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md journal-card rounded-xl p-6 border border-[#33302B] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#9E9A92] hover:text-[#E8E6E3] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-[#D4A24C] mb-4">
          <CheckCircle className="w-6 h-6" />
          <div>
            <h3 className="font-journal text-xl text-[#E8E6E3]">Complete Entry</h3>
            <p className="text-xs text-[#9E9A92]">Log actual time spent for pattern learning</p>
          </div>
        </div>

        <div className="bg-[#1C1B19] p-3.5 rounded-lg mb-6 border border-[#33302B]">
          <span className="text-[10px] text-[#D4A24C] font-semibold uppercase tracking-wider block mb-1">
            {task.category} • {task.priority} Priority
          </span>
          <h4 className="font-medium text-[#E8E6E3] text-sm">{task.title}</h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-[#9E9A92]">
            <Clock className="w-3.5 h-3.5 text-[#66625B]" />
            <span>Estimated: <strong className="text-[#E8E6E3]">{task.estimated_minutes} min</strong></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#9E9A92] mb-2 uppercase tracking-wider">
              Actual Minutes Spent
            </label>
            <input
              type="number"
              min="1"
              max="1440"
              value={actualMinutes}
              onChange={(e) => setActualMinutes(e.target.value)}
              className="w-full px-4 py-2.5 journal-input rounded-lg text-lg font-mono font-bold text-[#D4A24C]"
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
                className="px-2 py-1.5 bg-[#1C1B19] hover:bg-[#292723] hover:border-[#D4A24C]/40 border border-[#33302B] rounded-lg text-xs font-medium text-[#9E9A92] transition-colors"
              >
                {preset.label} ({preset.val}m)
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#9E9A92] hover:text-[#E8E6E3] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#D4A24C] hover:bg-[#C3913B] text-[#1C1B19] font-semibold text-xs rounded-lg transition-colors"
            >
              Save & Log Time
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
