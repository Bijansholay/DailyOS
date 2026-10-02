import { taskService } from '../services/taskService.js';
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

  // GET /api/tasks
  router.get('/', async (req, res) => {
    try {
      const { date, backlog, undone } = req.query;
      const tasks = await taskService.getTasks({
        userId: req.userId,
        date,
        backlog,
        undone
      });
      res.json(tasks);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // POST /api/tasks
  router.post('/', async (req, res) => {
    try {
      const task = await taskService.createTask(req.userId, req.body);
      res.status(201).json(task);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // PATCH /api/tasks/:id
  router.patch('/:id', async (req, res) => {
    try {
      const task = await taskService.updateTask(req.params.id, req.body, req.userId);
      res.json(task);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });

  // DELETE /api/tasks/:id
  router.delete('/:id', async (req, res) => {
    try {
      const result = await taskService.deleteTask(req.params.id, req.userId);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({ error: err.message || err });
    }
  });
}

export default router;
