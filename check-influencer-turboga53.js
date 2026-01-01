// Use same prisma singleton pattern as in lib/prisma.ts
const { PrismaClient } = require('@prisma/client')

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

async function checkInfluencer() {
  try {
    console.log('Checking influencer code: TURBOGA53\n')
    
    // Find influencer
    const influencer = await prisma.influencer.findUnique({
      where: { code: 'TURBOGA53' },
      include: {
        clicks: {
          orderBy: { clickedAt: 'desc' },
          take: 10
        },
        conversions: {
          orderBy: { convertedAt: 'desc' },
          take: 10
        }
      }
    })
    
    if (!influencer) {
      console.log('❌ Influencer with code TURBOGA53 NOT FOUND in database!')
      console.log('\nListing all influencers:')
      const all = await prisma.influencer.findMany({
        select: {
          id: true,
          code: true,
          isActive: true,
          email: true
        }
      })
      console.table(all)
      return
    }
    
    console.log('✅ Influencer found!')
    console.log('\nInfluencer Details:')
    console.log('-------------------')
    console.log('ID:', influencer.id)
    console.log('Code:', influencer.code)
    console.log('Email:', influencer.email)
    console.log('Active:', influencer.isActive)
    console.log('Unlimited:', influencer.isUnlimited)
    console.log('Active From:', influencer.activeFrom)
    console.log('Active Until:', influencer.activeUntil)
    console.log('Commission per 1000 views:', influencer.commissionPer1000Views)
    console.log('Commission per registration:', influencer.commissionPerRegistration)
    
    console.log('\n Recent Clicks (last 10):')
    console.log('-------------------------')
    if (influencer.clicks.length === 0) {
      console.log('❌ No clicks found!')
    } else {
      influencer.clicks.forEach((click, i) => {
        console.log(`${i + 1}. ${click.clickedAt.toISOString()} - ${click.deviceType} - ${click.ipAddress}`)
      })
    }
    
    console.log('\nRecent Conversions (last 10):')
    console.log('-----------------------------')
    if (influencer.conversions.length === 0) {
      console.log('❌ No conversions found!')
    } else {
      influencer.conversions.forEach((conv, i) => {
        console.log(`${i + 1}. ${conv.type} - ${conv.convertedAt.toISOString()} - €${conv.commissionAmount || 0}`)
      })
    }
    
    // Check if there are any active issues
    console.log('\n🔍 Diagnostics:')
    console.log('---------------')
    const now = new Date()
    
    if (!influencer.isActive) {
      console.log('⚠️  Influencer is INACTIVE')
    } else {
      console.log('✅ Influencer is active')
    }
    
    if (!influencer.isUnlimited) {
      if (influencer.activeFrom && influencer.activeFrom > now) {
        console.log('⚠️  Influencer is not yet active (activeFrom:', influencer.activeFrom, ')')
      }
      if (influencer.activeUntil && influencer.activeUntil < now) {
        console.log('⚠️  Influencer has expired (activeUntil:', influencer.activeUntil, ')')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkInfluencer()
