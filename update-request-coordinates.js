const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// Einfache Geocoding-Funktion für deutsche Städte
function getCoordinatesForCity(city, zipCode) {
  // Bekannte Städte-Mapping (kann erweitert werden)
  const cityCoordinates = {
    'Markgröningen': { lat: 48.9047, lng: 9.0828 },
    'Stuttgart': { lat: 48.7758, lng: 9.1829 },
    'Ludwigsburg': { lat: 48.8974, lng: 9.1917 },
    'München': { lat: 48.1351, lng: 11.5820 },
    'Berlin': { lat: 52.5200, lng: 13.4050 },
    'Hamburg': { lat: 53.5511, lng: 9.9937 },
    'Köln': { lat: 50.9375, lng: 6.9603 },
    'Frankfurt': { lat: 50.1109, lng: 8.6821 },
  }
  
  // Versuche zuerst exakte Stadt zu finden
  const normalizedCity = city.trim()
  if (cityCoordinates[normalizedCity]) {
    return cityCoordinates[normalizedCity]
  }
  
  // Fallback: Schätze basierend auf PLZ (grobe Schätzung für Baden-Württemberg)
  if (zipCode && zipCode.startsWith('71')) {
    return { lat: 48.9, lng: 9.1 } // Raum Ludwigsburg/Markgröningen
  }
  
  return null
}

async function updateRequestCoordinates() {
  console.log('\n=== UPDATING MOTORCYCLE REQUEST COORDINATES ===\n')
  
  // Finde alle Motorrad-Anfragen ohne Koordinaten
  const requests = await prisma.tireRequest.findMany({
    where: {
      additionalNotes: {
        contains: 'MOTORRADREIFEN'
      },
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    },
    include: {
      customer: {
        include: {
          user: true
        }
      }
    }
  })
  
  console.log(`Found ${requests.length} motorcycle requests without coordinates\n`)
  
  for (const req of requests) {
    const city = req.city || req.customer.user.city
    const zipCode = req.zipCode || req.customer.user.zipCode
    
    console.log(`Request ${req.id}:`)
    console.log(`  Current: lat=${req.latitude}, lng=${req.longitude}`)
    console.log(`  City: ${city}, ZIP: ${zipCode}`)
    
    // Versuche Koordinaten zu ermitteln
    const coords = getCoordinatesForCity(city, zipCode)
    
    if (coords) {
      // Update request
      await prisma.tireRequest.update({
        where: { id: req.id },
        data: {
          latitude: coords.lat,
          longitude: coords.lng,
          city: city === req.customer.user.email ? 'Markgröningen' : city // Fix email als Stadt
        }
      })
      
      console.log(`  ✓ Updated to: lat=${coords.lat}, lng=${coords.lng}`)
    } else {
      console.log(`  ✗ No coordinates found for ${city}`)
    }
    console.log()
  }
  
  console.log('Done!')
  await prisma.$disconnect()
}

updateRequestCoordinates().catch(console.error)
