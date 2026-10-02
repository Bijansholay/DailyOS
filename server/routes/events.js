import { eventService } from '../services/eventService.js';
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

  // GET /api/events
  router.get('/', async (req, res) => {
    try {
      const { from, to } = req.query;
      const events = await eventService.getEvents({ userId: req.userId, from, to });
      res.json(events);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // POST /api/events
  router.post('/', async (req, res) => {
    try {
      const event = await eventService.createEvent(req.userId, req.body);
      res.status(201).json(event);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // DELETE /api/events/:id
  router.delete('/:id', async (req, res) => {
    try {
      const result = await eventService.deleteEvent(req.params.id, req.userId);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });
}

export default router;
