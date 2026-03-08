const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Check front tire in catalog
  const front = await prisma.tireCatalog.findFirst({
    where: { ean: '3286340844215' },
    select: { brand: true, model: true, width: true, height: true, diameter: true, loadIndex: true, speedIndex: true, dimension: true }
  })
  console.log('FRONT TIRE CATALOG:', JSON.stringify(front, null, 2))
  
  // Check rear tire in catalog
  const rear = await prisma.tireCatalog.findFirst({
    where: { ean: '3286340844611' },
    select: { brand: true, model: true, width: true, height: true, diameter: true, loadIndex: true, speedIndex: true, dimension: true }
  })
  console.log('REAR TIRE CATALOG:', JSON.stringify(rear, null, 2))
  
  process.exit(0)
}
main()
