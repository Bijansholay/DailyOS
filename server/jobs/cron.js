import { dbEngine } from '../db.js';
import { computeUserPatterns } from './patternEngine.js';
import { generateDailyBriefing } from '../routes/ai.js';

export async function initializeCronJobs() {
  console.log('⏰ Initializing DailyOS Cron Scheduler...');

  let cronModule = null;
  try {
    cronModule = await import('node-cron');
  } catch (e) {
    console.log('ℹ️ node-cron module not found, using internal timer scheduler.');
  }

  if (cronModule && cronModule.default) {
    const cron = cronModule.default;
    // Midnight Task Rollover & Cleanup (runs at 00:01 AM every night)
    cron.schedule('1 0 * * *', async () => {
      console.log('🧹 Running midnight automated task rollover & cleanup...');
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const allTasks = await dbEngine.getTasks({ userId: dbEngine.defaultUserId });
        const pastOverdueTasks = allTasks.filter(t => t.scheduled_for && t.scheduled_for < todayStr && t.status === 'pending');
        for (const task of pastOverdueTasks) {
          await dbEngine.updateTask(task.id, { status: 'late' });
        }
        console.log(`✅ Automatically marked ${pastOverdueTasks.length} past overdue tasks as 'late'.`);
      } catch (err) {
        console.error('❌ Error running midnight task rollover job:', err);
      }
    });

    // Nightly Pattern Recompute (runs at 00:05 AM every night)
    cron.schedule('5 0 * * *', async () => {
      console.log('🌙 Running nightly pattern computation job...');
      try {
        await computeUserPatterns(dbEngine.defaultUserId);
      } catch (err) {
        console.error('❌ Error running nightly pattern computation job:', err);
      }
    });

    // Morning Daily Briefing Pre-computation (runs at 06:00 AM every morning)
    cron.schedule('0 6 * * *', async () => {
      console.log('🌅 Running morning AI daily briefing job...');
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        await generateDailyBriefing(dbEngine.defaultUserId, todayStr);
      } catch (err) {
        console.error('❌ Error running morning AI briefing job:', err);
      }
    });
  } else {
    // Fallback interval timer (runs every 6 hours)
    setInterval(async () => {
      console.log('🌙 Running scheduled pattern computation job...');
      try {
        await computeUserPatterns(dbEngine.defaultUserId);
      } catch (err) {
        console.error('❌ Error running scheduled pattern computation job:', err);
      }
    }, 6 * 60 * 60 * 1000);
  }
}
