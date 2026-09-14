import { dbEngine } from '../db.js';

export async function computeUserPatterns(userId = dbEngine.defaultUserId) {
  const tasks = await dbEngine.getTasksForPatternComputation(userId, 30);

  // 1. HOURLY COMPLETION DISTRIBUTION -> most_productive_hours
  const hourlyCount = {};
  for (let i = 0; i < 24; i++) {
    const hourKey = i.toString().padStart(2, '0') + ':00';
    hourlyCount[hourKey] = 0;
  }

  const completedTasks = tasks.filter(t => t.status === 'done');

  completedTasks.forEach(task => {
    let hour = null;
    if (task.completed_at) {
      hour = new Date(task.completed_at).getHours();
    } else if (task.scheduled_time) {
      hour = parseInt(task.scheduled_time.split(':')[0], 10);
    }
    if (hour !== null && !isNaN(hour)) {
      const hourKey = hour.toString().padStart(2, '0') + ':00';
      hourlyCount[hourKey] = (hourlyCount[hourKey] || 0) + 1;
    }
  });

  // Determine top 3-hour peak window
  let maxCount = -1;
  let peakStartHour = 9;

  for (let h = 0; h < 24; h++) {
    const h1 = h.toString().padStart(2, '0') + ':00';
    const h2 = ((h + 1) % 24).toString().padStart(2, '0') + ':00';
    const h3 = ((h + 2) % 24).toString().padStart(2, '0') + ':00';
    const windowSum = (hourlyCount[h1] || 0) + (hourlyCount[h2] || 0) + (hourlyCount[h3] || 0);

    if (windowSum > maxCount) {
      maxCount = windowSum;
      peakStartHour = h;
    }
  }

  const startFormatted = peakStartHour.toString().padStart(2, '0') + ':00';
  const endFormatted = ((peakStartHour + 3) % 24).toString().padStart(2, '0') + ':00';

  const mostProductiveHours = {
    start: startFormatted,
    end: endFormatted,
    hourly_distribution: hourlyCount
  };

  // 2. CATEGORY SKIP RATES -> worst_category
  const categoryStats = {};
  tasks.forEach(task => {
    const cat = task.category || 'personal';
    if (!categoryStats[cat]) {
      categoryStats[cat] = { total: 0, skipped: 0, done: 0, late: 0 };
    }
    categoryStats[cat].total++;
    if (task.status === 'skipped') categoryStats[cat].skipped++;
    if (task.status === 'done') categoryStats[cat].done++;
    if (task.status === 'late') categoryStats[cat].late++;
  });

  let worstCategory = null;
  let highestSkipRate = -1;

  Object.entries(categoryStats).forEach(([cat, stats]) => {
    if (stats.total >= 2) {
      const skipRate = stats.skipped / stats.total;
      if (skipRate > highestSkipRate) {
        highestSkipRate = skipRate;
        worstCategory = cat;
      }
    }
  });

  // 3. AVG COMPLETION RATIO (actual_minutes / estimated_minutes)
  let ratioSum = 0;
  let ratioCount = 0;

  completedTasks.forEach(task => {
    if (task.actual_minutes && task.estimated_minutes && task.estimated_minutes > 0) {
      ratioSum += (task.actual_minutes / task.estimated_minutes);
      ratioCount++;
    }
  });

  const avgCompletionRatio = ratioCount > 0 ? Number((ratioSum / ratioCount).toFixed(2)) : 1.0;

  // 4. SKIP STREAK FLAGS (tasks skipped 3+ consecutive days)
  const skipsByDateCategory = {};
  tasks.filter(t => t.status === 'skipped' && t.scheduled_for).forEach(task => {
    const cat = task.category || 'personal';
    if (!skipsByDateCategory[cat]) skipsByDateCategory[cat] = new Set();
    skipsByDateCategory[cat].add(task.scheduled_for);
  });

  const skipStreakFlags = [];

  Object.entries(skipsByDateCategory).forEach(([cat, datesSet]) => {
    const dates = Array.from(datesSet).sort();
    let currentStreak = 1;
    let maxStreak = 1;

    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 1;
      }
    }

    if (maxStreak >= 3) {
      skipStreakFlags.push({
        category: cat,
        streak_days: maxStreak,
        message: `Tasks in '${cat}' have been skipped ${maxStreak} days in a row.`
      });
    }
  });

  const patternObj = {
    most_productive_hours: mostProductiveHours,
    worst_category: worstCategory || 'none',
    avg_completion_ratio: avgCompletionRatio,
    skip_streak_flags: skipStreakFlags
  };

  const savedPattern = await dbEngine.upsertPattern(userId, patternObj);
  console.log(`📊 Computed pattern analytics for user ${userId}:`, {
    worstCategory,
    avgCompletionRatio,
    skipStreakCount: skipStreakFlags.length
  });

  return savedPattern;
}
