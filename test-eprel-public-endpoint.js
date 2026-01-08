const fetch = require('node-fetch');

(async () => {
  const apiKey = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';
  
  console.log('=== Testing EPREL Public API Endpoint ===\n');
  
  // Test 1: Try to get a list (ohne modelIdentifier)
  console.log('Test 1: GET /api/public/energylabel/v1/tyres');
  try {
    const response1 = await fetch('https://eprel.ec.europa.eu/api/public/energylabel/v1/tyres', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response1.status, response1.statusText);
    const text1 = await response1.text();
    console.log('Response:', text1.substring(0, 500));
    
    if (response1.ok) {
      try {
        const json = JSON.parse(text1);
        console.log('JSON keys:', Object.keys(json));
      } catch(e) {}
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Try with a dummy modelIdentifier
  console.log('Test 2: GET /api/public/energylabel/v1/tyres/12345');
  try {
    const response2 = await fetch('https://eprel.ec.europa.eu/api/public/energylabel/v1/tyres/12345', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response2.status, response2.statusText);
    const text2 = await response2.text();
    console.log('Response:', text2.substring(0, 500));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 3: Try the old products endpoint again for comparison
  console.log('Test 3: GET /api/products/tyres (for comparison)');
  try {
    const response3 = await fetch('https://eprel.ec.europa.eu/api/products/tyres', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response3.status, response3.statusText);
    const text3 = await response3.text();
    console.log('Response:', text3.substring(0, 500));
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
