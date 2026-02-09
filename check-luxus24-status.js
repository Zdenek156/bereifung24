const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshopStatus() {
  try {
    console.log('🔍 Prüfe Werkstatt Luxus24...\n')
    
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: 'Luxus24'
      },
      include: {
        user: true
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt Luxus24 nicht gefunden')
      return
    }

    console.log('✅ Werkstatt gefunden:')
    console.log('===================================')
    console.log('ID:', workshop.id)
    console.log('Company Name:', workshop.companyName)
    console.log('Email:', workshop.user.email)
    console.log('User Name:', workshop.user.name)
    console.log('\n💳 Stripe Status:')
    console.log('===================================')
    console.log('Account ID:', workshop.stripeAccountId || '❌ KEINE')
    console.log('Stripe Enabled:', workshop.stripeEnabled ? '✅ Ja' : '❌ Nein')
    
    if (workshop.stripeAccountId) {
      console.log('\n⚠️ WARNUNG: Stripe Account ID ist noch vorhanden!')
      console.log('Diese ID sollte NULL sein nach dem Reset.')
      console.log('\nMögliche Ursachen:')
      console.log('1. User hat sich nach dem Reset wieder mit Stripe verbunden')
      console.log('2. Das Reset-Script wurde nicht auf dem Server ausgeführt')
      console.log('3. Es gibt mehrere Workshops mit "Luxus24"')
    } else {
      console.log('\n✅ Perfekt! Keine Stripe Account ID vorhanden.')
      console.log('User kann sich jetzt neu mit Stripe verbinden.')
    }

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshopStatus()
