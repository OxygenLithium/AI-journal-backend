import express, { json } from 'express';
import { config } from 'dotenv';
config();

import journalRoutes from './routes/journal.routes.js';
import { searchAndBuildPrompt } from './services/search.service.js';

const app = express();
const port = 3000;
app.use(json());
app.use('/journal', journalRoutes);

app.put('/query', async (req, res) => {
  const result = await searchAndBuildPrompt(req.body.input);
  res.status(200).json(result);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
