// Verify API returns googleCalendarId
fetch('http://localhost:3000/api/tire-requests/cml3jujll0011dlybx2sdyrk7')
  .then(r => r.json())
  .then(data => {
    console.log('=== API RESPONSE VERIFICATION ===\n')
    const offer = data.request.offers[0]
    console.log('Workshop:', offer.workshop.companyName)
    console.log('- googleCalendarId:', offer.workshop.googleCalendarId || 'NICHT VORHANDEN ❌')
    console.log('- calendarMode:', offer.workshop.calendarMode)
    console.log('- employees:', offer.workshop.employees.length)
    
    const hasWorkshopCalendar = !!offer.workshop.googleCalendarId
    const hasEmployeeCalendar = offer.workshop.employees.some(e => e.googleCalendarId)
    
    console.log('\n=== KALENDER-VERFÜGBARKEIT ===')
    console.log('Werkstatt-Kalender:', hasWorkshopCalendar ? '✅ VORHANDEN' : '❌ NICHT VORHANDEN')
    console.log('Mitarbeiter-Kalender:', hasEmployeeCalendar ? '✅ VORHANDEN' : '❌ NICHT VORHANDEN')
    console.log('\n=> Kalender wird angezeigt:', (hasWorkshopCalendar || hasEmployeeCalendar) ? '✅ JA' : '❌ NEIN')
  })
  .catch(err => console.error('Fehler:', err.message))
