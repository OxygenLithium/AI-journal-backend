require('dotenv').config();
const { CohereClientV2 } = require('cohere-ai');

const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());

var entries = [];
var embeddings = [];

const cohere = new CohereClientV2({
    token: process.env.API_KEY,
});

// Cosine similarity
function cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
}

async function search(query) {
    const response = await cohere.embed({
      texts: [query],
      model: 'embed-english-v3.0',
      inputType: 'search_query',
      embeddingTypes: ['float']
    });
  
    const queryVector = response.embeddings.float[0];
  
    const scores = embeddings.map((vec, idx) => ({
      text: entries[idx],
      score: cosineSimilarity(queryVector, vec)
    }));
  
    scores.sort((a, b) => b.score - a.score);

    console.log(scores);
  
    return scores.slice(0, 3).map((r) => r.text); // Top 3 matches
  }

async function buildPrompt(input) {
    const matches = await search(input)
    if (matches.length == 0) {
        return input;
    }
    var response = "The following information is known to you. Use this information to answer a later part of the prompt, but do not talk about it otherwise. Only use information here if it is applicable to the actual query. If it is not relevant, do not mention it at all, not even to say it is not relevant. The information is written in first-person about the user, and anything referring to \"I\" or \"me\" refers to the user.\n"
    response += "Respond to the following query and nothing else:\n"
    response += input;
    for (var i = 0; i < matches.length; i++) {
        response += `\n${i}: `;
        response += matches[i];
    }
    console.log(response);
    return response;
}

// Start the server
app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
});

app.post('/query', async (req, res) => {
    const rawResponse = await cohere.chat({
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: await buildPrompt(req.body.input),
          },
        ],
    });
    const response = rawResponse.message.content[0].text;

    res.status(200).send({
        cohereResponse: response
    })
})

app.post('/journal/write', async (req, res) => {
    // entries.push(req.body.entry);

    const rawJournalEntryIdeas = await cohere.chat({
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: `Separate the following into separate phrases for each separate idea. Notice that ideas can span between different sentences across the entry. Ensure that two related things are stored together, even if they are in different places. Do so in a way that does not lose information. Make each sentence grammatically valid on its own. Store it as an array of strings in JSON format, and do not produce any output other than the JSON. Produce the output as raw JSON with no additional formatting.\n\n${req.body.entry}`,
          },
        ],
    });

    const journalEntryIdeas = JSON.parse(rawJournalEntryIdeas.message.content[0].text);

    
    for (var i = 0; i < journalEntryIdeas.length; i++) {
        entries.push(journalEntryIdeas[i]);
    }

    console.log(entries);

    const embedResponse = await cohere.embed({
        texts: entries,
        model: 'embed-english-v3.0',
        inputType: 'search_document',
        embeddingTypes: ["float"],
      });

    embeddings = embedResponse.embeddings.float;
    res.status(200).send()
})

app.get('/journal/query', async (req, res) => {
    res.status(200).send({
        journalEntries: entries
    })
})
