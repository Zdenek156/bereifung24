const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBMWX3() {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: 'cmioxmk6g0001jgnzckb9hc39' },
    select: {
      id: true,
      make: true,
      model: true,
      year: true,
      summerTires: true,
      winterTires: true,
      allSeasonTires: true
    }
  })

  if (!vehicle) {
    console.log('❌ BMW X3 nicht gefunden')
    await prisma.$disconnect()
    return
  }

  console.log('=== BMW X3 (2015) ===\n')
  
  console.log('🌞 SOMMERREIFEN:')
  console.log(JSON.stringify(vehicle.summerTires, null, 2))
  
  console.log('\n❄️ WINTERREIFEN:')
  console.log(JSON.stringify(vehicle.winterTires, null, 2))
  
  console.log('\n🌍 GANZJAHRESREIFEN:')
  console.log(JSON.stringify(vehicle.allSeasonTires, null, 2))

  await prisma.$disconnect()
}

checkBMWX3().catch(console.error)
