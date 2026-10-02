import { patternService } from '../services/patternService.js';
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

  // GET /api/patterns
  router.get('/', async (req, res) => {
    try {
      const pattern = await patternService.getLatestPattern(req.userId);
      res.json(pattern);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // POST /api/patterns/recompute
  router.post('/recompute', async (req, res) => {
    try {
      const pattern = await patternService.recomputePattern(req.userId);
      res.json(pattern);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });
}

export default router;
