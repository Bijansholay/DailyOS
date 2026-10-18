import { notesDb } from '../db/notesDb.js';
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

  router.get('/', async (req, res) => {
    try {
      res.json(await notesDb.getNotes(req.userId));
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || err });
    }
  });

  router.post('/', async (req, res) => {
    try {
      res.status(201).json(await notesDb.createNote(req.userId, req.body || {}));
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || err });
    }
  });

  router.patch('/:id', async (req, res) => {
    try {
      const note = await notesDb.updateNote(req.params.id, req.userId, req.body || {});
      if (!note) return res.status(404).json({ error: 'Note not found or unauthorized' });
      res.json(note);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || err });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const result = await notesDb.deleteNote(req.params.id, req.userId);
      if (!result) return res.status(404).json({ error: 'Note not found or unauthorized' });
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || err });
    }
  });
}

export default router;
