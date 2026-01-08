const https = require('https');

const versions = ['v1.0.0', 'v1.0.92', 'v1.0.73', 'v1.0.58'];
const API_KEY = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';

async function testVersions() {
  for (const version of versions) {
    const url = `https://eprel.ec.europa.eu/api/${version}/products/tyres`;
    
    console.log(`\n=== Testing ${version} ===`);
    console.log(`URL: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log(`Response: ${JSON.stringify(data).substring(0, 500)}`);
      } else {
        const text = await response.text();
        console.log(`Response: ${text.substring(0, 300)}`);
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

testVersions();
