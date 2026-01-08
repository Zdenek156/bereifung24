// Systematischer Test aller möglichen EPREL API Endpoints
const API_KEY = 'clIkTy1kZ4DRqCQlQzoC7FvNj3jh1Ys6UErv6nP';

async function testEPRELSystematic() {
  const baseURLs = [
    'https://eprel.ec.europa.eu',
    'https://webgate.ec.europa.eu/eprel',
    'https://ec.europa.eu/info/energy-climate-change-environment/standards-tools-and-labels/products-labelling-rules-and-requirements/energy-label-and-ecodesign/product-database_en'
  ];

  const apiPaths = [
    // Version mit /api prefix
    '/api/v1/products/tyres',
    '/api/v1/tyres',
    '/api/v1/tyres/search',
    '/api/v1/products',
    '/api/products/tyres/list',
    '/api/products/tyres/models',
    
    // Ohne Version
    '/api/products/tyres',
    '/api/tyres',
    '/api/tyres/list',
    
    // Public prefix
    '/api/public/products/tyres',
    '/api/public/v1/products/tyres',
    '/api/public/tyres',
    
    // Screen API (von Webseite)
    '/screen/api/product/tyres',
    '/screen/api/products/tyres',
    
    // REST-like
    '/rest/products/tyres',
    '/rest/v1/products/tyres'
  ];

  const methods = ['GET', 'POST'];
  const headers = [
    { 'X-API-KEY': API_KEY, 'Accept': 'application/json' },
    { 'x-api-key': API_KEY, 'Accept': 'application/json' },
    { 'Authorization': `Bearer ${API_KEY}`, 'Accept': 'application/json' },
    { 'api-key': API_KEY, 'Accept': 'application/json' }
  ];

  let successfulEndpoints = [];

  for (const base of baseURLs) {
    for (const path of apiPaths) {
      const url = `${base}${path}`;
      
      for (const method of methods) {
        for (let i = 0; i < headers.length; i++) {
          try {
            const response = await fetch(url, {
              method: method,
              headers: headers[i],
              ...(method === 'POST' ? { body: JSON.stringify({}) } : {})
            });
            
            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            
            // Nur interessante Responses loggen
            if (response.status === 200 || response.status === 201 || 
                (response.status === 400 && isJson) || 
                (response.status === 404 && isJson && !contentType.includes('text/html'))) {
              
              console.log(`\n✓ INTERESSANT: ${method} ${url}`);
              console.log(`  Status: ${response.status}`);
              console.log(`  Content-Type: ${contentType}`);
              console.log(`  Header Index: ${i}`);
              
              if (isJson) {
                try {
                  const json = await response.json();
                  console.log(`  Response: ${JSON.stringify(json).substring(0, 500)}`);
                  
                  if (response.status === 200 || response.status === 201) {
                    successfulEndpoints.push({ url, method, headerIndex: i, status: response.status });
                  }
                } catch (e) {
                  const text = await response.text();
                  console.log(`  Response: ${text.substring(0, 300)}`);
                }
              }
            }
          } catch (error) {
            // Netzwerkfehler ignorieren
          }
        }
      }
    }
  }

  console.log('\n\n=== ERFOLGREICHE ENDPOINTS ===');
  if (successfulEndpoints.length > 0) {
    successfulEndpoints.forEach(ep => {
      console.log(`${ep.method} ${ep.url} (Header: ${ep.headerIndex}, Status: ${ep.status})`);
    });
  } else {
    console.log('Keine erfolgreichen Endpoints gefunden.');
  }
}

testEPRELSystematic();
