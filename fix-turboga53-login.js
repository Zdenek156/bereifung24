const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

async function checkAndFixInfluencer() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Checking influencer TURBOGA53...\n')
    
    // Find influencer
    const influencer = await prisma.influencer.findUnique({
      where: { code: 'TURBOGA53' }
    })
    
    if (!influencer) {
      console.log('❌ Influencer TURBOGA53 not found in database!')
      console.log('\n📋 Creating influencer...')
      
      const hashedPassword = await bcrypt.hash('TurboGa53!', 10)
      
      const newInfluencer = await prisma.influencer.create({
        data: {
          code: 'TURBOGA53',
          email: 'turboga53@bereifung24.de',
          password: hashedPassword,
          name: 'Turbo Garage',
          isActive: true,
          isRegistered: true,
          isUnlimited: true,
          commissionPer1000Views: 1000, // €1 per 1000 views
          commissionPerRegistration: 500, // €0.50 per registration
          commissionPerAcceptedOffer: 2000, // €2 per accepted offer
          commissionPerWorkshopRegistration: 5000, // €5 per workshop registration
          commissionPerWorkshopOffer: 3000 // €3 per workshop offer
        }
      })
      
      console.log('✅ Influencer created!')
      console.log('\n📧 Email:', newInfluencer.email)
      console.log('🔑 Password: TurboGa53!')
      console.log('🔗 Code:', newInfluencer.code)
      console.log('\n💡 Login at: https://www.bereifung24.de/influencer/login')
      return
    }
    
    console.log('✅ Influencer found!\n')
    console.log('Details:')
    console.log('--------')
    console.log('ID:', influencer.id)
    console.log('Code:', influencer.code)
    console.log('Email:', influencer.email)
    console.log('Name:', influencer.name || '(not set)')
    console.log('Active:', influencer.isActive ? '✅' : '❌')
    console.log('Registered:', influencer.isRegistered ? '✅' : '❌')
    console.log('Has Password:', influencer.password ? '✅' : '❌')
    console.log('Unlimited:', influencer.isUnlimited ? '✅' : '❌')
    
    // Check if needs fixes
    const needsFix = !influencer.isActive || !influencer.isRegistered || !influencer.password
    
    if (needsFix) {
      console.log('\n⚠️  Issues detected! Fixing...')
      
      const updates = {}
      
      if (!influencer.isActive) {
        updates.isActive = true
        console.log('  - Setting isActive = true')
      }
      
      if (!influencer.isRegistered) {
        updates.isRegistered = true
        console.log('  - Setting isRegistered = true')
      }
      
      if (!influencer.password) {
        updates.password = await bcrypt.hash('TurboGa53!', 10)
        console.log('  - Setting password = TurboGa53!')
      }
      
      await prisma.influencer.update({
        where: { id: influencer.id },
        data: updates
      })
      
      console.log('\n✅ Fixed!')
      console.log('\n📧 Email:', influencer.email)
      console.log('🔑 Password: TurboGa53!')
      console.log('\n💡 Try logging in now at: https://www.bereifung24.de/influencer/login')
    } else {
      console.log('\n✅ Everything looks good!')
      console.log('\n📧 Email:', influencer.email)
      console.log('🔑 Password: (already set)')
      console.log('\n💡 If you forgot your password, I can reset it. Run this script again.')
    }
    
    // Show stats
    const clickCount = await prisma.affiliateClick.count({
      where: { influencerId: influencer.id }
    })
    
    const conversionCount = await prisma.affiliateConversion.count({
      where: { influencerId: influencer.id }
    })
    
    console.log('\n📊 Current Stats:')
    console.log('----------------')
    console.log('Total Clicks:', clickCount)
    console.log('Total Conversions:', conversionCount)
    
    if (conversionCount > 0) {
      const conversions = await prisma.affiliateConversion.findMany({
        where: { influencerId: influencer.id },
        select: { type: true }
      })
      
      const byType = conversions.reduce((acc, c) => {
        acc[c.type] = (acc[c.type] || 0) + 1
        return acc
      }, {})
      
      console.log('\nBy Type:')
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndFixInfluencer()
