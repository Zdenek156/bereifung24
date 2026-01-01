const { PrismaClient } = require('@prisma/client')

async function test() {
  const prisma = new PrismaClient()
  
  try {
    console.log('Testing Prisma connection...\n')
    
    // Simple test query
    const count = await prisma.influencer.count()
    console.log(`Total influencers in database: ${count}\n`)
    
    // Check specific code
    const influencer = await prisma.influencer.findUnique({
      where: { code: 'TURBOGA53' }
    })
    
    if (!influencer) {
      console.log('❌ Influencer TURBOGA53 NOT FOUND!\n')
      console.log('Listing all influencers:')
      const all = await prisma.influencer.findMany({
        select: {
          code: true,
          email: true,
          isActive: true
        }
      })
      console.table(all)
    } else {
      console.log('✅ Influencer TURBOGA53 found!')
      console.log(JSON.stringify(influencer, null, 2))
      
      // Get click and conversion counts
      const clickCount = await prisma.affiliateClick.count({
        where: { influencerId: influencer.id }
      })
      
      const conversionCount = await prisma.affiliateConversion.count({
        where: { influencerId: influencer.id }
      })
      
      console.log(`\nClicks: ${clickCount}`)
      console.log(`Conversions: ${conversionCount}`)
    }
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
