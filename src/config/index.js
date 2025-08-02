import dotenv from 'dotenv';
import { QdrantClient } from '@qdrant/js-client-rest';
import { CohereClientV2 } from 'cohere-ai';

dotenv.config();

// Initialize and export Cohere client
const cohere = new CohereClientV2({
  token: process.env.COHERE_API_KEY,
});

export { cohere };
