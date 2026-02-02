const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const offer = await prisma.offer.findUnique({
    where: { id: 'cmky1y02b00013c0mpmyd2b0h' },
    include: {
      tireOptions: true,
      workshop: {
        select: {
          id: true,
          companyName: true,
          taxMode: true
        }
      }
    }
  })
  
  console.log('=== OFFER DATA FROM DATABASE ===')
  console.log('ID:', offer.id)
  console.log('Price:', offer.price, '€')
  console.log('TireBrand:', offer.tireBrand)
  console.log('TireModel:', offer.tireModel)
  console.log('InstallationFee:', offer.installationFee, '€')
  console.log('SelectedTireOptionIds:', offer.selectedTireOptionIds)
  
  console.log('\n=== TIRE OPTIONS ===')
  offer.tireOptions.forEach(opt => {
    const isSelected = offer.selectedTireOptionIds?.includes(opt.id)
    console.log(`${isSelected ? '✓ SELECTED' : '○'} ${opt.brand} ${opt.model} - ${opt.pricePerTire}€ (${opt.carTireType})`)
  })
  
  await prisma.$disconnect()
}

main().catch(console.error)
