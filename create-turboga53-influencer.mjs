/**
 * Create Influencer TURBOGA53
 * Run with: node create-turboga53-influencer.js
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createInfluencer() {
  try {
    console.log('🔍 Checking if influencer TURBOGA53 exists...\n')
    
    // Check if already exists
    const existing = await prisma.influencer.findUnique({
      where: { code: 'TURBOGA53' }
    })
    
    if (existing) {
      console.log('✅ Influencer TURBOGA53 already exists!')
      console.log('\nDetails:')
      console.log('- ID:', existing.id)
      console.log('- Email:', existing.email)
      console.log('- Active:', existing.isActive)
      console.log('- Unlimited:', existing.isUnlimited)
      console.log('- Active From:', existing.activeFrom)
      console.log('- Active Until:', existing.activeUntil)
      console.log('- Commission per 1000 views:', existing.commissionPer1000Views)
      console.log('- Commission per registration:', existing.commissionPerRegistration)
      console.log('- Commission per accepted offer:', existing.commissionPerAcceptedOffer)
      
      // Update to make sure it's active
      console.log('\n🔄 Updating to ensure it\'s active...')
      const updated = await prisma.influencer.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          isUnlimited: true
        }
      })
      console.log('✅ Updated! Now active and unlimited.')
      
      return updated
    }
    
    // Create new influencer
    console.log('📝 Creating new influencer TURBOGA53...')
    
    const hashedPassword = await bcrypt.hash('TurboGarage2024!', 10)
    
    const influencer = await prisma.influencer.create({
      data: {
        code: 'TURBOGA53',
        email: 'turbo@garage53.de',
        password: hashedPassword,
        isActive: true,
        isUnlimited: true,
        commissionPer1000Views: 1000,  // 1.00€ per 1000 views (=0.001€ per view)
        commissionPerRegistration: 500,  // 0.50€ per registration
        commissionPerAcceptedOffer: 2000,  // 2.00€ per accepted offer
        commissionPerWorkshopRegistration: 5000,  // 5.00€ per workshop registration
        commissionPerWorkshopOffer: 1000  // 1.00€ per workshop offer
      }
    })
    
    console.log('✅ Influencer TURBOGA53 created successfully!')
    console.log('\nDetails:')
    console.log('- ID:', influencer.id)
    console.log('- Code:', influencer.code)
    console.log('- Email:', influencer.email)
    console.log('- Password: TurboGarage2024!')
    console.log('- Active:', influencer.isActive)
    console.log('- Unlimited:', influencer.isUnlimited)
    console.log('\nCommissions:')
    console.log('- Per 1000 views:', influencer.commissionPer1000Views / 100, '€')
    console.log('- Per registration:', influencer.commissionPerRegistration / 100, '€')
    console.log('- Per accepted offer:', influencer.commissionPerAcceptedOffer / 100, '€')
    console.log('- Per workshop registration:', influencer.commissionPerWorkshopRegistration / 100, '€')
    console.log('- Per workshop offer:', influencer.commissionPerWorkshopOffer / 100, '€')
    
    console.log('\n✅ Now you can:')
    console.log('1. Visit: https://www.bereifung24.de?ref=TURBOGA53')
    console.log('2. Login at: /influencer/login with')
    console.log('   Email: turbo@garage53.de')
    console.log('   Password: TurboGarage2024!')
    console.log('3. Check dashboard at: /influencer/dashboard')
    
    return influencer
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

createInfluencer()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
