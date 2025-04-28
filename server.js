require('dotenv').config();

const app = require('express')();
const port = 3000;

console.log(process.env.API_KEY);

// Start the server
app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
});

app.get('/test', (req, res) => {
    res.status(200).send({
        test: "successful"
    })
})
