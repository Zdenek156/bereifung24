const fetch = require('node-fetch');

(async () => {
  const apiKey = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';
  const endpoint = 'https://eprel.ec.europa.eu/api/public/energylabel/v1/tyres';
  
  const tests = [
    { name: 'x-api-key', headers: { 'x-api-key': apiKey, 'Accept': 'application/json' } },
    { name: 'X-API-KEY', headers: { 'X-API-KEY': apiKey, 'Accept': 'application/json' } },
    { name: 'X-Api-Key', headers: { 'X-Api-Key': apiKey, 'Accept': 'application/json' } },
    { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' } },
    { name: 'Authorization', headers: { 'Authorization': apiKey, 'Accept': 'application/json' } },
    { name: 'api-key', headers: { 'api-key': apiKey, 'Accept': 'application/json' } },
    { name: 'apikey', headers: { 'apikey': apiKey, 'Accept': 'application/json' } },
  ];
  
  console.log('=== Testing Different Auth Headers ===\n');
  console.log('Endpoint:', endpoint);
  console.log('API Key:', apiKey.substring(0, 20) + '...\n');
  
  for (const test of tests) {
    console.log(`Testing: ${test.name}`);
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: test.headers
      });
      
      const text = await response.text();
      console.log(`  Status: ${response.status} ${response.statusText}`);
      console.log(`  Response: ${text.substring(0, 100)}`);
      
      if (response.ok) {
        console.log('  ✅ SUCCESS!');
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
    console.log('');
  }
})();
