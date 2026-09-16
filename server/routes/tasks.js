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
      const { date, backlog } = req.query;
      const tasks = await dbEngine.getTasks({
        userId: req.userId,
        date,
        isBacklog: backlog === 'true'
      });
      res.json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { title, category, estimated_minutes, scheduled_for, scheduled_time, priority } = req.body;
      if (!title || title.trim() === '') {
        return res.status(400).json({ error: 'Task title is required' });
      }
      const newTask = await dbEngine.createTask({
        user_id: req.userId,
        title: title.trim(),
        category: category || 'personal',
        estimated_minutes: parseInt(estimated_minutes, 10) || 30,
        scheduled_for: scheduled_for || null,
        scheduled_time: scheduled_time || null,
        priority: priority || 'medium',
        status: 'pending'
      });
      res.status(201).json(newTask);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTask = await dbEngine.updateTask(id, req.body);
      res.json(updatedTask);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      await dbEngine.deleteTask(id);
      res.json({ success: true, id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {
  // Express not loaded
}

export default router;
