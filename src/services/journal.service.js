import { generateIdeas } from '../controllers/cohere.controller.js';
import { insertEntry, updateEntry } from '../controllers/mongo.controller.js';
import { upsertIdeas, deleteIdeasByEntryID } from '../controllers/qdrant.controller.js';

export async function createJournalEntry(entryText) {
  const { embeddings, ideas, uuids } = await generateIdeas(entryText);
  const journalEntry = { text: entryText, ideaIDs: uuids };
  const savedEntry = await insertEntry(journalEntry);
  await upsertIdeas(embeddings, ideas, uuids, savedEntry._id);
  return savedEntry;
}

export async function editJournalEntry(id, updatedText) {
  await deleteIdeasByEntryID(id);
  const { embeddings, ideas, uuids } = await generateIdeas(updatedText);
  const updatedEntry = await updateEntry(updatedText, uuids, id);
  await upsertIdeas(embeddings, ideas, uuids, updatedEntry._id);
  return updatedEntry;
}
