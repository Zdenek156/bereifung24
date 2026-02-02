const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const workshop = await prisma.workshop.findFirst({
    where: {
      companyName: 'Luxus24'
    },
    select: {
      id: true,
      companyName: true,
      openingHours: true
    }
  })
  
  if (!workshop) {
    console.log('❌ Luxus24 not found!')
    return
  }
  
  console.log('=== LUXUS24 ÖFFNUNGSZEITEN ===\n')
  console.log('Company:', workshop.companyName)
  
  if (workshop.openingHours) {
    console.log('\nRaw opening hours:', workshop.openingHours)
    
    try {
      const hours = JSON.parse(workshop.openingHours)
      console.log('\nParsed opening hours:')
      console.log(JSON.stringify(hours, null, 2))
      
      console.log('\n--- Tage ---')
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      days.forEach(day => {
        const dayHours = hours[day]
        if (dayHours) {
          console.log(`${day}:`, dayHours.working ? `OFFEN ${dayHours.start} - ${dayHours.end}` : 'GESCHLOSSEN')
        } else {
          console.log(`${day}: NICHT DEFINIERT`)
        }
      })
    } catch (e) {
      console.log('\n❌ ERROR parsing opening hours:', e.message)
    }
  } else {
    console.log('\n❌ KEINE Öffnungszeiten konfiguriert!')
  }
  
  console.log('\n================================')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
