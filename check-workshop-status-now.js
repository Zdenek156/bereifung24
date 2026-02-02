const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkStatus() {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { email: 'bikeanzeigen@gmail.com' },
      select: {
        id: true,
        companyName: true,
        email: true,
        isVerified: true,
        emailNotifyRequests: true,
        coordinates: true,
        services: {
          select: {
            serviceType: true,
            isActive: true
          }
        }
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden!')
      return
    }

    console.log('\n📊 AKTUELLER WERKSTATT-STATUS:')
    console.log('=====================================')
    console.log(`Name: ${workshop.companyName}`)
    console.log(`E-Mail: ${workshop.email}`)
    console.log(`ID: ${workshop.id}`)
    console.log('')
    console.log('🔑 WICHTIGE FELDER:')
    console.log(`  isVerified: ${workshop.isVerified ? '✅ true (kann E-Mails empfangen)' : '❌ false (BLOCKIERT E-Mails!)'}`)
    console.log(`  emailNotifyRequests: ${workshop.emailNotifyRequests ? '✅ true' : '❌ false'}`)
    console.log(`  coordinates: ${workshop.coordinates ? '✅ vorhanden' : '❌ fehlen'}`)
    console.log('')
    console.log('⚙️ AKTIVE SERVICES:')
    
    const tireChangeService = workshop.services.find(s => s.serviceType === 'TIRE_CHANGE')
    if (tireChangeService) {
      console.log(`  TIRE_CHANGE: ${tireChangeService.isActive ? '✅ aktiv' : '❌ inaktiv'}`)
    } else {
      console.log('  TIRE_CHANGE: ❌ nicht vorhanden')
    }
    
    console.log('')
    console.log('📝 ZUSAMMENFASSUNG:')
    
    const canReceiveEmails = 
      workshop.isVerified && 
      workshop.emailNotifyRequests && 
      workshop.coordinates &&
      tireChangeService?.isActive

    if (canReceiveEmails) {
      console.log('✅ Werkstatt kann E-Mails für Anfragen empfangen!')
    } else {
      console.log('❌ Werkstatt kann KEINE E-Mails empfangen!')
      console.log('   Gründe:')
      if (!workshop.isVerified) console.log('   - isVerified ist false ⚠️')
      if (!workshop.emailNotifyRequests) console.log('   - emailNotifyRequests ist false')
      if (!workshop.coordinates) console.log('   - Koordinaten fehlen')
      if (!tireChangeService?.isActive) console.log('   - TIRE_CHANGE Service nicht aktiv')
    }
    console.log('')

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkStatus()
