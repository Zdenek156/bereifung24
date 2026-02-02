// Debug: Check calendar availability logic
const http = require('http')

http.get('http://localhost:3000/api/tire-requests/cml3jujll0011dlybx2sdyrk7', (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.log('API Error:', res.statusCode)
      console.log(data.substring(0, 200))
      return
    }
    
    try {
      const json = JSON.parse(data)
      const offer = json.request.offers[0]
      
      console.log('=== DEBUG: CALENDAR AVAILABILITY ===\n')
      console.log('Workshop:', offer.workshop.companyName)
      console.log('Workshop Data:')
      console.log('  - googleCalendarId:', offer.workshop.googleCalendarId || 'UNDEFINED/NULL')
      console.log('  - calendarMode:', offer.workshop.calendarMode)
      console.log('  - employees:', offer.workshop.employees ? offer.workshop.employees.length : 'UNDEFINED')
      
      if (offer.workshop.employees && offer.workshop.employees.length > 0) {
        console.log('\nEmployee Details:')
        offer.workshop.employees.forEach((emp, i) => {
          console.log(`  ${i+1}. ${emp.name} - googleCalendarId: ${emp.googleCalendarId || 'NICHT VORHANDEN'}`)
        })
      }
      
      console.log('\n=== FRONTEND LOGIC SIMULATION ===')
      console.log('hasGoogleCalendar() checks:')
      console.log('1. offer.workshop.googleCalendarId:', !!offer.workshop.googleCalendarId)
      
      if (offer.workshop.employees && offer.workshop.employees.length > 0) {
        const hasEmpCalendar = offer.workshop.employees.some(emp => emp.googleCalendarId)
        console.log('2. employees.some(emp => emp.googleCalendarId):', hasEmpCalendar)
        console.log('\n=> RESULT:', !!(offer.workshop.googleCalendarId || hasEmpCalendar))
      } else {
        console.log('2. No employees with calendar')
        console.log('\n=> RESULT:', !!offer.workshop.googleCalendarId)
      }
      
      console.log('\n=== EXPECTED ===')
      console.log('Kalender sollte angezeigt werden:', !!(offer.workshop.googleCalendarId || (offer.workshop.employees && offer.workshop.employees.some(e => e.googleCalendarId))) ? '✅ JA' : '❌ NEIN')
      
    } catch (e) {
      console.error('Parse Error:', e.message)
    }
  })
}).on('error', err => console.error('HTTP Error:', err.message))
