import { dbEngine } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  router.use(authMiddleware);

  router.get('/:date', async (req, res) => {
    try {
      const { date } = req.params;
      const userId = req.userId;
      let log = await dbEngine.getDailyLog(userId, date);
      const tasks = await dbEngine.getTasks({ userId, date });
      const completed = tasks.filter(t => t.status === 'done').length;
      const skipped = tasks.filter(t => t.status === 'skipped').length;
      const late = tasks.filter(t => t.status === 'late').length;

      log = await dbEngine.upsertDailyLog(userId, date, {
        tasks_completed: completed,
        tasks_skipped: skipped,
        tasks_late: late,
        mood_note: log?.mood_note,
        ai_summary: log?.ai_summary
      });
      res.json(log);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:date/reflect', async (req, res) => {
    try {
      const { date } = req.params;
      const { mood_note } = req.body;
      const userId = req.userId;
      const tasks = await dbEngine.getTasks({ userId, date });
      const updatedLog = await dbEngine.upsertDailyLog(userId, date, {
        tasks_completed: tasks.filter(t => t.status === 'done').length,
        tasks_skipped: tasks.filter(t => t.status === 'skipped').length,
        tasks_late: tasks.filter(t => t.status === 'late').length,
        mood_note
      });
      res.json(updatedLog);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {}

export default router;
