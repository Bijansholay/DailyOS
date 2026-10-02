import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import eventsRouter from './routes/events.js';
import dailyLogRouter from './routes/dailyLog.js';
import patternsRouter from './routes/patterns.js';
import aiRouter from './routes/ai.js';
import goalsRouter from './routes/goals.js';

let expressModule;
try {
  expressModule = await import('express');
} catch (e) {
  expressModule = null;
}

const router = expressModule ? expressModule.default.Router() : null;

export function registerMicroserviceGateway(app) {
  if (!app) return;

  // Domain Microservices Gateway Mounting
  if (authRouter) app.use('/api/auth', authRouter);
  if (tasksRouter) app.use('/api/tasks', tasksRouter);
  if (eventsRouter) app.use('/api/events', eventsRouter);
  if (dailyLogRouter) app.use('/api/daily-log', dailyLogRouter);
  if (patternsRouter) app.use('/api/patterns', patternsRouter);
  if (aiRouter) app.use('/api/ai', aiRouter);
  if (goalsRouter) app.use('/api/goals', goalsRouter);

  // Microservice Gateway Health Check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      architecture: 'modular_microservices',
      services: ['auth', 'tasks', 'events', 'goals', 'daily_logs', 'patterns', 'ai'],
      time: new Date().toISOString() 
    });
  });
}

export default router;
