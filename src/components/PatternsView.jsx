import React, { useState } from 'react';
import { Clock, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SecondaryButton } from './Button';

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
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* HEADER BAR */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">30-Day Intelligence</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[var(--text-main)] font-normal tracking-tight mt-1">
            Productivity Analytics
          </h1>
        </div>
        <SecondaryButton
          onClick={handleRecompute}
          disabled={isRecomputing}
          icon={RefreshCw}
        >
          {isRecomputing ? 'Recomputing...' : 'Recompute Analytics'}
        </SecondaryButton>
      </div>

      {/* METRIC CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PEAK HOURS CARD */}
        <div className="journal-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-[var(--accent-primary)] mb-2">
            <Zap className="w-4 h-4" />
            <h4 className="font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider">Peak Focus Hours</h4>
          </div>
          <div className="mt-1">
            <span className="font-journal text-2xl text-[var(--text-main)]">
              {peakStart} – {peakEnd}
            </span>
          </div>
        </div>

        {/* ESTIMATION RATIO CARD */}
        <div className="journal-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-[var(--accent-primary)] mb-2">
            <Clock className="w-4 h-4" />
            <h4 className="font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider">Planning Accuracy</h4>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-journal text-2xl text-[var(--text-main)]">
              {avgRatio}x
            </span>
            <span className={`text-xs ${ratioPercent > 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
              {ratioPercent > 0 ? `+${ratioPercent}% actual time` : 'On target'}
            </span>
          </div>
        </div>

        {/* WORST CATEGORY CARD */}
        <div className="journal-card rounded-xl p-5 relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-[var(--accent-primary)] mb-2">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider">Highest Skip Rate</h4>
          </div>
          <div className="mt-1">
            <span className="font-journal text-2xl text-[var(--text-main)] capitalize">
              {pattern?.worst_category || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* HEATMAP / HOURLY DISTRIBUTION CHART */}
      <div className="journal-card rounded-xl p-6 space-y-4">
        <div>
          <h3 className="font-journal text-xl text-[var(--text-main)]">Hourly Completion Distribution</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Task completions grouped by hour of the day (24-hour cycle)</p>
        </div>

        <div className="h-60 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <XAxis 
                dataKey="hour" 
                stroke="var(--text-muted)" 
                fontSize={10}
                tickLine={false}
                interval={2}
              />
              <YAxis stroke="var(--text-muted)" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-color)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '12px'
                }} 
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {hourlyData.map((entry, index) => {
                  const hourVal = parseInt(entry.hour.split(':')[0], 10);
                  const peakStartHour = parseInt(peakStart.split(':')[0], 10);
                  const isPeak = hourVal >= peakStartHour && hourVal < (peakStartHour + 3);
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isPeak ? 'var(--accent-primary)' : 'var(--border-color)'} 
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
        <div className="journal-card rounded-xl p-6 border-l-4 border-l-[var(--accent-primary)] space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="font-journal text-lg text-[var(--text-main)]">Attention Patterns</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pattern.skip_streak_flags.map((flag, idx) => (
              <div key={idx} className="bg-[var(--bg-base)] border border-[var(--border-color)] rounded-lg p-3.5">
                <h4 className="font-medium text-xs text-[var(--text-main)] capitalize">{flag.category} Streak</h4>
                <p className="text-xs text-[var(--text-muted)] mt-1">{flag.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

