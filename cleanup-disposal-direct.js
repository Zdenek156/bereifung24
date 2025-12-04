const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Suche Werkstatt mit bikeanzeigen@gmail.com...')
  
  // Find workshop by email
  const workshop = await prisma.user.findFirst({
    where: { 
      email: 'bikeanzeigen@gmail.com',
      role: 'WORKSHOP'
    },
    include: {
      workshop: true
    }
  })

  if (!workshop || !workshop.workshop) {
    console.log('❌ Werkstatt nicht gefunden!')
    return
  }

  console.log(`✅ Werkstatt gefunden: ${workshop.workshop.businessName} (ID: ${workshop.workshop.id})`)

  // Find all TIRE_CHANGE services for this workshop
  const services = await prisma.workshopService.findMany({
    where: {
      workshopId: workshop.workshop.id,
      serviceType: 'TIRE_CHANGE'
    },
    include: {
      servicePackages: true
    }
  })

  console.log(`\nGefundene Reifenwechsel-Services: ${services.length}`)

  // Delete old disposal packages
  let totalDeleted = 0
  for (const service of services) {
    const disposalPackages = service.servicePackages.filter(
      pkg => pkg.packageType === 'two_tires_disposal' || pkg.packageType === 'four_tires_disposal'
    )
    
    if (disposalPackages.length > 0) {
      console.log(`\n📦 Service "${service.serviceType}":`)
      for (const pkg of disposalPackages) {
        console.log(`   🗑️  Lösche: ${pkg.name} (${pkg.packageType}) - ${pkg.price}€`)
        await prisma.servicePackage.delete({
          where: { id: pkg.id }
        })
        totalDeleted++
      }
    }
  }

  console.log(`\n✅ FERTIG! ${totalDeleted} alte Disposal-Pakete gelöscht.`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Fehler:', e)
    prisma.$disconnect()
    process.exit(1)
  })
