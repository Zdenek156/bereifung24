// Test AI chat API endpoint with a real request
const https = require('https');

const data = JSON.stringify({
  message: 'Hallo, welche Reifen empfiehlst du für einen VW Golf?',
  chatHistory: []
});

const options = {
  hostname: 'bereifung24.de',
  path: '/api/ai/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(body);
      console.log('Response:', JSON.stringify(json).substring(0, 500));
    } catch(e) {
      console.log('Raw:', body.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('Request error:', e.message));
req.write(data);
req.end();
