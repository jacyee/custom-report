const path = require('path');
const express = require('express');
const bodyparser = require('body-parser');

const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Simple embed page for the Power BI report
app.get('/report', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.use((req, res, next) => { next(); });

app.get('/:id', (req, res) => {
  console.log(req.params.id);
  res.status(200).send(`User ID: ${req.params.id}`);
});

app.post('/', (req, res) => {
  console.log(req.body);
  res.status(201).send('User created successfully');
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// const http = require('http');


// const server = http.createServer(request, response) => {
//     console.log('Server is running');
//     console.log('method', request.method);
//     console.log('url', request.url);
//     response.end('Hello World');
//     response.setHeader('Content-Type', 'text/html');
//     response.end('<h1>Hello World</h1>');
// }
// server.listen(3000, () => {
//     console.log('Server is running on port 3000');
// })
