const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('\n=== Workshop Registration Debug ===\n')
  
  // Find recent workshop registrations
  const workshops = await prisma.workshop.findMany({
    include: {
      user: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  })
  
  console.log('Recent Workshop Registrations:')
  for (const workshop of workshops) {
    console.log(`- ${workshop.companyName} (${workshop.user.email})`)
    console.log(`  Created: ${workshop.createdAt}`)
    console.log(`  User ID: ${workshop.user.id}`)
    console.log(`  Workshop ID: ${workshop.id}\n`)
  }
  
  // Check for conversions
  console.log('\n=== Workshop Registration Conversions ===\n')
  const conversions = await prisma.affiliateConversion.findMany({
    where: {
      type: 'WORKSHOP_REGISTRATION'
    },
    include: {
      workshop: {
        include: {
          user: true
        }
      }
    },
    orderBy: {
      convertedAt: 'desc'
    }
  })
  
  if (conversions.length === 0) {
    console.log('❌ No workshop registration conversions found!')
  } else {
    console.log(`Found ${conversions.length} workshop registration conversion(s):`)
    for (const conv of conversions) {
      console.log(`- Workshop: ${conv.workshop?.companyName || 'Unknown'}`)
      console.log(`  Email: ${conv.workshop?.user.email || 'Unknown'}`)
      console.log(`  Amount: €${conv.commissionAmount / 100}`)
      console.log(`  Converted: ${conv.convertedAt}\n`)
    }
  }
  
  // Check affiliate data
  console.log('\n=== Affiliate Data ===\n')
  const influencer = await prisma.influencer.findUnique({
    where: { code: 'TURBOGA53' }
  })
  
  if (influencer) {
    console.log(`Influencer: ${influencer.email}`)
    console.log(`Workshop Registration Commission: €${influencer.commissionPerWorkshopRegistration / 100}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
