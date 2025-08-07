import { qdrantSearch } from '../controllers/qdrant.controller.js';
import { cohereChat, cohereEmbed } from '../controllers/cohere.controller.js';
import { buildPrompt } from './build.prompt.service.js';
import { getByObjectID } from '../controllers/mongo.controller.js';

async function searchRelevantIdeas(query) {
  const queryVector = await cohereEmbed(query);

  const searchResults = await qdrantSearch({
    vector: queryVector,
    top: 30,
  });

  return searchResults;
}

export async function findRelevantJournalEntries(ideas) {
  const uniqueJournalEntryIDs = [...new Set(ideas.map(item => item.payload.journalEntryID))];
  
  const entries = await Promise.all(uniqueJournalEntryIDs.map(async (journalEntryID) => {
    const entry = await getByObjectID(journalEntryID);
    return entry;
  }));

  return entries;
}

export async function searchAndBuildPrompt(query) {
  const ideas = await searchRelevantIdeas(query);
  const ideasText = ideas.map((r) => r.payload.plaintext);
  const numberedFacts = ideasText.map((fact, i) => `${i}: ${fact}`).join('\n');
  const prompt = await buildPrompt('RAGAnswerPrompt', { query, numberedFacts });

  return {
    cohereResponse: await cohereChat(prompt),
    journalEntries: await findRelevantJournalEntries(ideas),
  };
}
