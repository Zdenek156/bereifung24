const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const offer = await prisma.offer.findUnique({
    where: { id: 'cmky1y02b00013c0mpmyd2b0h' },
    select: {
      id: true,
      price: true,
      installationFee: true,
      disposalFee: true,
      runFlatSurcharge: true,
      tireOptions: true,
      selectedTireOptionIds: true
    }
  })
  
  console.log('Offer Details:')
  console.log('  Price:', offer.price, '€')
  console.log('  InstallationFee:', offer.installationFee, '€')
  console.log('  DisposalFee:', offer.disposalFee, '€')
  console.log('  RunFlatSurcharge:', offer.runFlatSurcharge, '€')
  console.log('\nTire Options:')
  offer.tireOptions.forEach(opt => {
    const isSelected = offer.selectedTireOptionIds.includes(opt.id)
    console.log(`  ${isSelected ? '✓' : '○'} ${opt.brand} ${opt.model}`)
    console.log(`     PricePerTire: ${opt.pricePerTire}€`)
    console.log(`     CarTireType: ${opt.carTireType}`)
    console.log(`     MontagePrice: ${opt.montagePrice}€`)
  })
  
  // Berechnung:
  const selectedOpt = offer.tireOptions.find(o => offer.selectedTireOptionIds.includes(o.id))
  if (selectedOpt) {
    const qty = selectedOpt.carTireType === 'FRONT_TWO' ? 2 : 4
    const tiresCost = selectedOpt.pricePerTire * qty
    const montageCost = selectedOpt.montagePrice || offer.installationFee
    
    console.log('\n--- KORREKTE BERECHNUNG ---')
    console.log(`Reifen: ${selectedOpt.pricePerTire}€ × ${qty} = ${tiresCost}€`)
    console.log(`Montage: ${montageCost}€`)
    console.log(`TOTAL: ${tiresCost + montageCost}€`)
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)
