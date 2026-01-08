// Test EPREL API mit verschiedenen Search-Endpoints
const API_KEY = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';

async function testEPRELSearch() {
  const baseURLs = [
    'https://eprel.ec.europa.eu/api',
    'https://ec.europa.eu/energy/eeprel-api',
    'https://webgate.ec.europa.eu/eeprel-api'
  ];

  const searchPaths = [
    '/products/tyres/search',
    '/products/tyres',
    '/tyres/search',
    '/tyres',
    '/search/tyres',
    '/public/products/tyres',
    '/public/tyres'
  ];

  for (const base of baseURLs) {
    for (const path of searchPaths) {
      const url = `${base}${path}`;
      console.log(`\n=== Testing: ${url} ===`);
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-KEY': API_KEY,
            'Accept': 'application/json'
          }
        });
        
        console.log(`Status: ${response.status}`);
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);
        
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          console.log(`Response: ${JSON.stringify(json).substring(0, 300)}`);
        } else {
          const text = await response.text();
          console.log(`Response: ${text.substring(0, 200)}`);
        }
      } catch (error) {
        console.log(`Error: ${error.message}`);
      }
    }
  }
}

testEPRELSearch();
