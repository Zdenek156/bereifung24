const { PrismaClient } = require('@prisma/client')

async function fixPermissions() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Aktualisiere Berechtigungen...\n')
    
    // 1. CEO (Zdenek) bekommt alle Rechte
    const ceo = await prisma.b24Employee.findUnique({
      where: { email: 'zdenek.kyzlink@bereifung24.de' },
      select: { id: true, position: true }
    })
    
    if (ceo) {
      // Update Position to Geschäftsführer
      await prisma.b24Employee.update({
        where: { id: ceo.id },
        data: { position: 'Geschäftsführer' }
      })
      console.log('✅ Zdenek Position auf "Geschäftsführer" gesetzt')
      
      // Update Roadmap App Permissions
      await prisma.b24EmployeeApplication.updateMany({
        where: {
          employeeId: ceo.id,
          applicationKey: 'roadmap'
        },
        data: {
          canEditTasks: true,
          canCreateTasks: true
        }
      })
      console.log('✅ Zdenek Roadmap Berechtigungen aktiviert (canEditTasks + canCreateTasks)\n')
    }
    
    // 2. Alle anderen Mitarbeiter können ihre eigenen Tasks bearbeiten
    // (das ist bereits in der API implementiert mit isOwnTask)
    
    // 3. Zeige finale Berechtigungen
    const final = await prisma.b24Employee.findMany({
      where: {
        applications: {
          some: { applicationKey: 'roadmap' }
        }
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
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
    
    console.log('📊 FINALE BERECHTIGUNGEN:')
    console.log('='.repeat(60))
    
    final.forEach(emp => {
      const app = emp.applications[0]
      const isCEO = emp.position === 'Geschäftsführer'
      console.log(`${emp.firstName} ${emp.lastName}:`)
      console.log(`  Position: ${emp.position || 'Keine'}`)
      console.log(`  CEO: ${isCEO ? 'JA ✅' : 'Nein'}`)
      console.log(`  Eigene Tasks bearbeiten: JA ✅ (immer)`)
      console.log(`  Fremde Tasks bearbeiten: ${app?.canEditTasks || isCEO ? 'JA ✅' : 'Nein'}`)
      console.log(`  Tasks erstellen: ${app?.canCreateTasks || isCEO ? 'JA ✅' : 'Nein'}`)
      console.log()
    })
    
    console.log('='.repeat(60))
    console.log('✅ Berechtigungen erfolgreich aktualisiert!')
    
  } catch (error) {
    console.error('💥 Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPermissions()
