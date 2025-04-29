require('dotenv').config();
const { CohereClientV2 } = require('cohere-ai');

const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());

const cohere = new CohereClientV2({
    token: process.env.API_KEY,
});

// Start the server
app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
});

app.post('/test', async (req, res) => {
    console.log(req.body);
    const rawResponse = await cohere.chat({
        model: 'command-a-03-2025',
        messages: [
          {
            role: 'user',
            content: req.body.input,
          },
        ],
    });
    const response = rawResponse.message.content[0].text;
    console.log(response);

    res.status(200).send({
        cohereResponse: response
    })
})
