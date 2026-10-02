import { dailyLogsDb } from '../db/dailyLogsDb.js';
import { tasksDb } from '../db/tasksDb.js';

export const dailyLogService = {
  async getDailyLog(userId, logDate) {
    const existing = await dailyLogsDb.getDailyLog(userId, logDate);
    if (existing) return existing;

    // Auto-summarize metrics if log does not exist yet
    const tasks = await tasksDb.getTasks({ userId, date: logDate });
    const completed = tasks.filter(t => t.status === 'done').length;
    const skipped = tasks.filter(t => t.status === 'skipped').length;
    const late = tasks.filter(t => t.status === 'late').length;

    return {
      user_id: userId,
      log_date: logDate,
      tasks_completed: completed,
      tasks_skipped: skipped,
      tasks_late: late,
      mood_note: null,
      ai_summary: null
    };
  },

  async saveReflection(userId, logDate, { mood_note }) {
    const tasks = await tasksDb.getTasks({ userId, date: logDate });
    const completed = tasks.filter(t => t.status === 'done').length;
    const skipped = tasks.filter(t => t.status === 'skipped').length;
    const late = tasks.filter(t => t.status === 'late').length;

    return await dailyLogsDb.upsertDailyLog(userId, logDate, {
      tasks_completed: completed,
      tasks_skipped: skipped,
      tasks_late: late,
      mood_note: mood_note || null
    });
  }
};
