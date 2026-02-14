const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findWorkshopsWithInventory() {
  try {
    const workshopsWithTires = await prisma.workshopInventory.groupBy({
      by: ['workshopId'],
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 10
    })
    
    console.log('\n=== WORKSHOPS WITH TIRE INVENTORY ===')
    
    for (const ws of workshopsWithTires) {
      const workshop = await prisma.workshop.findUnique({
        where: { id: ws.workshopId },
        select: { companyName: true }
      })
      
      const inStock = await prisma.workshopInventory.count({
        where: {
          workshopId: ws.workshopId,
          stock: { gte: 4 }
        }
      })
      
      console.log(`\n${workshop?.companyName || 'Unknown'}`)
      console.log(`  ID: ${ws.workshopId}`)
      console.log(`  Total: ${ws._count.id} tire records`)
      console.log(`  Stock >= 4: ${inStock}`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findWorkshopsWithInventory()
