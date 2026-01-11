const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCalendarConnection() {
  try {
    console.log('🔍 Checking Google Calendar connections...\n')
    
    // Check all workshops with calendar IDs
    const workshops = await prisma.workshop.findMany({
      where: {
        googleCalendarId: { not: null }
      },
      select: {
        id: true,
        companyName: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })
    
    console.log(`Found ${workshops.length} workshop(s) with Google Calendar:\n`)
    
    for (const workshop of workshops) {
      console.log(`📍 Workshop: ${workshop.companyName}`)
      console.log(`   Email: ${workshop.user.email}`)
      console.log(`   Calendar ID: ${workshop.googleCalendarId}`)
      console.log(`   Has Access Token: ${!!workshop.googleAccessToken}`)
      console.log(`   Access Token Length: ${workshop.googleAccessToken?.length || 0}`)
      console.log(`   Has Refresh Token: ${!!workshop.googleRefreshToken}`)
      console.log(`   Refresh Token Length: ${workshop.googleRefreshToken?.length || 0}`)
      console.log(`   Token Expiry: ${workshop.googleTokenExpiry}`)
      console.log('')
    }
    
    // Check employees with calendar IDs
    const employees = await prisma.employee.findMany({
      where: {
        googleCalendarId: { not: null }
      },
      select: {
        id: true,
        name: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        workshop: {
          select: {
            companyName: true
          }
        }
      }
    })
    
    console.log(`\nFound ${employees.length} employee(s) with Google Calendar:\n`)
    
    for (const emp of employees) {
      console.log(`👤 Employee: ${emp.name}`)
      console.log(`   Workshop: ${emp.workshop.companyName}`)
      console.log(`   Calendar ID: ${emp.googleCalendarId}`)
      console.log(`   Has Access Token: ${!!emp.googleAccessToken}`)
      console.log(`   Access Token Length: ${emp.googleAccessToken?.length || 0}`)
      console.log(`   Has Refresh Token: ${!!emp.googleRefreshToken}`)
      console.log(`   Refresh Token Length: ${emp.googleRefreshToken?.length || 0}`)
      console.log(`   Token Expiry: ${emp.googleTokenExpiry}`)
      console.log('')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCalendarConnection()
