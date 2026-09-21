import { dbEngine } from '../db.js';
import { hashPassword, verifyPassword, createToken } from '../utils/authUtils.js';
import { authMiddleware } from '../middleware/auth.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  // POST /api/auth/register
  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const existingUser = await dbEngine.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }

      const password_hash = hashPassword(password);
      const newUser = await dbEngine.createUser({ email, password_hash });

      const token = createToken({ userId: newUser.id, email: newUser.email });

      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          created_at: newUser.created_at
        }
      });
    } catch (err) {
      console.error('Error during registration:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Please provide both email and password.' });
      }

      const user = await dbEngine.findUserByEmail(email);
      if (!user || !user.password_hash) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const isMatch = verifyPassword(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = createToken({ userId: user.id, email: user.email });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      });
    } catch (err) {
      console.error('Error during login:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/demo
  router.post('/demo', async (req, res) => {
    try {
      const email = 'demo@dailyos.local';
      let demoUser = await dbEngine.findUserByEmail(email);

      if (!demoUser) {
        demoUser = await dbEngine.createUser({
          email,
          password_hash: hashPassword('demo-password-123')
        });
      }

      // Seed sample tasks if demo account has no tasks
      const existingTasks = await dbEngine.getTasks({ userId: demoUser.id });
      if (!existingTasks || existingTasks.length === 0) {
        const todayStr = new Date().toISOString().split('T')[0];
        const sampleTasks = [
          { title: 'Design system review & component restyle', category: 'work', estimated_minutes: 45, scheduled_for: todayStr, priority: 'high' },
          { title: 'Review customer feedback & telemetry logs', category: 'work', estimated_minutes: 30, scheduled_for: todayStr, priority: 'medium' },
          { title: 'Database query optimization & indexing', category: 'work', estimated_minutes: 60, scheduled_for: todayStr, priority: 'high' },
          { title: 'Daily health & workout session', category: 'health', estimated_minutes: 45, scheduled_for: todayStr, priority: 'medium' },
          { title: 'Read 2 chapters of Executive Function Guide', category: 'school', estimated_minutes: 30, scheduled_for: null, priority: 'medium' }
        ];

        for (const t of sampleTasks) {
          await dbEngine.createTask({
            user_id: demoUser.id,
            title: t.title,
            category: t.category,
            estimated_minutes: t.estimated_minutes,
            scheduled_for: t.scheduled_for,
            priority: t.priority,
            status: 'pending'
          });
        }
      }

      const token = createToken({ userId: demoUser.id, email: demoUser.email });

      res.json({
        token,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          created_at: demoUser.created_at
        }
      });
    } catch (err) {
      console.error('Error during demo auth:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/auth/me
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await dbEngine.findUserById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {
  console.warn('Express module not available for auth router');
}

export default router;
