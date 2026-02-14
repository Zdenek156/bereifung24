const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkRunflatTires() {
  try {
    // Check Skoda Octavia dimensions (215/55 R17)
    const skodaDimensions = { width: '215', height: '55', diameter: '17' }
    
    console.log('\n=== RUNFLAT TIRES CHECK ===')
    console.log(`Dimensions: ${skodaDimensions.width}/${skodaDimensions.height} R${skodaDimensions.diameter}`)
    
    const allTires = await prisma.workshopInventory.count({
      where: {
        workshopId: 'cml3g7rxd000ckeyn9ypqgg65', // Luxus24 (CORRECT ID)
        width: skodaDimensions.width,
        height: skodaDimensions.height,
        diameter: skodaDimensions.diameter,
        season: 's',
        vehicleType: 'PKW',
        stock: { gte: 4 },
        AND: [
          { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
          { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
        ]
      }
    })
    
    const runflatTires = await prisma.workshopInventory.count({
      where: {
        workshopId: 'cml3g7rxd000ckeyn9ypqgg65',
        width: skodaDimensions.width,
        height: skodaDimensions.height,
        diameter: skodaDimensions.diameter,
        season: 's',
        vehicleType: 'PKW',
        stock: { gte: 4 },
        runFlat: true,
        AND: [
          { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
          { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
        ]
      }
    })
    
    const nonRunflatTires = await prisma.workshopInventory.count({
      where: {
        workshopId: 'cml3g7rxd000ckeyn9ypqgg65',
        width: skodaDimensions.width,
        height: skodaDimensions.height,
        diameter: skodaDimensions.diameter,
        season: 's',
        vehicleType: 'PKW',
        stock: { gte: 4 },
        runFlat: false,
        AND: [
          { NOT: { model: { contains: 'DEMO', mode: 'insensitive' } } },
          { NOT: { model: { contains: 'DOT', mode: 'insensitive' } } }
        ]
      }
    })
    
    console.log(`\n📊 Results:`)
    console.log(`  Total tires (all): ${allTires}`)
    console.log(`  Runflat ONLY (runFlat=true): ${runflatTires}`)
    console.log(`  Non-Runflat (runFlat=false/null): ${nonRunflatTires}`)
    
    if (runflatTires === 0) {
      console.log(`\n⚠️  NO RUNFLAT TIRES available in this dimension!`)
      console.log(`   → When user selects runflat checkbox: 0 results expected`)
      console.log(`   → When user deselects runflat checkbox: should show ${nonRunflatTires} tires`)
    } else {
      console.log(`\n✅ Runflat tires ARE available`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkRunflatTires()
