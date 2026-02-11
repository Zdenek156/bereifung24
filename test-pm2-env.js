// Test if PM2 app has ENCRYPTION_KEY
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/debug/check-env',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();
