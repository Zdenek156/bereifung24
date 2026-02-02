const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Check recent offers with workshop PayPal emails
  const offers = await prisma.offer.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      workshop: {
        select: {
          id: true,
          companyName: true,
          paypalEmail: true
        }
      },
      tireRequest: {
        select: {
          id: true
        }
      }
    }
  })

  console.log('=== Recent Offers and PayPal Emails ===')
  offers.forEach(offer => {
    console.log(`\nOffer ID: ${offer.id}`)
    console.log(`Request ID: ${offer.tireRequest.id}`)
    console.log(`Workshop: ${offer.workshop.companyName}`)
    console.log(`PayPal Email: ${offer.workshop.paypalEmail || '❌ NOT SET'}`)
  })

  // Count workshops with PayPal
  const withPayPal = await prisma.workshop.count({
    where: {
      paypalEmail: {
        not: null
      }
    }
  })

  const total = await prisma.workshop.count()

  console.log(`\n=== Summary ===`)
  console.log(`Workshops with PayPal: ${withPayPal} / ${total}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
