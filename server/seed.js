import { dbEngine } from './db.js';
import { computeUserPatterns } from './jobs/patternEngine.js';

async function seed() {
  console.log('🌱 Seeding 30 days of realistic task and event history...');

  await dbEngine.ensureDefaultUser();
  const userId = dbEngine.defaultUserId;

  const categories = ['school', 'work', 'personal', 'health'];
  const priorities = ['low', 'medium', 'high'];

  const sampleTitles = {
    school: [
      'Read Chapter 4 CS Textbook', 'Algorithm Assignment 2', 'Data Structures Practice', 
      'Prepare Math Midterm', 'Physics Lab Report', 'Study Group Session'
    ],
    work: [
      'Review Pull Requests', 'Client Meeting Prep', 'Refactor API Endpoints', 
      'Write Sprint Documentation', 'Bugfix User Auth', 'Update Database Indexes'
    ],
    personal: [
      'Clean apartment', 'Grocery shopping', 'Call family', 
      'Read 20 pages book', 'Organize desk', 'Budget review'
    ],
    health: [
      '30 min Evening Run', 'Gym Workout Session', 'Prepare Healthy Lunch', 
      'Meditation 15m', 'Stretching routine', 'Hydration tracking'
    ]
  };

  const today = new Date();

  // Create tasks for past 30 days up to today
  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Create 3-5 tasks per day
    const taskCount = Math.floor(Math.random() * 3) + 3;

    for (let t = 0; t < taskCount; t++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const titleList = sampleTitles[category];
      const title = titleList[Math.floor(Math.random() * titleList.length)];
      const estMin = [15, 30, 45, 60, 90][Math.floor(Math.random() * 5)];
      const priority = priorities[Math.floor(Math.random() * priorities.length)];

      // Decide status realistically
      let status = 'pending';
      let actualMin = null;
      let completedAt = null;
      let scheduledTime = null;

      if (i > 0) {
        // Historical task
        const rand = Math.random();
        if (category === 'school' && rand < 0.5) {
          // Higher skip rate for school tasks to trigger worst_category
          status = 'skipped';
        } else if (rand < 0.7) {
          status = 'done';
          // Actual minutes with slight variance (+10% to +30%)
          actualMin = Math.round(estMin * (1 + (Math.random() * 0.4 - 0.05)));
          
          // Concentrate completions between 20:00 and 23:00 to create clear peak hours pattern
          const hour = Math.random() < 0.65 ? (20 + Math.floor(Math.random() * 3)) : (9 + Math.floor(Math.random() * 8));
          const completedDate = new Date(d);
          completedDate.setHours(hour, Math.floor(Math.random() * 60));
          completedAt = completedDate.toISOString();
          scheduledTime = `${hour.toString().padStart(2, '0')}:00`;
        } else if (rand < 0.85) {
          status = 'skipped';
        } else {
          status = 'late';
        }
      } else {
        // Today's tasks (keep pending for testing)
        status = 'pending';
        scheduledTime = ['09:00', '11:00', '14:30', '16:00', '20:00'][t % 5];
      }

      await dbEngine.createTask({
        user_id: userId,
        title,
        category,
        estimated_minutes: estMin,
        actual_minutes: actualMin,
        scheduled_for: dateStr,
        scheduled_time: scheduledTime,
        status,
        priority,
        completed_at: completedAt
      });
    }

    // Add occasional event
    if (i % 2 === 0) {
      await dbEngine.createEvent({
        user_id: userId,
        title: `Team Sync / Standup (${dateStr})`,
        event_date: dateStr,
        event_time: '10:00',
        category: 'meeting',
        notes: 'Daily retrospective and goal alignment'
      });
    }

    // Upsert daily log entry
    if (i > 0) {
      await dbEngine.upsertDailyLog(userId, dateStr, {
        tasks_completed: Math.floor(Math.random() * 3) + 2,
        tasks_skipped: Math.floor(Math.random() * 2),
        tasks_late: Math.floor(Math.random() * 2),
        mood_note: i % 3 === 0 ? "Felt productive today, high focus in the evening." : null,
        ai_summary: i % 5 === 0 ? JSON.stringify({
          insight: "Noticed a strong evening focus window between 20:00 and 23:00. Capitalize on peak focus.",
          schedule: []
        }) : null
      });
    }
  }

  // Create a few backlog tasks
  for (let b = 0; b < 4; b++) {
    await dbEngine.createTask({
      user_id: userId,
      title: `Backlog Idea #${b + 1}: Long-term Project Planning`,
      category: 'work',
      estimated_minutes: 60,
      priority: 'high',
      status: 'pending',
      scheduled_for: null
    });
  }

  console.log('✅ 30 Days of realistic seed data created!');

  // Trigger pattern computation over the newly seeded data
  const computedPattern = await computeUserPatterns(userId);
  console.log('📊 Computed Pattern Snapshot:', computedPattern);
}

seed().catch(console.error);
