const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const offerId = 'cmky1y02b00013c0mpmyd2b0h'
  
  // Get selected tire option
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { tireOptions: true }
  })
  
  const selectedOption = offer.tireOptions.find(opt => 
    offer.selectedTireOptionIds.includes(opt.id)
  )
  
  console.log('Updating offer tireBrand/tireModel to match selected option:')
  console.log(`  Old: ${offer.tireBrand} ${offer.tireModel}`)
  console.log(`  New: ${selectedOption.brand} ${selectedOption.model}`)
  
  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: {
      tireBrand: selectedOption.brand,
      tireModel: selectedOption.model
    }
  })
  
  console.log('\n✓ Updated successfully!')
  console.log(`  TireBrand: ${updated.tireBrand}`)
  console.log(`  TireModel: ${updated.tireModel}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
