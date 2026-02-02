const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const offerId = 'cmky1y02b00013c0mpmyd2b0h'
  
  // Korrekte Berechnung:
  // Pirelli 100: 100€ × 2 (FRONT_TWO) = 200€
  // Installation: 82€ (aus offer.installationFee)
  // Total: 282€
  
  const correctPrice = 282
  
  console.log(`Updating offer ${offerId} price from 222 to ${correctPrice}...`)
  
  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: { price: correctPrice }
  })
  
  console.log('✓ Offer price updated:')
  console.log(`  Old: 222€`)
  console.log(`  New: ${updated.price}€`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
