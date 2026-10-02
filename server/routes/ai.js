import { aiService } from '../services/aiService.js';
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

  // POST /api/ai/daily-brief
  router.post('/daily-brief', async (req, res) => {
    try {
      const { date } = req.body;
      const targetDate = date || new Date().toISOString().split('T')[0];
      const result = await aiService.generateDailyBrief(req.userId, targetDate);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });
}

export default router;
