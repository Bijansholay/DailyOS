import { dbEngine } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  router.use(authMiddleware);

  router.get('/', async (req, res) => {
    try {
      const { from, to } = req.query;
      const events = await dbEngine.getEvents({ userId: req.userId, from, to });
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { title, event_date, event_time, category, notes } = req.body;
      if (!title || !event_date) {
        return res.status(400).json({ error: 'Title and event_date are required' });
      }
      const newEvent = await dbEngine.createEvent({
        user_id: req.userId,
        title: title.trim(),
        event_date,
        event_time: event_time || null,
        category: category || 'general',
        notes: notes || null
      });
      res.status(201).json(newEvent);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbEngine.deleteEvent(id);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {}

export default router;
