import dotenv from 'dotenv';
import { CohereClientV2 } from 'cohere-ai';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Initialize and export Cohere client
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});


async function buildPrompt(promptName, variables = {}) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, `../prompts/${promptName}.md`);

  const raw = await fs.readFile(filePath, 'utf-8');
  const compiled = new Function(...Object.keys(variables), `return \`${raw}\`;`);
  return compiled(...Object.values(variables));
}

export async function cohereChat(prompt) {
  const chatResponse = await cohere.chat({
    model: 'command-a-03-2025',
    messages: [{ role: 'user', content: prompt }],
  });

  return chatResponse.message.content[0].text;
}

export async function cohereEmbed(text) {
  const response = await cohere.embed({
    texts: [text],
    model: 'embed-english-v3.0',
    inputType: 'search_query',
    embeddingTypes: ['float'],
  });

  return response.embeddings.float[0];
}

export async function generateIdeas(entryText) {
  const rawResponse = await cohere.chat({
    model: 'command-a-03-2025',
    messages: [{
      role: 'user',
      content: await buildPrompt('entryParsingPrompt', { journalEntry: entryText, dateString: (new Date().toLocaleDateString())})
    }],
  });

  const ideas = JSON.parse(rawResponse.message.content[0].text);
  const embedResponse = await cohere.embed({
    texts: ideas,
    model: 'embed-english-v3.0',
    inputType: 'search_document',
    embeddingTypes: ['float'],
  });

  const uuids = ideas.map(() => uuidv4());
  return { ideas, embeddings: embedResponse.embeddings.float, uuids };
}