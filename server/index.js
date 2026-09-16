import http from 'http';
import path from 'path';
import fileSystem from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

import { dbEngine } from './db.js';
import { initializeCronJobs } from './jobs/cron.js';
import { verifyToken, hashPassword, verifyPassword, createToken } from './utils/authUtils.js';

import tasksRouter from './routes/tasks.js';
import eventsRouter from './routes/events.js';
import dailyLogRouter from './routes/dailyLog.js';
import patternsRouter from './routes/patterns.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '127.0.0.1';

await dbEngine.ensureDefaultUser();
await initializeCronJobs();

const app = express();
app.use(cors());
app.use(express.json());

// API Routes
if (authRouter) app.use('/api/auth', authRouter);
if (tasksRouter) app.use('/api/tasks', tasksRouter);
if (eventsRouter) app.use('/api/events', eventsRouter);
if (dailyLogRouter) app.use('/api/daily-log', dailyLogRouter);
if (patternsRouter) app.use('/api/patterns', patternsRouter);
if (aiRouter) app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), dbMode: dbEngine.mode });
});

// Serve Vite Production Build
const distPath = path.join(__dirname, '../dist');
if (fileSystem.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`🚀 DailyOS Express Server running on http://${HOST}:${PORT}`);
});
