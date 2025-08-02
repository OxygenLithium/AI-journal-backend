import dotenv from 'dotenv';
import { QdrantClient } from '@qdrant/js-client-rest';
import { CohereClientV2 } from 'cohere-ai';

dotenv.config();

// Initialize and export Cohere client
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

// Initialize and export Qdrant client
const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export { cohere, qdrant };
