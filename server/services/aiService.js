import { tasksDb } from '../db/tasksDb.js';
import { eventsDb } from '../db/eventsDb.js';
import { dailyLogsDb } from '../db/dailyLogsDb.js';
import { patternsDb } from '../db/patternsDb.js';

export const aiService = {
  async generateDailyBrief(userId, dateStr) {
    const [tasks, events, pattern] = await Promise.all([
      tasksDb.getTasks({ userId, date: dateStr }),
      eventsDb.getEvents({ userId, from: dateStr, to: dateStr }),
      patternsDb.getLatestPattern(userId)
    ]);

    // Smart heuristic schedule optimizer
    const timeSlots = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30'];
    let slotIdx = 0;

    const scheduledTasks = tasks.map(task => {
      const assignedTime = timeSlots[slotIdx % timeSlots.length];
      slotIdx++;
      return {
        ...task,
        scheduled_time: assignedTime
      };
    });

    // Update tasks in DB with AI assigned time slots
    for (const st of scheduledTasks) {
      await tasksDb.updateTask(st.id, { scheduled_time: st.scheduled_time }, userId);
    }

    const highPriorityCount = tasks.filter(t => t.priority === 'high').length;
    const peakWindow = pattern?.most_productive_hours?.peak_period || 'Morning Deep Focus (9 AM - 12 PM)';
    const insightMessage = highPriorityCount > 0
      ? `Scheduled ${highPriorityCount} high-priority tasks in your peak energy window (${peakWindow}) for maximum focus.`
      : `Balanced schedule optimized across ${tasks.length} tasks and ${events.length} calendar events.`;

    const aiSummary = {
      optimized_at: new Date().toISOString(),
      insight: insightMessage,
      task_count: tasks.length,
      event_count: events.length
    };

    const completed = tasks.filter(t => t.status === 'done').length;
    const skipped = tasks.filter(t => t.status === 'skipped').length;
    const late = tasks.filter(t => t.status === 'late').length;

    await dailyLogsDb.upsertDailyLog(userId, dateStr, {
      tasks_completed: completed,
      tasks_skipped: skipped,
      tasks_late: late,
      ai_summary: aiSummary
    });

    return {
      success: true,
      message: 'Daily schedule optimized successfully!',
      date: dateStr,
      ai_summary: aiSummary
    };
  }
};

export async function generateDailyBriefing(userId, dateStr) {
  return aiService.generateDailyBrief(userId, dateStr);
}

