const fetch = require('node-fetch');

(async () => {
  try {
    const apiKey = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';
    
    console.log('=== EPREL API Test with Corrected Format ===');
    console.log('Endpoint: https://eprel.ec.europa.eu/api/products/tyres');
    console.log('Header: x-api-key (lowercase)');
    console.log('');
    
    const response = await fetch('https://eprel.ec.europa.eu/api/products/tyres', {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    console.log('');
    
    if (response.ok) {
      const text = await response.text();
      console.log('✅ SUCCESS!');
      console.log('Response length:', text.length, 'bytes');
      console.log('');
      console.log('First 1000 characters:');
      console.log(text.substring(0, 1000));
      
      // Try to parse as JSON
      try {
        const json = JSON.parse(text);
        console.log('');
        console.log('Parsed JSON structure:');
        console.log('Type:', Array.isArray(json) ? 'Array' : typeof json);
        if (Array.isArray(json)) {
          console.log('Array length:', json.length);
          if (json.length > 0) {
            console.log('First item keys:', Object.keys(json[0]));
            console.log('First item:', JSON.stringify(json[0], null, 2));
          }
        }
      } catch (e) {
        console.log('Not JSON format');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ ERROR');
      console.log('Error response:', errorText.substring(0, 1000));
    }
  } catch (error) {
    console.error('❌ EXCEPTION:', error.message);
    console.error('Stack:', error.stack);
  }
})();
