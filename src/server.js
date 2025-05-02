require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const { QdrantClient } = require('@qdrant/js-client-rest');
const { CohereClientV2 } = require('cohere-ai');

const { insertMongoDB, instantiateCursor, loadMore } = require("./controllers/mongo_controller");

const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());

//Instantiate Cohere client
const cohere = new CohereClientV2({
    token: process.env.COHERE_API_KEY,
});

// Instantiate Qdrant client
const qdrant = new QdrantClient({
    url: 'https://d30bea77-2673-4564-b4c1-7fd18e6ee0b1.us-west-1-0.aws.cloud.qdrant.io',
    apiKey: process.env.QDRANT_API_KEY,
});

async function batchUpsertToQdrant(embeddings, plaintexts, journalEntryID) {
    let uuids = [];

    const points = embeddings.map((ebd, idx) => {
        const uuid = uuidv4();
        uuids.push(uuid);

        return {
            id: uuid,
            vector: ebd,
            payload: {
                userID: null,
                contextID: null,
                date: null,
                journalEntryID,
                plaintext: plaintexts[idx]
            },
        }
    });

    await qdrant.upsert("entries", { points });

    return uuids;
}

async function handleInsertionLogic(entry) {
    const journalEntryID = uuidv4();

    const rawJournalEntryIdeas = await cohere.chat({
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: `Separate the following into separate phrases for each separate idea. Notice that ideas can span between different sentences across the entry. Ensure that two related things are stored together, even if they are in different places. Do so in a way that does not lose information. Make each sentence grammatically valid on its own. Store it as an array of strings in JSON format, and do not produce any output other than the JSON. Produce the output as raw JSON with no additional formatting.\n\n${entry}`,
          },
        ],
    });

    const journalEntryIdeas = JSON.parse(rawJournalEntryIdeas.message.content[0].text);

    const embedResponse = await cohere.embed({
        texts: journalEntryIdeas,
        model: 'embed-english-v3.0',
        inputType: 'search_document',
        embeddingTypes: ["float"],
    });

    const ideaUUIDs = await batchUpsertToQdrant(embedResponse.embeddings.float, journalEntryIdeas, journalEntryID);

    const journalEntryObject = {
        userID: null,
        contextID: null,
        date: null,
        id: journalEntryID,
        ideaIDs: ideaUUIDs,
        text: entry,
    }

    await insertMongoDB(journalEntryObject);
}

async function search(query) {
    const response = await cohere.embed({
      texts: [query],
      model: 'embed-english-v3.0',
      inputType: 'search_query',
      embeddingTypes: ['float']
    });
  
    const queryVector = response.embeddings.float[0];
  
    const searchResultsRaw = await qdrant.search('entries', {
        vector: queryVector,
        top: 10,
    });
  
    return searchResultsRaw.map((r) => r.payload.plaintext); // Top 3 matches
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
    await handleInsertionLogic(req.body.entry);
    res.status(200).send()
})

app.post('/journal/instantiateCursor', async (req, res) => {
    await instantiateCursor();
    res.status(200).send();
})

app.get('/journal/loadMore', async (req, res) => {
    res.status(200).send({
        journalEntries: await loadMore()
    })
})
