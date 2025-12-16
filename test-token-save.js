const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testTokenSave() {
  console.log('🧪 Testing Google Calendar token save...\n')
  
  try {
    // Find first workshop
    const workshop = await prisma.workshop.findFirst({
      select: {
        id: true,
        companyName: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
      }
    })
    
    if (!workshop) {
      console.error('❌ No workshop found')
      return
    }
    
    console.log(`📍 Testing with workshop: ${workshop.companyName}`)
    console.log(`   ID: ${workshop.id}`)
    console.log(`   Current Calendar ID: ${workshop.googleCalendarId || 'NULL'}`)
    console.log(`   Current Access Token: ${workshop.googleAccessToken ? 'EXISTS' : 'NULL'}`)
    console.log(`   Current Refresh Token: ${workshop.googleRefreshToken ? 'EXISTS' : 'NULL'}`)
    
    console.log('\n📝 Attempting to save test tokens...')
    
    const testTokens = {
      googleCalendarId: 'test-calendar-id-123',
      googleAccessToken: 'test-access-token-456',
      googleRefreshToken: 'test-refresh-token-789',
      googleTokenExpiry: new Date(Date.now() + 3600 * 1000)
    }
    
    const updated = await prisma.workshop.update({
      where: { id: workshop.id },
      data: testTokens,
      select: {
        id: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true
      }
    })
    
    console.log('\n✅ Update successful!')
    console.log('   New Calendar ID:', updated.googleCalendarId)
    console.log('   New Access Token:', updated.googleAccessToken)
    console.log('   New Refresh Token:', updated.googleRefreshToken)
    console.log('   New Token Expiry:', updated.googleTokenExpiry)
    
    // Verify by reading again
    console.log('\n🔍 Verifying by re-reading from database...')
    const verified = await prisma.workshop.findUnique({
      where: { id: workshop.id },
      select: {
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true
      }
    })
    
    console.log('   Verified Calendar ID:', verified?.googleCalendarId)
    console.log('   Verified Access Token:', verified?.googleAccessToken)
    console.log('   Verified Refresh Token:', verified?.googleRefreshToken)
    console.log('   Verified Token Expiry:', verified?.googleTokenExpiry)
    
    // Cleanup - restore original values
    console.log('\n🧹 Cleaning up - restoring original values...')
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        googleCalendarId: workshop.googleCalendarId,
        googleAccessToken: workshop.googleAccessToken,
        googleRefreshToken: workshop.googleRefreshToken,
      }
    })
    console.log('✅ Cleanup complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
    console.error('Error message:', error.message)
    if (error.meta) {
      console.error('Error meta:', error.meta)
    }
  } finally {
    await prisma.$disconnect()
  }
}

testTokenSave()
