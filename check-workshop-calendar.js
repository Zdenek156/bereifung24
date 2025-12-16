const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshop() {
  // Fetch full workshop object
  const workshopFull = await prisma.workshop.findUnique({
    where: { id: 'cmi9c1qzn000110hd0838ppwx' }
  })
  
  console.log('Workshop Calendar Status:')
  console.log({
    companyName: workshopFull.companyName,
    calendarMode: workshopFull.calendarMode,
    googleCalendarId: workshopFull.googleCalendarId,
    hasAccessToken: !!workshopFull.googleAccessToken,
    accessTokenLength: workshopFull.googleAccessToken ? workshopFull.googleAccessToken.length : 0,
    hasRefreshToken: !!workshopFull.googleRefreshToken,
    refreshTokenLength: workshopFull.googleRefreshToken ? workshopFull.googleRefreshToken.length : 0,
    tokenExpiry: workshopFull.googleTokenExpiry
  })
  
  const hasWorkshopCalendar = !!(
    workshopFull.googleCalendarId && 
    workshopFull.googleAccessToken && 
    workshopFull.googleRefreshToken
  )
  
  console.log('\nWorkshop has calendar:', hasWorkshopCalendar)
  console.log('Will use employee calendars:', !hasWorkshopCalendar)
  
  await prisma.$disconnect()
}

checkWorkshop().catch(console.error)
