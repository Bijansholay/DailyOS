import { authService } from '../services/authService.js';
import { authMiddleware } from '../middleware/auth.js';

let expressModule;
try {
  expressModule = await import('express');
} catch (e) {
  expressModule = null;
}

const router = expressModule ? expressModule.default.Router() : null;

if (router) {
  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const result = await authService.registerUser(req.body);
      res.status(201).json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const result = await authService.loginUser(req.body);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // POST /api/auth/demo
  router.post('/demo', async (req, res) => {
    try {
      const result = await authService.authenticateDemoUser();
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message || err });
    }
  });

  // GET /api/auth/me
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const result = await authService.getUserProfile(req.userId);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });
}

export default router;
