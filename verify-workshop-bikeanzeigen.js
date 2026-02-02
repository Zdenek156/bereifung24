const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verifyWorkshop() {
  try {
    console.log('🔧 Verifiziere Werkstatt: bikeanzeigen@gmail.com')
    console.log('='.repeat(60))
    
    const workshop = await prisma.workshop.findFirst({
      where: {
        user: {
          email: 'bikeanzeigen@gmail.com'
        }
      }
    })
    
    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }
    
    console.log(`\n📋 Aktueller Status:`)
    console.log(`   isVerified: ${workshop.isVerified}`)
    
    // Update to verified
    const updated = await prisma.workshop.update({
      where: { id: workshop.id },
      data: { isVerified: true }
    })
    
    console.log(`\n✅ Werkstatt wurde verifiziert!`)
    console.log(`   isVerified: ${updated.isVerified}`)
    console.log(`\n🎉 Die Werkstatt kann jetzt E-Mails für neue Anfragen erhalten!`)
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

verifyWorkshop()
