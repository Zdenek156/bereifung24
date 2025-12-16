const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCalendarConnection() {
  console.log('🔍 Checking Google Calendar connections...\n')
  
  try {
    // Check workshops with calendar
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        calendarMode: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        employees: {
          select: {
            id: true,
            name: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true
          }
        }
      }
    })
    
    for (const workshop of workshops) {
      console.log(`\n📍 Workshop: ${workshop.companyName} (${workshop.id})`)
      console.log(`   Calendar Mode: ${workshop.calendarMode || 'NOT SET'}`)
      console.log(`   Workshop Calendar:`)
      console.log(`      ✓ Calendar ID: ${workshop.googleCalendarId ? '✅ YES' : '❌ NO'}`)
      console.log(`      ✓ Access Token: ${workshop.googleAccessToken ? `✅ YES (${workshop.googleAccessToken.substring(0, 20)}...)` : '❌ NO'}`)
      console.log(`      ✓ Refresh Token: ${workshop.googleRefreshToken ? `✅ YES (${workshop.googleRefreshToken.substring(0, 20)}...)` : '❌ NO'}`)
      console.log(`      ✓ Token Expiry: ${workshop.googleTokenExpiry || '❌ NO'}`)
      
      if (workshop.googleTokenExpiry) {
        const now = new Date()
        const isExpired = now > workshop.googleTokenExpiry
        console.log(`      ✓ Token Status: ${isExpired ? '⚠️ EXPIRED' : '✅ VALID'}`)
        if (isExpired) {
          const diff = Math.floor((now - workshop.googleTokenExpiry) / 1000 / 60)
          console.log(`      ✓ Expired ${diff} minutes ago`)
        }
      }
      
      console.log(`\n   Employees (${workshop.employees.length}):`)
      for (const emp of workshop.employees) {
        console.log(`      👤 ${emp.name} (${emp.id})`)
        console.log(`         - Calendar ID: ${emp.googleCalendarId ? '✅' : '❌'}`)
        console.log(`         - Access Token: ${emp.googleAccessToken ? '✅' : '❌'}`)
        console.log(`         - Refresh Token: ${emp.googleRefreshToken ? '✅' : '❌'}`)
        console.log(`         - Token Expiry: ${emp.googleTokenExpiry || '❌'}`)
        
        if (emp.googleTokenExpiry) {
          const now = new Date()
          const isExpired = now > emp.googleTokenExpiry
          console.log(`         - Status: ${isExpired ? '⚠️ EXPIRED' : '✅ VALID'}`)
        }
      }
    }
    
    console.log('\n✅ Check complete!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCalendarConnection()
