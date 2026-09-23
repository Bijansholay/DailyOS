import { dbEngine } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  // POST /api/auth/sync — Sync a Clerk user into Supabase users table on frontend sign-in
  router.post('/sync', authMiddleware, async (req, res) => {
    try {
      const { email } = req.body;
      const userId = req.userId;

      if (!userId) {
        return res.status(400).json({ error: 'User ID missing from authentication context' });
      }

      const user = await dbEngine.syncClerkUser({ id: userId, email });
      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at
        }
      });
    } catch (err) {
      console.error('Error syncing Clerk user:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/auth/webhook — Standard Clerk user.created webhook handler
  router.post('/webhook', async (req, res) => {
    try {
      const evt = req.body;
      const eventType = evt?.type;

      if (eventType === 'user.created' || eventType === 'user.updated') {
        const data = evt.data;
        const userId = data.id;
        const primaryEmailObj = data.email_addresses?.find(e => e.id === data.primary_email_address_id);
        const email = primaryEmailObj ? primaryEmailObj.email_address : (data.email_addresses?.[0]?.email_address || '');

        if (userId) {
          await dbEngine.syncClerkUser({ id: userId, email });
          console.log(`👤 [CLERK WEBHOOK] Synced user ${userId} (${email})`);
        }
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Error processing Clerk webhook:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/auth/me — Return current user info
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      let user = await dbEngine.findUserById(req.userId);
      if (!user) {
        user = await dbEngine.syncClerkUser({ id: req.userId, email: '' });
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

  // POST /api/auth/demo — Guest demo access
  router.post('/demo', async (req, res) => {
    try {
      const demoId = 'user_000000000000000000000000001';
      const email = 'demo@dailyos.local';

      let demoUser = await dbEngine.findUserById(demoId);
      if (!demoUser) {
        demoUser = await dbEngine.createUser({ id: demoId, email });
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

      res.json({
        token: demoUser.id,
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
} catch (e) {
  console.warn('Express module not available for auth router');
}

export default router;
