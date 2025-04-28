// fileName : server.js 
// Example using the http module
// const http = require('http');
const app = require('express')();

// Create an HTTP server
// const server = http.createServer((req, res) => {
//     // Set the response headers
//     res.writeHead(200, { 'Content-Type': 'text/html' });

//     // Write the response content
//     res.write('<h1>Hello, Node.js HTTP Server!</h1>');
//     res.end();
// });

// Specify the port to listen on
const port = 3000;

// Start the server
app.listen(port, () => {
    console.log(`Node.js HTTP server is running on port ${port}`);
});

app.get('/test', (req, res) => {
    res.status(200).send({
        test: "successful"
    })
})
