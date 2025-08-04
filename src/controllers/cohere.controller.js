import { cohere } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';


async function buildPrompt(promptName, variables = {}) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const filePath = path.join(__dirname, `../prompts/${promptName}.md`);

  const raw = await fs.readFile(filePath, 'utf-8');
  const compiled = new Function(...Object.keys(variables), `return \`${raw}\`;`);
  return compiled(...Object.values(variables));
}

export async function generateIdeas(entryText) {
  const rawResponse = await cohere.chat({
    model: 'command-a-03-2025',
    messages: [{
      role: 'user',
      content: await buildPrompt('entryParsingPrompt', { journalEntry: entryText, dateString: })
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