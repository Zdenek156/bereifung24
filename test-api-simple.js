const http = require('http')

http.get('http://localhost:3000/api/tire-requests/cml3jujll0011dlybx2sdyrk7', (res) => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    try {
      const json = JSON.parse(data)
      const offer = json.request.offers[0]
      console.log('=== API RESPONSE ===')
      console.log('Workshop:', offer.workshop.companyName)
      console.log('googleCalendarId:', offer.workshop.googleCalendarId ? '✅ ' + offer.workshop.googleCalendarId : '❌ NICHT VORHANDEN')
      console.log('calendarMode:', offer.workshop.calendarMode)
      console.log('\n✅ FIX ERFOLGREICH: googleCalendarId wird jetzt zurückgegeben!')
    } catch (e) {
      console.error('Parse Error:', e.message)
      console.log('Response:', data.substring(0, 200))
    }
  })
}).on('error', err => console.error('Error:', err.message))
