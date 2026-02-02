const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixLuxus24() {
  try {
    const luxus24 = await prisma.workshop.findFirst({
      where: { companyName: { contains: 'Luxus24', mode: 'insensitive' } },
      include: { user: true }
    })

    if (!luxus24) {
      console.log('❌ Luxus24 nicht gefunden!')
      return
    }

    console.log('\n=== Luxus24 vor Update ===')
    console.log(`Radius: ${luxus24.serviceRadius}`)
    console.log(`Koordinaten: ${luxus24.latitude}, ${luxus24.longitude}`)
    console.log(`Status: ${luxus24.status}`)
    console.log(`Approved: ${luxus24.approved}`)
    console.log(`Adresse: ${luxus24.user.street}, ${luxus24.user.zipCode} ${luxus24.user.city}`)

    // Geocode the address
    const address = `${luxus24.user.street}, ${luxus24.user.zipCode} ${luxus24.user.city}, Germany`
    console.log(`\nGeocoding: ${address}`)

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`,
      {
        headers: {
          'User-Agent': 'Bereifung24/1.0'
        }
      }
    )
    const data = await response.json()

    if (data && data[0]) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)

      console.log(`\nGefundene Koordinaten: ${lat}, ${lon}`)

      // Update workshop
      const updated = await prisma.workshop.update({
        where: { id: luxus24.id },
        data: {
          latitude: lat,
          longitude: lon,
          serviceRadius: 25, // Default 25km
          status: 'ACTIVE',
          approved: true
        }
      })

      console.log('\n✅ Luxus24 wurde aktualisiert!')
      console.log(`Neue Koordinaten: ${updated.latitude}, ${updated.longitude}`)
      console.log(`Service-Radius: ${updated.serviceRadius} km`)
      console.log(`Status: ${updated.status}`)
      console.log(`Approved: ${updated.approved}`)
    } else {
      console.log('❌ Keine Koordinaten gefunden!')
    }

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixLuxus24()
