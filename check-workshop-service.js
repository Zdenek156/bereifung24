const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get the offer to find workshopId
  const offer = await prisma.offer.findUnique({
    where: { id: 'cmky1y02b00013c0mpmyd2b0h' },
    select: { workshopId: true }
  })
  
  console.log('WorkshopId:', offer.workshopId)
  
  // Get all services for this workshop
  const services = await prisma.workshopService.findMany({
    where: { 
      workshopId: offer.workshopId,
      serviceType: 'TIRE_CHANGE'
    }
  })
  
  console.log('\nWorkshop Services:')
  services.forEach(s => {
    console.log(`\nService: ${s.serviceType}`)
    console.log(`  Active: ${s.isActive}`)
    console.log(`  BasePrice (2 Reifen): ${s.basePrice}€`)
    console.log(`  BasePrice4 (4 Reifen): ${s.basePrice4}€`)
    console.log(`  DisposalFee: ${s.disposalFee}€`)
    console.log(`  RunFlatSurcharge: ${s.runFlatSurcharge}€`)
  })
  
  // Get workshop packages
  const packages = await prisma.servicePackage.findMany({
    where: { 
      workshopServiceId: { in: services.map(s => s.id) }
    }
  })
  
  console.log('\n\nService Packages:')
  packages.forEach(p => {
    console.log(`\nPackage: ${p.name}`)
    console.log(`  Price: ${p.price}€`)
    console.log(`  Description: ${p.description}`)
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)
