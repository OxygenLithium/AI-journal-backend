require('dotenv').config();
const { CohereClientV2 } = require('cohere-ai');

const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());

var entries = [];

const cohere = new CohereClientV2({
    token: process.env.API_KEY,
});

function buildPrompt(input) {
    if (entries.length == 0) {
        return input;
    }
    var response = "The following information is known to you. Use this information to answer a later part of the prompt, but do not talk about it otherwise. Only use information here if it is applicable to the actual query. If it is not relevant, do not mention it at all, not even to say it is not relevant. The information is written in first-person about the user, and anything referring to \"I\" or \"me\" refers to the user.\n"
    response += "Respond to the following query and nothing else:\n"
    response += input;
    for (var i = 0; i < entries.length; i++) {
        response += `\n${i}: `;
        response += entries[i];
    }
    return response
}

// Start the server
app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
});

app.post('/query', async (req, res) => {
    console.log(req.body);
    const rawResponse = await cohere.chat({
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: buildPrompt(req.body.input),
          },
        ],
    });
    const response = rawResponse.message.content[0].text;
    console.log(response);

    res.status(200).send({
        cohereResponse: response
    })
})

app.post('/journal/write', async (req, res) => {
    console.log(req.body);
    entries.push(req.body.entry);
    res.status(200).send()
})

app.get('/journal/query', async (req, res) => {
    console.log(entries);
    res.status(200).send({
        journalEntries: entries
    })
})
