const API_KEY = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';
const ACCEPTANCE_BASE = 'https://public-energy-label-acceptance.ec.europa.eu/api';
const PRODUCTION_BASE = 'https://eprel.ec.europa.eu/api';

const paths = [
  'v1.0.92/exportProducts/tyres',
  'exportProducts/tyres',
  'v1.0.92/products/tyres',
  'products/tyres',
];

async function testBothEnvironments() {
  console.log('=== TESTING ACCEPTANCE ENVIRONMENT ===\n');
  
  for (const path of paths) {
    const url = `${ACCEPTANCE_BASE}/${path}`;
    console.log(`Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('  ✓ SUCCESS!');
        console.log(`  Content-Type: ${response.headers.get('content-type')}`);
        console.log(`  Content-Length: ${response.headers.get('content-length')}`);
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          console.log(`  Data: ${JSON.stringify(data).substring(0, 200)}`);
        }
        break;
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
  
  console.log('\n\n=== TESTING PRODUCTION ENVIRONMENT ===\n');
  
  for (const path of paths) {
    const url = `${PRODUCTION_BASE}/${path}`;
    console.log(`Testing: ${url}`);
    
    try {
      const response = await fetch(url, {
        headers: {
          'X-API-KEY': API_KEY,
          'Accept': 'application/json'
        }
      });
      
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('  ✓ SUCCESS!');
        console.log(`  Content-Type: ${response.headers.get('content-type')}`);
        console.log(`  Content-Length: ${response.headers.get('content-length')}`);
        break;
      }
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

testBothEnvironments();
