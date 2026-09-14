import React, { useState } from 'react';
import { 
  TrendingUp, Clock, AlertTriangle, RefreshCw, BarChart2, 
  Flame, Award, CheckCircle, Zap 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function PatternsView({ pattern, onRecomputePattern }) {
  const [isRecomputing, setIsRecomputing] = useState(false);

  const handleRecompute = async () => {
    setIsRecomputing(true);
    await onRecomputePattern();
    setIsRecomputing(false);
  };

  // Format hourly distribution data for chart
  const hourlyData = [];
  if (pattern?.most_productive_hours?.hourly_distribution) {
    Object.entries(pattern.most_productive_hours.hourly_distribution).forEach(([hour, count]) => {
      hourlyData.push({ hour, count });
    });
  } else {
    // Placeholder hourly distribution
    for (let i = 0; i < 24; i++) {
      const hourKey = i.toString().padStart(2, '0') + ':00';
      hourlyData.push({ hour: hourKey, count: 0 });
    }
  }

  const peakStart = pattern?.most_productive_hours?.start || '09:00';
  const peakEnd = pattern?.most_productive_hours?.end || '12:00';
  const avgRatio = pattern?.avg_completion_ratio || 1.0;
  const ratioPercent = Math.round((avgRatio - 1) * 100);

  return (
    <div className="space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl text-white">Behavioral Patterns & Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Computed from historical task outcomes over the last 30 days
          </p>
        </div>
        <button
          onClick={handleRecompute}
          disabled={isRecomputing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition-all shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRecomputing ? 'animate-spin' : ''}`} />
          <span>{isRecomputing ? 'Recomputing...' : 'Recompute Patterns'}</span>
        </button>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PEAK HOURS CARD */}
        <div className="glass-card rounded-2xl p-5 border border-brand-500/20 relative overflow-hidden">
          <div className="flex items-center gap-3 text-brand-400 mb-3">
            <div className="p-2 bg-brand-500/10 rounded-xl border border-brand-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Peak Productive Hours</h4>
              <p className="text-[11px] text-slate-400">Highest task completion density</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="font-bold text-2xl text-white tracking-tight">
              {peakStart} – {peakEnd}
            </span>
          </div>
        </div>

        {/* ESTIMATION RATIO CARD */}
        <div className="glass-card rounded-2xl p-5 border border-violet-500/20 relative overflow-hidden">
          <div className="flex items-center gap-3 text-violet-400 mb-3">
            <div className="p-2 bg-violet-500/10 rounded-xl border border-violet-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Time Estimation Accuracy</h4>
              <p className="text-[11px] text-slate-400">Actual vs Estimated Minutes Ratio</p>
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-bold text-2xl text-white tracking-tight">
              {avgRatio}x
            </span>
            <span className={`text-xs font-semibold ${ratioPercent > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {ratioPercent > 0 ? `+${ratioPercent}% actual time` : 'On target'}
            </span>
          </div>
        </div>

        {/* WORST CATEGORY CARD */}
        <div className="glass-card rounded-2xl p-5 border border-rose-500/20 relative overflow-hidden">
          <div className="flex items-center gap-3 text-rose-400 mb-3">
            <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-slate-200">Highest Skip Category</h4>
              <p className="text-[11px] text-slate-400">Category needing breakdown</p>
            </div>
          </div>
          <div className="mt-2">
            <span className="font-bold text-2xl text-rose-300 capitalize tracking-tight">
              {pattern?.worst_category || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* HEATMAP / HOURLY DISTRIBUTION CHART */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-200 text-base">Hourly Completion Distribution</h3>
            <p className="text-xs text-slate-400">Task completions grouped by hour of the day (24-hour cycle)</p>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <XAxis 
                dataKey="hour" 
                stroke="#64748b" 
                fontSize={11}
                tickLine={false}
                interval={2}
              />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#111827', 
                  borderColor: '#374151',
                  borderRadius: '12px',
                  color: '#f3f4f6',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {hourlyData.map((entry, index) => {
                  const hourVal = parseInt(entry.hour.split(':')[0], 10);
                  const peakStartHour = parseInt(peakStart.split(':')[0], 10);
                  const isPeak = hourVal >= peakStartHour && hourVal < (peakStartHour + 3);
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isPeak ? '#6366f1' : '#334155'} 
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SKIP STREAK WARNING FLAGS */}
      {pattern?.skip_streak_flags && pattern.skip_streak_flags.length > 0 && (
        <div className="glass-card rounded-2xl p-6 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-semibold text-white text-base">Skip Streak Flags</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pattern.skip_streak_flags.map((flag, idx) => (
              <div key={idx} className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-200 capitalize">{flag.category} Streak</h4>
                  <p className="text-xs text-amber-300/90 mt-0.5">{flag.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
