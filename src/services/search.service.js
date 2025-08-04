import { qdrantSearch } from '../controllers/qdrant.controller.js';
import { cohereChat, cohereEmbed } from '../controllers/cohere.controller.js';

async function searchRelevantIdeas(query) {
  const queryVector = await cohereEmbed(query);

  const searchResults = await qdrantSearch({
    vector: queryVector,
    top: 10,
  });

  return searchResults.map((r) => r.payload.plaintext);
}

async function buildPromptWithMemory(input) {
  const matches = await searchRelevantIdeas(input);
  if (matches.length === 0) return input;

  let contextHeader =
    "The following information is known to you. Use this information to answer a later part of the prompt, but do not talk about it otherwise. Only use information here if it is applicable to the actual query. If it is not relevant, do not mention it at all, not even to say it is not relevant. The information is written in first-person about the user, and anything referring to \"I\" or \"me\" refers to the user.\n";

  const numberedFacts = matches.map((fact, i) => `${i}: ${fact}`).join('\n');

  return `${contextHeader}\nRespond to the following query and nothing else:\n${input}\n${numberedFacts}`;
}

export async function searchAndBuildPrompt(query) {
  const prompt = await buildPromptWithMemory(query);
  return await cohereChat(prompt);
}
