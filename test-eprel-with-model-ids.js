const fetch = require('node-fetch');

(async () => {
  const apiKey = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';
  
  console.log('=== Testing EPREL Public Energy Label API ===\n');
  
  // Test verschiedene modelIdentifier
  const testIds = [
    '123456789',
    '111111',
    '999999999',
    '1',
    'ABC123'
  ];
  
  for (const modelId of testIds) {
    const endpoint = `https://eprel.ec.europa.eu/api/public/energylabel/v1/tyres/${modelId}`;
    console.log(`Testing: GET ${endpoint}`);
    console.log(`Header: x-api-key: ${apiKey.substring(0, 20)}...`);
    
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log(`Response (first 300 chars): ${text.substring(0, 300)}`);
      
      if (response.ok) {
        console.log('✅ SUCCESS!');
        try {
          const json = JSON.parse(text);
          console.log('JSON structure:', Object.keys(json));
        } catch(e) {}
      } else if (response.status === 404) {
        console.log('⚠️  404 - Model ID not found (but API key might be working!)');
      }
      
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
    
    console.log('\n' + '-'.repeat(70) + '\n');
  }
})();
