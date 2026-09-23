import { dbEngine } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  router.use(authMiddleware);

  // GET /api/goals?periodType=daily|weekly|monthly&periodKey=YYYY-MM-DD
  router.get('/', async (req, res) => {
    try {
      const { periodType, periodKey } = req.query;
      const goals = await dbEngine.getGoals({
        userId: req.userId,
        periodType,
        periodKey
      });
      res.json(goals);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/goals
  router.post('/', async (req, res) => {
    try {
      const { title, period_type, period_key, target_value, current_value, category } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Goal title is required' });
      }

      const newGoal = await dbEngine.createGoal({
        user_id: req.userId,
        title: title.trim(),
        period_type: period_type || 'daily',
        period_key: period_key || new Date().toISOString().split('T')[0],
        target_value: Number(target_value) || 1,
        current_value: Number(current_value) || 0,
        category: category || 'general'
      });

      res.status(201).json(newGoal);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PATCH /api/goals/:id
  router.patch('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedGoal = await dbEngine.updateGoal(id, req.body, req.userId);
      if (!updatedGoal) {
        return res.status(404).json({ error: 'Goal not found or unauthorized' });
      }
      res.json(updatedGoal);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/goals/:id
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const result = await dbEngine.deleteGoal(id, req.userId);
      if (!result) {
        return res.status(404).json({ error: 'Goal not found or unauthorized' });
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {}

export default router;
