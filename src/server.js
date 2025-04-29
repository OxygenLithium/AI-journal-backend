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
    var response = "Respond to the following prompt:\n"
    response += input;
    response += "\nThe following information is known to you. Treat it as if it is normal part of your dataset, do not remark about it being provided or about you knowing it. Only use it if it is applicable to the previously stated prompt."
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
