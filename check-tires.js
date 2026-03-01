const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const [catalogCount, workshopSuppliers, suppliers] = await Promise.all([
    prisma.tireCatalog.count(),
    prisma.workshopSupplier.findMany({
      where: { workshopId: 'cmi9c1qzn000110hd0838ppwx' }
    }),
    prisma.supplierConfig.findMany({ take: 10 })
  ])

  console.log('TireCatalog count:', catalogCount)
  console.log('WorkshopSuppliers for Müller:', JSON.stringify(workshopSuppliers, null, 2))
  console.log('SupplierConfigs:', JSON.stringify(suppliers.map(s => ({ name: s.name, supplier: s.supplier, isActive: s.isActive })), null, 2))
}

main().catch(console.error).finally(() => prisma.$disconnect())
