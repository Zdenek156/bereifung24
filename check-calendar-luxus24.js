const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCalendar() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Luxus24' },
      include: { 
        employees: true
      }
    })

    console.log('=== LUXUS24 KALENDER DIAGNOSE ===\n')
    console.log('Workshop Kalender-Daten:')
    console.log('- calendarMode:', workshop?.calendarMode)
    console.log('- googleCalendarConnected:', workshop?.googleCalendarConnected)
    console.log('- googleCalendarId:', workshop?.googleCalendarId || 'NICHT GESETZT')
    console.log('- googleRefreshToken:', workshop?.googleRefreshToken ? 'VORHANDEN' : 'NICHT VORHANDEN')
    console.log('- Anzahl Employees:', workshop?.employees?.length || 0)
    
    if (workshop?.employees?.length > 0) {
      console.log('\nEmployee Details:')
      workshop.employees.forEach((emp, i) => {
        console.log(`  ${i+1}. ${emp.email || 'Keine Email'} (${emp.name}) - googleCalendarId: ${emp.googleCalendarId || 'NICHT VERBUNDEN'}`)
      })
    }

    console.log('\n=== FRONTEND LOGIK-PRÜFUNG ===')
    console.log('Die hasGoogleCalendar() Funktion prüft:')
    console.log('1. calendarMode === "GOOGLE_CALENDAR":', workshop?.calendarMode === 'GOOGLE_CALENDAR')
    console.log('2. ODER employees.length > 0:', (workshop?.employees?.length || 0) > 0)
    console.log('=> Ergebnis (hasGoogleCalendar):', workshop?.calendarMode === 'GOOGLE_CALENDAR' || (workshop?.employees?.length || 0) > 0)
    
    console.log('\n=== PROBLEM-ANALYSE ===')
    if (workshop?.calendarMode !== 'GOOGLE_CALENDAR' && (!workshop?.employees || workshop.employees.length === 0)) {
      console.log('❌ PROBLEM: calendarMode ist nicht "GOOGLE_CALENDAR" UND keine Employees vorhanden')
      console.log('   Aktueller calendarMode:', workshop?.calendarMode)
      console.log('   => Kalender wird NICHT angezeigt')
    } else if (workshop?.calendarMode === 'GOOGLE_CALENDAR' && !workshop?.googleCalendarId) {
      console.log('⚠️  WARNUNG: calendarMode ist "GOOGLE_CALENDAR" aber googleCalendarId fehlt')
      console.log('   => Kalender sollte angezeigt werden, aber API-Calls werden fehlschlagen')
    } else {
      console.log('✅ Kalender-Anzeige sollte verfügbar sein')
    }
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCalendar()
