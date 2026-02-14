const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findWinterTires() {
  console.log('=== Suche nach Winterreifen 245/35 R21 ===')
  const front = await prisma.tire.findMany({
    where: {
      width: '245',
      profile: '35',
      diameter: '21',
      season: 'WINTER'
    },
    take: 3,
    orderBy: { price: 'asc' },
    select: {
      id: true,
      brand: true,
      model: true,
      width: true,
      profile: true,
      diameter: true,
      season: true,
      loadIndex: true,
      speedIndex: true,
      price: true
    }
  })
  console.log(`Gefunden: ${front.length} Reifen`)
  console.log(JSON.stringify(front, null, 2))

  console.log('\n=== Suche nach Winterreifen 275/30 R21 ===')
  const rear = await prisma.tire.findMany({
    where: {
      width: '275',
      profile: '30',
      diameter: '21',
      season: 'WINTER'
    },
    take: 3,
    orderBy: { price: 'asc' },
    select: {
      id: true,
      brand: true,
      model: true,
      width: true,
      profile: true,
      diameter: true,
      season: true,
      loadIndex: true,
      speedIndex: true,
      price: true
    }
  })
  console.log(`Gefunden: ${rear.length} Reifen`)
  console.log(JSON.stringify(rear, null, 2))

  await prisma.$disconnect()
}

findWinterTires().catch(console.error)
