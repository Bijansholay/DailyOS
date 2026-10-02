import http from 'http';
import path from 'path';
import fileSystem from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';

import { dbEngine } from './db.js';
import { initializeCronJobs } from './jobs/cron.js';
import { registerMicroserviceGateway } from './gateway.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Safe non-blocking initialization
(async () => {
  try {
    await dbEngine.ensureDefaultUser();
  } catch (err) {
    console.warn('⚠️ Warning: dbEngine default user check failed:', err.message);
  }
  try {
    await initializeCronJobs();
  } catch (err) {
    console.warn('⚠️ Warning: Cron job scheduler initialization failed:', err.message);
  }
})();

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length > 0 ? allowedOrigins : true, credentials: true }));
app.use(express.json());

// Register API Microservices Gateway
registerMicroserviceGateway(app);

// Serve Vite Production Build
const distPath = path.join(__dirname, '../dist');
if (fileSystem.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, HOST, () => {
  console.log(`🚀 DailyOS Microservices Gateway running on http://${HOST}:${PORT}`);
});
