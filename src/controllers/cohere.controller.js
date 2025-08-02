import { cohere } from '../config/index.js';
import { v4 as uuidv4 } from 'uuid';

export async function generateIdeas(entryText) {
  const rawResponse = await cohere.chat({
    model: 'command-a-03-2025',
    messages: [{
      role: 'user',
      content: `Separate any unrelated ideas or events into different entries, but ensure they all have necessary context and that related events are in the same entry. Store it as an array of strings in JSON format, and do not produce any output other than the JSON. Produce the output as raw JSON with no additional formatting.\n\n${entryText}`,
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