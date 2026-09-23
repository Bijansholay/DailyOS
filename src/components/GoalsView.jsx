import React, { useState, useEffect } from 'react';
import { 
  Target, CheckCircle2, Circle, Clock, Plus, 
  Calendar, Flag, Trophy, Award, Trash2, ArrowUpRight, TrendingUp, Sparkles
} from 'lucide-react';
import { PrimaryButton, SecondaryButton, IconButton, ActionPillButton } from './Button';

function getISOWeekKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

function getMonthKey(dateStr) {
  return dateStr.substring(0, 7);
}

export default function GoalsView({
  selectedDate,
  tasks = [],
  dailyLog,
  authFetch,
  theme,
  dailyTaskTarget = 5,
  dailyFocusTarget = 240
}) {
  const [activeSubTab, setActiveSubTab] = useState('daily'); // daily | weekly | monthly
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);

  // New goal form state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTargetValue, setGoalTargetValue] = useState('1');
  const [goalCategory, setGoalCategory] = useState('work');

  const weekKey = getISOWeekKey(selectedDate);
  const monthKey = getMonthKey(selectedDate);

  const currentPeriodKey = activeSubTab === 'daily' 
    ? selectedDate 
    : activeSubTab === 'weekly' 
      ? weekKey 
      : monthKey;

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/goals?periodType=${activeSubTab}&periodKey=${currentPeriodKey}`);
      if (res.ok) {
        setGoals(await res.json());
      }
    } catch (e) {
      console.error('Error fetching goals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [activeSubTab, selectedDate]);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    try {
      const res = await authFetch('/api/goals', {
        method: 'POST',
        body: JSON.stringify({
          title: goalTitle.trim(),
          period_type: activeSubTab,
          period_key: currentPeriodKey,
          target_value: parseInt(goalTargetValue, 10) || 1,
          current_value: 0,
          category: goalCategory
        })
      });

      if (res.ok) {
        setGoalTitle('');
        setShowGoalForm(false);
        fetchGoals();
      }
    } catch (e) {
      console.error('Error creating goal:', e);
    }
  };

  const handleToggleGoal = async (goal) => {
    const isCompleted = goal.status === 'completed';
    const nextStatus = isCompleted ? 'pending' : 'completed';
    const nextVal = isCompleted ? 0 : goal.target_value;

    try {
      const res = await authFetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus,
          current_value: nextVal
        })
      });
      if (res.ok) {
        fetchGoals();
      }
    } catch (e) {
      console.error('Error updating goal:', e);
    }
  };

  const handleUpdateProgress = async (goal, delta) => {
    const nextVal = Math.max(0, Math.min(goal.target_value, (goal.current_value || 0) + delta));
    const nextStatus = nextVal >= goal.target_value ? 'completed' : 'pending';

    try {
      const res = await authFetch(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          current_value: nextVal,
          status: nextStatus
        })
      });
      if (res.ok) {
        fetchGoals();
      }
    } catch (e) {
      console.error('Error updating goal progress:', e);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      const res = await authFetch(`/api/goals/${goalId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchGoals();
      }
    } catch (e) {
      console.error('Error deleting goal:', e);
    }
  };

  // Daily stats calculation
  const completedTasksCount = tasks.filter(t => t.status === 'done').length;
  const actualFocusMinutes = tasks.filter(t => t.status === 'done').reduce((acc, t) => acc + (t.actual_minutes || t.estimated_minutes || 30), 0);
  const taskTargetPercent = Math.min(100, Math.round((completedTasksCount / (dailyTaskTarget || 5)) * 100));
  const focusTargetPercent = Math.min(100, Math.round((actualFocusMinutes / (dailyFocusTarget || 240)) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* HEADER BAR */}
      <div className="border-b border-[var(--border-color)] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs font-semibold tracking-widest text-[var(--accent-primary)] uppercase">Milestones & Targets</span>
          <h1 className="font-journal text-3xl md:text-4xl text-[var(--text-main)] font-normal tracking-tight mt-1">
            Goals & Performance Review
          </h1>
        </div>
        <PrimaryButton onClick={() => setShowGoalForm(!showGoalForm)} icon={Plus}>
          Add Goal
        </PrimaryButton>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shrink-0">
        <button
          onClick={() => setActiveSubTab('daily')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'daily'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Daily Review</span>
        </button>

        <button
          onClick={() => setActiveSubTab('weekly')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'weekly'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Flag className="w-4 h-4" />
          <span>Weekly Goals</span>
        </button>

        <button
          onClick={() => setActiveSubTab('monthly')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            activeSubTab === 'monthly'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Monthly Goals</span>
        </button>
      </div>

      {/* NEW GOAL FORM */}
      {showGoalForm && (
        <form onSubmit={handleCreateGoal} className="journal-card rounded-2xl p-5 space-y-4 border border-[var(--border-color)] shadow-sm">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">
            New {activeSubTab.charAt(0).toUpperCase() + activeSubTab.slice(1)} Target Goal
          </h3>
          <input
            type="text"
            placeholder="Goal Title / Milestone description..."
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)] outline-none focus:border-[var(--accent-primary)]"
            required
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Category</label>
              <select
                value={goalCategory}
                onChange={(e) => setGoalCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
              >
                <option value="work">Work</option>
                <option value="school">School</option>
                <option value="personal">Personal</option>
                <option value="health">Health</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">Target Quantity / Units</label>
              <input
                type="number"
                min="1"
                max="100"
                value={goalTargetValue}
                onChange={(e) => setGoalTargetValue(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)] text-xs text-[var(--text-main)]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <SecondaryButton onClick={() => setShowGoalForm(false)}>Cancel</SecondaryButton>
            <PrimaryButton type="submit">Create Goal</PrimaryButton>
          </div>
        </form>
      )}

      {/* DAILY GOALS REVIEW METRIC CARDS */}
      {activeSubTab === 'daily' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* TASKS TARGET PROGRESS */}
            <div className="journal-card rounded-2xl p-5 border border-[var(--border-color)] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Daily Tasks Target</span>
                <span className="text-xs font-semibold text-[var(--accent-primary)]">{taskTargetPercent}%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-3xl font-extrabold text-[var(--text-main)]">
                  {completedTasksCount} <span className="text-sm font-normal text-[var(--text-muted)]">/ {dailyTaskTarget} tasks</span>
                </h2>
              </div>
              <div className="w-full bg-[var(--bg-base)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                <div className="bg-[var(--accent-primary)] h-2 rounded-full transition-all" style={{ width: `${taskTargetPercent}%` }} />
              </div>
            </div>

            {/* FOCUS TIME TARGET PROGRESS */}
            <div className="journal-card rounded-2xl p-5 border border-[var(--border-color)] space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Daily Focus Duration</span>
                <span className="text-xs font-semibold text-emerald-600">{focusTargetPercent}%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <h2 className="text-3xl font-extrabold text-[var(--text-main)]">
                  {actualFocusMinutes} <span className="text-sm font-normal text-[var(--text-muted)]">/ {dailyFocusTarget} mins</span>
                </h2>
              </div>
              <div className="w-full bg-[var(--bg-base)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${focusTargetPercent}%` }} />
              </div>
            </div>
          </div>

          {/* REFLECTION REVIEW CHECK-IN */}
          <div className="journal-card rounded-2xl p-5 border border-[var(--border-color)] space-y-2 shadow-sm">
            <h3 className="text-sm font-semibold text-[var(--text-main)]">Daily Reflection Check-in</h3>
            {dailyLog?.mood_note ? (
              <p className="text-xs text-[var(--text-main)] italic leading-relaxed">
                "{dailyLog.mood_note}"
              </p>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">
                No daily reflection recorded for {selectedDate}. Visit the Log History tab to submit your check-in.
              </p>
            )}
          </div>
        </div>
      )}

      {/* GOALS ITEM LISTING */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {activeSubTab === 'daily' ? 'Daily Goal Checklists' : activeSubTab === 'weekly' ? `Weekly Goals (${weekKey})` : `Monthly Objectives (${monthKey})`}
        </h3>

        {goals.length === 0 ? (
          <div className="journal-card rounded-2xl p-8 text-center border border-[var(--border-color)] space-y-3 shadow-sm">
            <Target className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-60" />
            <p className="text-xs text-[var(--text-muted)] italic">
              No {activeSubTab} goals recorded for this period. Click "+ Add Goal" to set a milestone.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => {
              const isCompleted = goal.status === 'completed';
              return (
                <div
                  key={goal.id}
                  className={`journal-card rounded-2xl p-4 md:p-5 border border-[var(--border-color)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                    isCompleted ? 'opacity-60 bg-[var(--bg-base)]' : ''
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      onClick={() => handleToggleGoal(goal)}
                      className="mt-0.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors shrink-0"
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-[var(--border-color)] bg-[var(--bg-base)] text-[var(--text-muted)]">
                          {goal.category || 'general'}
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Achieved ✓
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-semibold text-[var(--text-main)] truncate ${isCompleted ? 'line-through text-[var(--text-muted)]' : ''}`}>
                        {goal.title}
                      </h4>

                      {goal.target_value > 1 && (
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] pt-1">
                          <span>Progress: {goal.current_value || 0} / {goal.target_value}</span>
                          <div className="w-24 bg-[var(--bg-base)] rounded-full h-1.5 overflow-hidden border border-[var(--border-color)]">
                            <div className="bg-[var(--accent-primary)] h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.round(((goal.current_value || 0) / goal.target_value) * 100))}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* QUICK PROGRESS ADJUSTMENT CONTROLS */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--border-color)]">
                    {goal.target_value > 1 && !isCompleted && (
                      <ActionPillButton
                        onClick={() => handleUpdateProgress(goal, 1)}
                        title="Increment progress"
                      >
                        +1 Progress
                      </ActionPillButton>
                    )}

                    <IconButton
                      onClick={() => handleDeleteGoal(goal.id)}
                      icon={Trash2}
                      danger
                      title="Delete goal"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
