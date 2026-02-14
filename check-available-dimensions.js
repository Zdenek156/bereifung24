const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findAvailableDimensions() {
  try {
    console.log('\n=== TOP 20 AVAILABLE TIRE DIMENSIONS (Luxus24) ===')
    
    const dimensions = await prisma.workshopInventory.groupBy({
      by: ['width', 'height', 'diameter'],
      where: {
        workshopId: 'cm3jqiigm0000fz23m62ys5op',
        season: 's',
        vehicleType: 'PKW',
        stock: { gte: 4 },
        AND: [
          { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
          { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
        ]
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 20
    })
    
    console.log('\nTop dimensions with tire counts:')
    dimensions.forEach((d, idx) => {
      console.log(`${idx + 1}. ${d.width}/${d.height} R${d.diameter} → ${d._count.id} tire models`)
    })
    
    // Check if the user's Skoda dimension appears anywhere
    console.log('\n🔍 Searching for 215/55 R17...')
    const skodaMatch = dimensions.find(d => d.width === '215' && d.height === '55' && d.diameter === '17')
    if (skodaMatch) {
      console.log(`✅ Found: ${skodaMatch._count.id} models available`)
    } else {
      console.log(`❌ NOT FOUND in top 20 dimensions`)
      
      // Check if exists with any stock
      const anyStock = await prisma.workshopInventory.count({
        where: {
          workshopId: 'cm3jqiigm0000fz23m62ys5op',
          width: '215',
          height: '55',
          diameter: '17',
          season: 's',
          vehicleType: 'PKW'
        }
      })
      console.log(`   Total count in DB (any stock): ${anyStock}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findAvailableDimensions()
