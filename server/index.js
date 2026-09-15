import http from 'http';
import path from 'path';
import fileSystem from 'fs';
import { fileURLToPath } from 'url';

import { dbEngine } from './db.js';
import { initializeCronJobs } from './jobs/cron.js';

import tasksRouter from './routes/tasks.js';
import eventsRouter from './routes/events.js';
import dailyLogRouter from './routes/dailyLog.js';
import patternsRouter from './routes/patterns.js';
import aiRouter from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '127.0.0.1';

await dbEngine.ensureDefaultUser();
await initializeCronJobs();

let expressApp = null;

try {
  const expressModule = await import('express');
  const corsModule = await import('cors');
  const express = expressModule.default;
  const cors = corsModule.default;

  const app = express();
  app.use(cors());
  app.use(express.json());

  if (tasksRouter) app.use('/api/tasks', tasksRouter);
  if (eventsRouter) app.use('/api/events', eventsRouter);
  if (dailyLogRouter) app.use('/api/daily-log', dailyLogRouter);
  if (patternsRouter) app.use('/api/patterns', patternsRouter);
  if (aiRouter) app.use('/api/ai', aiRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), dbMode: dbEngine.mode });
  });

  const distPath = path.join(__dirname, '../dist');
  if (fileSystem.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  expressApp = app;
} catch (err) {
  console.log('ℹ️ Express module not found, using native Node HTTP server fallback');
}

if (expressApp) {
  expressApp.listen(PORT, HOST, () => {
    console.log(`🚀 DailyOS Express Server running on http://${HOST}:${PORT}`);
  });
} else {
  // Native Node HTTP Server Fallback
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const pathname = url.pathname;

    const getBody = () => new Promise(resolve => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(body || '{}')); } catch (e) { resolve({}); }
      });
    });

    try {
      if (pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString(), dbMode: dbEngine.mode }));
        return;
      }

      if (pathname === '/api/tasks') {
        if (req.method === 'GET') {
          const date = url.searchParams.get('date');
          const backlog = url.searchParams.get('backlog') === 'true';
          const tasks = await dbEngine.getTasks({ userId: dbEngine.defaultUserId, date, isBacklog: backlog });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(tasks));
          return;
        }
        if (req.method === 'POST') {
          const body = await getBody();
          const newTask = await dbEngine.createTask({ ...body, user_id: dbEngine.defaultUserId });
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newTask));
          return;
        }
      }

      if (pathname.startsWith('/api/tasks/')) {
        const id = pathname.replace('/api/tasks/', '');
        if (req.method === 'PATCH') {
          const body = await getBody();
          const updated = await dbEngine.updateTask(id, body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updated));
          return;
        }
        if (req.method === 'DELETE') {
          await dbEngine.deleteTask(id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, id }));
          return;
        }
      }

      if (pathname === '/api/events') {
        if (req.method === 'GET') {
          const from = url.searchParams.get('from');
          const to = url.searchParams.get('to');
          const events = await dbEngine.getEvents({ userId: dbEngine.defaultUserId, from, to });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(events));
          return;
        }
        if (req.method === 'POST') {
          const body = await getBody();
          const newEvt = await dbEngine.createEvent({ ...body, user_id: dbEngine.defaultUserId });
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newEvt));
          return;
        }
      }

      if (pathname.startsWith('/api/daily-log/')) {
        const parts = pathname.replace('/api/daily-log/', '').split('/');
        const dateStr = parts[0];
        const subAction = parts[1];

        if (subAction === 'reflect' && req.method === 'POST') {
          const body = await getBody();
          const tasks = await dbEngine.getTasks({ userId: dbEngine.defaultUserId, date: dateStr });
          const updated = await dbEngine.upsertDailyLog(dbEngine.defaultUserId, dateStr, {
            tasks_completed: tasks.filter(t => t.status === 'done').length,
            tasks_skipped: tasks.filter(t => t.status === 'skipped').length,
            tasks_late: tasks.filter(t => t.status === 'late').length,
            mood_note: body.mood_note
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(updated));
          return;
        }

        if (req.method === 'GET') {
          let log = await dbEngine.getDailyLog(dbEngine.defaultUserId, dateStr);
          const tasks = await dbEngine.getTasks({ userId: dbEngine.defaultUserId, date: dateStr });
          const completed = tasks.filter(t => t.status === 'done').length;
          const skipped = tasks.filter(t => t.status === 'skipped').length;
          const late = tasks.filter(t => t.status === 'late').length;

          log = await dbEngine.upsertDailyLog(dbEngine.defaultUserId, dateStr, {
            tasks_completed: completed,
            tasks_skipped: skipped,
            tasks_late: late,
            mood_note: log?.mood_note,
            ai_summary: log?.ai_summary
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(log));
          return;
        }
      }

      if (pathname === '/api/patterns') {
        if (req.method === 'GET') {
          const { computeUserPatterns } = await import('./jobs/patternEngine.js');
          let pattern = await dbEngine.getLatestPattern(dbEngine.defaultUserId);
          if (!pattern) pattern = await computeUserPatterns(dbEngine.defaultUserId);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(pattern));
          return;
        }
      }

      if (pathname === '/api/patterns/recompute' && req.method === 'POST') {
        const { computeUserPatterns } = await import('./jobs/patternEngine.js');
        const newPattern = await computeUserPatterns(dbEngine.defaultUserId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(newPattern));
        return;
      }

      if (pathname === '/api/ai/daily-brief' && req.method === 'POST') {
        const body = await getBody();
        const { generateDailyBriefing } = await import('./routes/ai.js');
        const brief = await generateDailyBriefing(dbEngine.defaultUserId, body.date || new Date().toISOString().split('T')[0]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(brief));
        return;
      }

      const distPath = path.join(__dirname, '../dist');
      let filePath = path.join(distPath, pathname === '/' ? 'index.html' : pathname);
      if (!fileSystem.existsSync(filePath)) {
        filePath = path.join(distPath, 'index.html');
      }

      if (fileSystem.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const mimeTypes = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/html' });
        res.end(fileSystem.readFileSync(filePath));
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not Found' }));
    } catch (err) {
      console.error('Server error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
  });

  server.listen(PORT, HOST, () => {
    console.log(`🚀 DailyOS Server running on http://${HOST}:${PORT}`);
  });
}
