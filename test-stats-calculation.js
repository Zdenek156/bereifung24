const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const influencer = await prisma.influencer.findUnique({
    where: { code: 'TURBOGA53' },
    include: {
      conversions: {
        orderBy: { convertedAt: 'desc' }
      }
    }
  })
  
  if (!influencer) {
    console.log('Influencer not found')
    return
  }
  
  console.log('\n=== Influencer Stats Test ===\n')
  console.log(`Code: ${influencer.code}`)
  console.log(`Email: ${influencer.email}\n`)
  
  console.log('Conversions:')
  let totalEarnings = 0
  
  influencer.conversions.forEach(conv => {
    const amount = conv.commissionAmount || 0
    totalEarnings += amount
    
    console.log(`- ${conv.type}: €${amount / 100} (${conv.isPaid ? 'PAID' : 'UNPAID'}) - ${conv.convertedAt}`)
  })
  
  console.log(`\nTotal Earnings: €${totalEarnings / 100}`)
  console.log(`Total Earnings (raw cents): ${totalEarnings}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
