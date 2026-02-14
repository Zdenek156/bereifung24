const fetch = require('node-fetch');

(async () => {
  try {
    console.log('Testing tire-dimensions API...\n');
    
    // Test 1: Summer tires (should work)
    console.log('1️⃣  Testing summer tires (s):');
    const resSummer = await fetch('http://localhost:3000/api/customer/vehicles/cmisrj9jg000ajcxoo7dyvemu/tire-dimensions?season=s', {
      headers: {
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN'
      }
    });
    console.log('Status:', resSummer.status);
    const dataSummer = await resSummer.json(); console.log('Response:', JSON.stringify(dataSummer, null, 2));
    console.log('');
    
    // Test 2: All season tires (should return 404)
    console.log('2️⃣  Testing all-season tires (g):');
    const resAllSeason = await fetch('http://localhost:3000/api/customer/vehicles/cmisrj9jg000ajcxoo7dyvemu/tire-dimensions?season=g', {
      headers: {
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN'
      }
    });
    console.log('Status:', resAllSeason.status);
    const dataAllSeason = await resAllSeason.json();
    console.log('Response:', JSON.stringify(dataAllSeason, null, 2));
    console.log('');
    
    // Test 3: Winter tires (should return 404)
    console.log('3️⃣  Testing winter tires (w):');
    const resWinter = await fetch('http://localhost:3000/api/customer/vehicles/cmisrj9jg000ajcxoo7dyvemu/tire-dimensions?season=w', {
      headers: {
        'Cookie': 'next-auth.session-token=YOUR_SESSION_TOKEN'
      }
    });
    console.log('Status:', resWinter.status);
    const dataWinter = await resWinter.json();
    console.log('Response:', JSON.stringify(dataWinter, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
