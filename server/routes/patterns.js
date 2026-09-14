import { dbEngine } from '../db.js';
import { computeUserPatterns } from '../jobs/patternEngine.js';

let router = null;

try {
  const expressModule = await import('express');
  const express = expressModule.default;
  router = express.Router();

  router.get('/', async (req, res) => {
    try {
      const userId = dbEngine.defaultUserId;
      let pattern = await dbEngine.getLatestPattern(userId);
      if (!pattern) pattern = await computeUserPatterns(userId);
      res.json(pattern);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/recompute', async (req, res) => {
    try {
      const newPattern = await computeUserPatterns(dbEngine.defaultUserId);
      res.json(newPattern);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
} catch (e) {}

export default router;
