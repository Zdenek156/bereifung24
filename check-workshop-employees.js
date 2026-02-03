const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshop() {
  const workshopId = 'cml3g7rxd000ckeyn9ypqgg65'
  
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    include: {
      employees: {
        include: {
          employeeVacations: true
        }
      }
    }
  })
  
  if (!workshop) {
    console.log('❌ Werkstatt nicht gefunden!')
    return
  }
  
  console.log('\n🏢 WERKSTATT:')
  console.log(`Name: ${workshop.name || 'NICHT GESETZT'}`)
  console.log(`ID: ${workshop.id}`)
  console.log(`User ID: ${workshop.userId}`)
  console.log(`Anzahl Mitarbeiter: ${workshop.employees.length}`)
  
  if (workshop.employees.length === 0) {
    console.log('\n❌ PROBLEM: Werkstatt hat KEINE Mitarbeiter!')
    console.log('   → Lösung: Mitarbeiter im Dashboard erstellen')
  } else {
    console.log('\n👥 MITARBEITER:')
    workshop.employees.forEach((emp, i) => {
      console.log(`\n${i + 1}. ${emp.name || emp.email}`)
      console.log(`   Email: ${emp.email}`)
      console.log(`   Status: ${emp.status}`)
      console.log(`   Google Calendar ID: ${emp.googleCalendarId || 'NICHT VERBUNDEN'}`)
      console.log(`   Working Hours: ${emp.workingHours ? '✅ GESETZT' : '❌ NICHT GESETZT'}`)
      
      if (emp.workingHours) {
        try {
          const hours = typeof emp.workingHours === 'string' 
            ? JSON.parse(emp.workingHours) 
            : emp.workingHours
          console.log('   Arbeitszeiten:')
          Object.entries(hours).forEach(([day, data]) => {
            if (data.working) {
              console.log(`     ${day}: ${data.from} - ${data.to}`)
            }
          })
        } catch (e) {
          console.log('   ⚠️  Working Hours Format ungültig!')
        }
      }
      
      if (emp.employeeVacations.length > 0) {
        console.log(`   Urlaub: ${emp.employeeVacations.length} Einträge`)
      }
    })
  }
  
  await prisma.$disconnect()
}

checkWorkshop().catch(console.error)
