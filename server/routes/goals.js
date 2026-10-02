import { goalService } from '../services/goalService.js';
import { authMiddleware } from '../middleware/auth.js';

let expressModule;
try {
  expressModule = await import('express');
} catch (e) {
  expressModule = null;
}

const router = expressModule ? expressModule.default.Router() : null;

if (router) {
  router.use(authMiddleware);

  // GET /api/goals
  router.get('/', async (req, res) => {
    try {
      const { period_type, period_key } = req.query;
      const goals = await goalService.getGoals({
        userId: req.userId,
        periodType: period_type,
        periodKey: period_key
      });
      res.json(goals);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // POST /api/goals
  router.post('/', async (req, res) => {
    try {
      const goal = await goalService.createGoal(req.userId, req.body);
      res.status(201).json(goal);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // PATCH /api/goals/:id
  router.patch('/:id', async (req, res) => {
    try {
      const goal = await goalService.updateGoal(req.params.id, req.body, req.userId);
      res.json(goal);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // DELETE /api/goals/:id
  router.delete('/:id', async (req, res) => {
    try {
      const result = await goalService.deleteGoal(req.params.id, req.userId);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });
}

export default router;
