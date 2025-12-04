const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Suche alle alten Disposal-Pakete...\n')

  // Find all disposal packages
  const packagesToDelete = await prisma.servicePackage.findMany({
    where: {
      OR: [
        { packageType: 'two_tires_disposal' },
        { packageType: 'four_tires_disposal' }
      ]
    },
    include: {
      workshopService: {
        include: {
          workshop: true
        }
      }
    }
  })

  console.log(`📦 Gefunden: ${packagesToDelete.length} alte Disposal-Pakete\n`)

  if (packagesToDelete.length === 0) {
    console.log('✅ Keine alten Pakete gefunden - alles sauber!')
    return
  }

  // Show what will be deleted
  packagesToDelete.forEach(pkg => {
    console.log(`🗑️  ${pkg.name} - ${pkg.price}€ - Werkstatt: ${pkg.workshopService.workshop.companyName}`)
  })

  console.log('\n🚀 Lösche Pakete...\n')

  // Delete them
  const result = await prisma.servicePackage.deleteMany({
    where: {
      id: {
        in: packagesToDelete.map(pkg => pkg.id)
      }
    }
  })

  console.log(`\n✅ ERFOLGREICH! ${result.count} alte Disposal-Pakete gelöscht.`)
  console.log('\n💡 Jetzt die Seite neu laden - du solltest nur noch 2 Pakete sehen!')
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error('❌ Fehler:', e)
    prisma.$disconnect()
    process.exit(1)
  })
