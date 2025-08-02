import { Router } from 'express';
const router = Router();
import { createJournalEntry, editJournalEntry } from '../services/journal.service.js';
import { loadMoreEntries, deleteEntry } from '../controllers/mongo.controller.js';
import { deleteIdeasByEntryID } from '../controllers/qdrant.controller.js';

router.post('/write', async (req, res) => {
  const entry = await createJournalEntry(req.body.entry);
  res.status(200).json({ insertedEntry: entry });
});

router.put('/edit/:id', async (req, res) => {
  const updated = await editJournalEntry(req.params.id, req.body.update);
  res.status(200).json({ editedEntry: updated });
});

router.get('/loadMore/:lastSeen', async (req, res) => {
  const entries = await loadMoreEntries(req.params.lastSeen);
  res.status(200).json({ journalEntries: entries });
});

router.delete('/delete/:id', async (req, res) => {
  await deleteEntry(req.params.id);
  await deleteIdeasByEntryID(req.params.id);
  res.sendStatus(200);
});

export default router;
