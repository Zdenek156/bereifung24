// One-off backfill script: lädt fehlende Werkstatt-Fotos für bestehende Prospects nach
// Run on server: node scripts/backfill-prospect-photos.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const PLACES_API_BASE = 'https://maps.googleapis.com/maps/api/place'

async function getApiKey() {
  const setting = await prisma.adminApiSetting.findUnique({
    where: { key: 'GOOGLE_MAPS_API_KEY' },
  })
  return setting?.value || process.env.GOOGLE_MAPS_API_KEY
}

async function getPlaceDetails(placeId, apiKey) {
  const url = new URL(`${PLACES_API_BASE}/details/json`)
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('key', apiKey)
  url.searchParams.set(
    'fields',
    'place_id,name,photos,opening_hours,types,price_level'
  )
  url.searchParams.set('language', 'de')
  const res = await fetch(url.toString())
  const data = await res.json()
  if (data.status !== 'OK') {
    throw new Error(`${data.status}: ${data.error_message || ''}`)
  }
  return data.result
}

function buildPhotoUrl(ref, apiKey, maxWidth = 400) {
  return `${PLACES_API_BASE}/photo?maxwidth=${maxWidth}&photo_reference=${ref}&key=${apiKey}`
}

async function main() {
  const apiKey = await getApiKey()
  if (!apiKey) {
    console.error('Kein GOOGLE_MAPS_API_KEY gefunden!')
    process.exit(1)
  }

  const allProspects = await prisma.prospectWorkshop.findMany({
    select: { id: true, googlePlaceId: true, name: true, photoUrls: true },
  })
  const prospects = allProspects.filter((p) => !p.photoUrls || p.photoUrls.length === 0)
  console.log(`Gefunden: ${prospects.length} Prospects ohne Fotos (von ${allProspects.length} gesamt)`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const p of prospects) {
    try {
      const details = await getPlaceDetails(p.googlePlaceId, apiKey)
      const photoUrls = (details.photos?.slice(0, 5) || []).map((ph) =>
        buildPhotoUrl(ph.photo_reference, apiKey)
      )
      if (photoUrls.length === 0) {
        skipped++
        console.log(`  - ${p.name}: keine Fotos bei Google`)
        continue
      }
      await prisma.prospectWorkshop.update({
        where: { id: p.id },
        data: {
          photoUrls,
          openingHours: details.opening_hours ?? undefined,
          placeTypes: details.types ?? undefined,
          priceLevel: details.price_level ?? undefined,
        },
      })
      updated++
      console.log(`  ✓ ${p.name}: ${photoUrls.length} Fotos`)
    } catch (err) {
      errors++
      console.error(`  ✗ ${p.name}: ${err.message}`)
    }
    // 100ms throttle
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log(
    `\nFertig! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`
  )
  await prisma.$disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
