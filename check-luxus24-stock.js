const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLuxus24Inventory() {
  try {
    const total = await prisma.workshopInventory.count({
      where: {
        workshopId: 'cm3jqiigm0000fz23m62ys5op'
      }
    })
    
    const withStock = await prisma.workshopInventory.count({
      where: {
        workshopId: 'cm3jqiigm0000fz23m62ys5op',
        stock: { gt: 0 }
      }
    })
    
    const withStock4Plus = await prisma.workshopInventory.count({
      where: {
        workshopId: 'cm3jqiigm0000fz23m62ys5op',
        stock: { gte: 4 }
      }
    })
    
    console.log('\n=== LUXUS24 INVENTORY ===')
    console.log(`Total tire records: ${total}`)
    console.log(`With stock > 0: ${withStock}`)
    console.log(`With stock >= 4: ${withStock4Plus}`)
    
    // Get stock distribution
    const stockDist = await prisma.$queryRaw`
      SELECT stock, COUNT(*) as count
      FROM workshop_inventory
      WHERE workshop_id = 'cm3jqiigm0000fz23m62ys5op'
      GROUP BY stock
      ORDER BY stock DESC
      LIMIT 10
    `
    
    console.log('\nStock distribution (top 10):')
    stockDist.forEach(s => {
      console.log(`  Stock ${s.stock}: ${s.count} tire records`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLuxus24Inventory()
