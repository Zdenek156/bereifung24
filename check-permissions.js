const { PrismaClient } = require('@prisma/client')

async function checkPermissions() {
  const prisma = new PrismaClient()
  
  try {
    const employees = await prisma.b24Employee.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        position: true,
        applications: {
          where: { applicationKey: 'roadmap' },
          select: {
            canEditTasks: true,
            canCreateTasks: true
          }
        }
      }
    })
    
    console.log('='.repeat(60))
    console.log('MITARBEITER BERECHTIGUNGEN')
    console.log('='.repeat(60))
    
    employees.forEach(emp => {
      console.log(`\n👤 ${emp.firstName} ${emp.lastName}`)
      console.log(`   Email: ${emp.email}`)
      console.log(`   Position: ${emp.position || 'Keine'}`)
      console.log(`   CEO: ${emp.position === 'Geschäftsführer' ? 'JA ✅' : 'Nein'}`)
      
      const app = emp.applications[0]
      if (app) {
        console.log(`   Roadmap Zugriff: JA`)
        console.log(`   - Tasks erstellen: ${app.canCreateTasks ? 'JA ✅' : 'Nein'}`)
        console.log(`   - Tasks bearbeiten: ${app.canEditTasks ? 'JA ✅' : 'Nein'}`)
      } else {
        console.log(`   Roadmap Zugriff: NEIN ❌`)
      }
    })
    
    console.log('\n' + '='.repeat(60))
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPermissions()
