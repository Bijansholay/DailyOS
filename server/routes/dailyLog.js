import { dailyLogService } from '../services/dailyLogService.js';
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

  // GET /api/daily-log/:date
  router.get('/:date', async (req, res) => {
    try {
      const log = await dailyLogService.getDailyLog(req.userId, req.params.date);
      res.json(log);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // POST /api/daily-log/:date/reflect
  router.post('/:date/reflect', async (req, res) => {
    try {
      const log = await dailyLogService.saveReflection(req.userId, req.params.date, req.body);
      res.json(log);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });
}

export default router;
