// Test Google Places API für PLZ-Extraktion
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function testSearch() {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', '52.520008,13.404954'); // Berlin
  url.searchParams.set('radius', '5000');
  url.searchParams.set('type', 'car_repair');
  url.searchParams.set('key', GOOGLE_API_KEY);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (data.results && data.results.length > 0) {
    // Zeige erste 3 Ergebnisse
    console.log('\n=== ERSTE 3 WERKSTÄTTEN IN BERLIN ===\n');
    
    for (let i = 0; i < Math.min(3, data.results.length); i++) {
      const place = data.results[i];
      console.log(`\n--- Werkstatt ${i + 1}: ${place.name} ---`);
      console.log('formatted_address:', place.formatted_address);
      console.log('vicinity:', place.vicinity);
      console.log('types:', place.types?.slice(0, 3).join(', '));
      console.log('place_id:', place.place_id);
      console.log('---');
    }
  }
}

testSearch().catch(console.error);
