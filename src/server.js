require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const { QdrantClient } = require('@qdrant/js-client-rest');
const { CohereClientV2 } = require('cohere-ai');

const { insertMongoDB, editMongoDB, loadMore, deleteMongoDB } = require("./controllers/mongo_controller");

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

async function batchUpsertToQdrant(embeddings, plaintexts, uuids, journalEntryID) {
    const points = embeddings.map((ebd, idx) => {
        return {
            id: uuids[idx],
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

async function deleteQdrant(entryID) {
    await qdrant.delete("entries",
    {
        "filter": {
            "must": [
            {
                "key": "journalEntryID",
                "match": {
                    "value": entryID
                }
            }
            ]
        }
    }
    )
}

async function generateIdeas(entry) {
    const rawJournalEntryIdeas = await cohere.chat({
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: `Write separate entries for each different event or fact in the following. Notice that these can span between different sentences across the entry. Ensure that two related things are stored together, even if they are in different places. Do so in a way that does not lose information. Ensure that each entry makes sense on its own as a piece of information. Make each entry grammatically valid on its own (you can repeat words or add text as necessary). Store it as an array of strings in JSON format, and do not produce any output other than the JSON. Produce the output as raw JSON with no additional formatting.\n\n${entry}`,
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

    //Pre-generate UUIDs for the ideas, allowing them to be stored on the Mongo object on creation
    const ideaUUIDs = journalEntryIdeas.map((el) => { return uuidv4(); });

    return { embeddings: embedResponse.embeddings.float, ideas: journalEntryIdeas, ideaUUIDs }
}

async function handleInsertionLogic(entry) {
    const { embeddings, ideas, ideaUUIDs } = await generateIdeas(entry);

    const journalEntryObject = {
        userID: null,
        contextID: null,
        date: null,
        ideaIDs: ideaUUIDs,
        text: entry,
    }

    //Insert MongoObject
    const mongoObject = await insertMongoDB(journalEntryObject);
    
    //Upsert Qdrant vectors
    await batchUpsertToQdrant(embeddings, ideas, ideaUUIDs, mongoObject._id);

    return mongoObject;
}

async function handleEdit(update, id) {
    await deleteQdrant(id);
    const { embeddings, ideas, ideaUUIDs } = await generateIdeas(update);

    const mongoObject = await editMongoDB(update, ideaUUIDs, id);
    await batchUpsertToQdrant(embeddings, ideas, ideaUUIDs, mongoObject._id);

    return mongoObject;
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

app.put('/query', async (req, res) => {
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
    res.status(200).send({
        insertedEntry: await handleInsertionLogic(req.body.entry)
    })
})

app.put('/journal/edit/:id', async (req, res) => {
    res.status(200).send({
        editedEntry: await handleEdit(req.body.update, req.params.id)
    })
})

app.get(`/journal/loadMore/:lastSeen`, async (req, res) => {
    const lastSeen = req.params.lastSeen;
    res.status(200).send({
        journalEntries: await loadMore(lastSeen)
    })
})

app.delete(`/journal/delete/:id`, async (req, res) => {
    const id = req.params.id;
    deleteMongoDB(id);
    deleteQdrant(id);
    res.status(200).send()
})
