const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Check TireCatalog suppliers
  const catalogSample = await prisma.tireCatalog.groupBy({
    by: ['supplier'],
    _count: { id: true }
  })
  console.log('TireCatalog by supplier:', JSON.stringify(catalogSample, null, 2))

  // Check if there are tires for 225/45R17 in catalog
  const tires225 = await prisma.tireCatalog.findMany({
    where: { width: '225', height: '45', diameter: '17', isActive: true },
    take: 5,
    select: { supplier: true, brand: true, model: true, season: true, price: true }
  })
  console.log('Sample 225/45R17 tires:', JSON.stringify(tires225, null, 2))
  
  // Check TYRESYSTEM count for this size
  const tyresystemCount = await prisma.tireCatalog.count({
    where: { supplier: 'TYRESYSTEM', width: '225', height: '45', diameter: '17', isActive: true }
  })
  console.log('TYRESYSTEM 225/45R17 count:', tyresystemCount)
}

main().catch(console.error).finally(() => prisma.$disconnect())
