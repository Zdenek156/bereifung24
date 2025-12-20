// Quick test to check appointments API
async function testAPI() {
  try {
    console.log('Testing appointments API...\n')
    
    // Assuming you're logged in on localhost:3000
    const response = await fetch('http://localhost:3000/api/workshop/appointments', {
      headers: {
        'Cookie': process.argv[2] || '' // Pass cookie as argument if needed
      }
    })
    
    if (!response.ok) {
      console.log(`Status: ${response.status}`)
      const text = await response.text()
      console.log('Response:', text)
      return
    }
    
    const data = await response.json()
    console.log(`Total appointments: ${data.length}\n`)
    
    const now = new Date()
    const byStatus = {}
    
    data.forEach(apt => {
      const status = apt.status
      if (!byStatus[status]) byStatus[status] = []
      byStatus[status].push(apt)
      
      const date = new Date(apt.appointmentDate)
      const isPast = date < now
      console.log(`${apt.id.substring(0, 8)} | ${status} | ${date.toLocaleDateString('de-DE')} ${isPast ? '(PAST)' : '(FUTURE)'}`)
    })
    
    console.log('\n=== Summary ===')
    console.log(`Total: ${data.length}`)
    const upcoming = data.filter(a => a.status === 'CONFIRMED' && new Date(a.appointmentDate) >= now)
    console.log(`Anstehend (CONFIRMED + future): ${upcoming.length}`)
    console.log(`Abgeschlossen (COMPLETED): ${data.filter(a => a.status === 'COMPLETED').length}`)
    console.log(`Storniert (CANCELLED): ${data.filter(a => a.status === 'CANCELLED').length}`)
    
  } catch (error) {
    console.error('Error:', error.message)
  }
}

testAPI()
