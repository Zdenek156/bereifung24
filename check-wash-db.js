const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const services = await p.workshopService.findMany({
    where: { serviceType: 'WHEEL_CHANGE' },
    include: { servicePackages: true, workshop: { select: { companyName: true } } }
  })
  for (const ws of services) {
    console.log('Workshop:', ws.workshop?.companyName)
    console.log('  washingPrice:', ws.washingPrice)
    console.log('  washingAvailable:', ws.washingAvailable)
    console.log('  Packages:')
    ws.servicePackages.forEach(p => console.log('   ', p.packageType, p.name, Number(p.price), 'active:', p.isActive))
  }
  await p.$disconnect()
}
main()
