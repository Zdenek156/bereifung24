const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== Registered Customers with Conversions ===\n')
  
  const conversions = await prisma.affiliateConversion.findMany({
    where: {
      type: 'REGISTRATION'
    },
    include: {
      customer: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      convertedAt: 'desc'
    }
  })
  
  conversions.forEach((c, i) => {
    console.log(`${i+1}. Email: ${c.customer?.user.email || 'N/A'}`)
    console.log(`   Converted: ${c.convertedAt}`)
    console.log(`   Amount: €${c.commissionAmount/100}`)
    console.log(`   Customer ID: ${c.customerId}`)
    console.log('')
  })
  
  console.log(`Total: ${conversions.length} registration conversions`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
