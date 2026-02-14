const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function debugSearch() {
  try {
    const workshopId = 'cml3g7rxd000ckeyn9ypqgg65' // Luxus24
    const width = '225'
    const height = '45'
    const diameter = '17'
    const season = 's'
    const vehicleType = 'PKW'

    console.log('\n=== DEBUG TIRE SEARCH ===')
    console.log('Workshop:', workshopId)
    console.log('Dimensions:', `${width}/${height} R${diameter}`)
    console.log('Season:', season)
    console.log('Vehicle Type:', vehicleType)

    // Test 1: Basic search without any filters
    console.log('\n--- Test 1: Basic Search (no filters) ---')
    const basic = await prisma.workshopInventory.findMany({
      where: {
        workshopId,
        width: width,
        height: height,
        diameter: diameter,
        season,
        vehicleType,
        stock: { gte: 4 }
      },
      select: {
        id: true,
        brand: true,
        model: true,
        stock: true,
        price: true
      },
      take: 5
    })
    console.log(`Found ${basic.length} tires`)
    basic.forEach(t => console.log(`  - ${t.brand} ${t.model}: ${t.stock} pcs @ €${t.price}`))

    // Test 2: With DOT/DEMO exclusion (current fix)
    console.log('\n--- Test 2: With DOT/DEMO Filter ---')
    const filtered = await prisma.workshopInventory.findMany({
      where: {
        workshopId,
        width: width,
        height: height,
        diameter: diameter,
        season,
        vehicleType,
        stock: { gte: 4 },
        AND: [
          { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
          { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
        ]
      },
      select: {
        id: true,
        brand: true,
        model: true,
        stock: true,
        price: true
      },
      take: 5
    })
    console.log(`Found ${filtered.length} tires`)
    filtered.forEach(t => console.log(`  - ${t.brand} ${t.model}: ${t.stock} pcs @ €${t.price}`))

    // Test 3: Check if any DEMO/DOT tires exist
    console.log('\n--- Test 3: DEMO/DOT Tires ---')
    const demo = await prisma.workshopInventory.count({
      where: {
        workshopId,
        width: width,
        height: height,
        diameter: diameter,
        season,
        vehicleType,
        stock: { gte: 4 },
        OR: [
          { model: { contains: 'DEMO', mode: 'insensitive' } },
          { model: { contains: 'DOT', mode: 'insensitive' } }
        ]
      }
    })
    console.log(`Found ${demo} DEMO/DOT tires`)

    // Test 4: Check all seasons
    console.log('\n--- Test 4: All Seasons ---')
    for (const s of ['s', 'w', 'g']) {
      const count = await prisma.workshopInventory.count({
        where: {
          workshopId,
          width: width,
          height: height,
          diameter: diameter,
          season: s,
          vehicleType,
          stock: { gte: 4 }
        }
      })
      console.log(`  Season '${s}': ${count} tires`)
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugSearch()
