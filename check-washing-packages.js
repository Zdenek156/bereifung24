const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const svcs = await p.workshopService.findMany({
    where: { serviceType: 'WHEEL_CHANGE' },
    select: {
      id: true,
      workshopId: true,
      washingAvailable: true,
      washingPrice: true,
      workshop: { select: { companyName: true } },
      servicePackages: {
        select: { id: true, packageType: true, name: true, price: true, isActive: true },
        orderBy: { packageType: 'asc' }
      }
    }
  })
  for (const s of svcs) {
    console.log(`\n${s.workshop.companyName} (washingAvailable=${s.washingAvailable}, washingPrice=${s.washingPrice}):`)
    for (const pkg of s.servicePackages) {
      console.log(`  ${pkg.packageType} = ${pkg.name} (${pkg.price}€, active=${pkg.isActive})`)
    }
    const hasWashingPkg = s.servicePackages.some(p => p.packageType === 'with_washing')
    if (!hasWashingPkg && s.washingAvailable) {
      console.log('  ⚠️  MISSING with_washing package!')
    }
  }
  await p.$disconnect()
}
main().catch(e => { console.error(e); process.exit(1) })
