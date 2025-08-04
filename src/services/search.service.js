import { qdrantSearch } from '../controllers/qdrant.controller.js';
import { cohereChat, cohereEmbed } from '../controllers/cohere.controller.js';
import { buildPrompt } from './build.prompt.service.js';

async function searchRelevantIdeas(query) {
  const queryVector = await cohereEmbed(query);

  const searchResults = await qdrantSearch({
    vector: queryVector,
    top: 10,
  });

  return searchResults.map((r) => r.payload.plaintext);
}

export async function searchAndBuildPrompt(query) {
  const matches = await searchRelevantIdeas(query);
  const numberedFacts = matches.map((fact, i) => `${i}: ${fact}`).join('\n');
  const prompt = await buildPrompt('RAGAnswerPrompt', { query, numberedFacts });
  return await cohereChat(prompt);
}
