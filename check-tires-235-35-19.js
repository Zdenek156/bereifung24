const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkTires() {
  try {
    const workshopId = 'cml3g7rxd000ckeyn9ypqgg65' // Luxus24 from screenshot
    
    const tires = await prisma.workshopInventory.findMany({
      where: {
        workshopId: workshopId,
        width: '235',
        height: '35',
        diameter: '19'
      },
      select: {
        id: true,
        brand: true,
        model: true,
        width: true,
        height: true,
        diameter: true,
        season: true,
        loadIndex: true,
        speedIndex: true,
        labelFuelEfficiency: true,
        labelWetGrip: true,
        labelNoise: true,
        price: true,
        stock: true
      },
      orderBy: {
        price: 'asc'
      }
    })
    
    console.log(`\n📊 Found ${tires.length} tires for 235/35 R19 at workshop ${workshopId}:\n`)
    
    tires.forEach((tire, idx) => {
      console.log(`${idx + 1}. ${tire.brand} ${tire.model}`)
      console.log(`   Season: ${tire.season || 'N/A'}`)
      console.log(`   Load/Speed: ${tire.loadIndex || 'N/A'}/${tire.speedIndex || 'N/A'}`)
      console.log(`   EU Labels: Fuel=${tire.labelFuelEfficiency || 'N/A'} | Wet=${tire.labelWetGrip || 'N/A'} | Noise=${tire.labelNoise || 'N/A'}`)
      console.log(`   Price: €${tire.price} | Stock: ${tire.stock}`)
      console.log('')
    })
    
    // Count by category
    const premiumBrands = ['Michelin', 'Continental', 'Goodyear', 'Bridgestone', 'Pirelli', 'Dunlop']
    const premium = tires.filter(t => premiumBrands.some(b => t.brand.toLowerCase().includes(b.toLowerCase())))
    const withLabels = tires.filter(t => t.labelFuelEfficiency && t.labelWetGrip && t.labelNoise)
    const withoutLabels = tires.filter(t => !t.labelFuelEfficiency || !t.labelWetGrip || !t.labelNoise)
    
    console.log(`\n📈 Statistics:`)
    console.log(`   Total tires: ${tires.length}`)
    console.log(`   Premium brands: ${premium.length}`)
    console.log(`   With complete EU labels: ${withLabels.length}`)
    console.log(`   Without complete labels: ${withoutLabels.length}`)
    
    // Check all workshops too
    const allWorkshops = await prisma.workshopInventory.groupBy({
      by: ['workshopId'],
      where: {
        width: '235',
        height: '35',
        diameter: '19'
      },
      _count: true
    })
    
    console.log(`\n🏭 Workshops with 235/35 R19 tires:`)
    for (const ws of allWorkshops) {
      console.log(`   Workshop ${ws.workshopId}: ${ws._count} tires`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkTires()
