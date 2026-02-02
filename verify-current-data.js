const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const offerId = 'cmky1y02b00013c0mpmyd2b0h'
  
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      price: true,
      tireBrand: true,
      tireModel: true,
      installationFee: true,
      selectedTireOptionIds: true
    }
  })
  
  console.log('=== CURRENT OFFER DATA ===')
  console.log('ID:', offer.id)
  console.log('Price:', offer.price, '€')
  console.log('TireBrand:', offer.tireBrand)
  console.log('TireModel:', offer.tireModel)
  console.log('InstallationFee:', offer.installationFee, '€')
  console.log('SelectedTireOptionIds:', offer.selectedTireOptionIds)
  
  console.log('\n=== WHAT SHOULD BE DISPLAYED ===')
  console.log('Marke:', offer.tireBrand)
  console.log('Modell:', offer.tireModel)
  console.log('Preis (inkl. Montage):', offer.price, '€')
  
  await prisma.$disconnect()
}

main().catch(console.error)
