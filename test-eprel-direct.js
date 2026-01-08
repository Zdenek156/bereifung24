// Test EPREL API direkt
const API_KEY = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';

async function testEPREL() {
  // Test verschiedene mögliche Endpoints
  const testEndpoints = [
    'https://ec.europa.eu/energy/eeprel-api/v1/tyres',
    'https://ec.europa.eu/product-registry/api/v1/tyres/search',
    'https://webgate.ec.europa.eu/eeprel-api/v1/tyres',
    'https://eprel.ec.europa.eu/api/products/tyres'
  ];

  for (const endpoint of testEndpoints) {
    console.log(`\n\n=== Testing: ${endpoint} ===`);
    
    // Test mit X-API-Key Header
    try {
      console.log('\nTrying with X-API-Key header...');
      const response1 = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response1.status}`);
      const text1 = await response1.text();
      console.log(`Response: ${text1.substring(0, 500)}`);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }

    // Test mit Authorization Bearer Header
    try {
      console.log('\nTrying with Authorization Bearer...');
      const response2 = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`Status: ${response2.status}`);
      const text2 = await response2.text();
      console.log(`Response: ${text2.substring(0, 500)}`);
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
  }
}

testEPREL();
