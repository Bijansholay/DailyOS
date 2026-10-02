import { patternsDb } from '../db/patternsDb.js';

export const patternService = {
  async getLatestPattern(userId) {
    const pattern = await patternsDb.getLatestPattern(userId);
    if (pattern) return pattern;

    // Return smart default pattern if none computed yet
    return {
      user_id: userId,
      computed_at: new Date().toISOString(),
      most_productive_hours: { start: '09:00', end: '12:00', peak_period: 'Morning Focus Window' },
      worst_category: null,
      avg_completion_ratio: 1.0,
      skip_streak_flags: []
    };
  },

  async recomputePattern(userId) {
    const tasks = await patternsDb.getTasksForPatternComputation(userId, 30);
    
    // Categorize completion ratio and skip counts
    const categoryStats = {};
    let totalEst = 0;
    let totalAct = 0;

    for (const t of tasks) {
      const cat = t.category || 'personal';
      if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, skipped: 0 };
      }
      categoryStats[cat].total++;
      if (t.status === 'skipped') categoryStats[cat].skipped++;

      if (t.status === 'done' && t.actual_minutes && t.estimated_minutes) {
        totalEst += t.estimated_minutes;
        totalAct += t.actual_minutes;
      }
    }

    let worstCat = null;
    let maxSkipRatio = -1;
    for (const [cat, stat] of Object.entries(categoryStats)) {
      if (stat.total >= 2) {
        const ratio = stat.skipped / stat.total;
        if (ratio > maxSkipRatio && ratio > 0.2) {
          maxSkipRatio = ratio;
          worstCat = cat;
        }
      }
    }

    const avgRatio = totalEst > 0 ? Number((totalAct / totalEst).toFixed(2)) : 1.0;

    const patternData = {
      most_productive_hours: { start: '09:00', end: '12:00', peak_period: 'Morning Deep Focus (9 AM - 12 PM)' },
      worst_category: worstCat,
      avg_completion_ratio: avgRatio,
      skip_streak_flags: worstCat ? [`High skip rate detected in '${worstCat}' tasks`] : []
    };

    return await patternsDb.upsertPattern(userId, patternData);
  }
};
