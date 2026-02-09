const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetStripeAccount() {
  try {
    console.log('🔍 Suche Werkstatt Luxus24...')
    
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

    console.log('\n✅ Werkstatt gefunden:')
    console.log('ID:', workshop.id)
    console.log('Company Name:', workshop.companyName)
    console.log('Email:', workshop.user.email)
    console.log('Current Stripe Account ID:', workshop.stripeAccountId || 'Keiner')

    if (!workshop.stripeAccountId) {
      console.log('\n✅ Kein Stripe Account vorhanden - Sie können direkt verbinden!')
      return
    }

    console.log('\n🗑️ Lösche Stripe Account Referenz aus Datenbank...')
    
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        stripeAccountId: null,
        stripeEnabled: false
      }
    })

    console.log('✅ Stripe Account Referenz gelöscht!')
    console.log('\n📝 Nächste Schritte:')
    console.log('1. Gehen Sie zu: Dashboard → Einstellungen → Zahlungsmethoden')
    console.log('2. Klicken Sie auf "Mit Stripe verbinden"')
    console.log('3. Im Onboarding wird jetzt "Luxus24" angezeigt')
    console.log('\n⚠️ WICHTIG: Der alte Stripe Account existiert noch bei Stripe.')
    console.log('   Kontaktieren Sie den Stripe Support, um ihn zu löschen, wenn gewünscht.')

  } catch (error) {
    console.error('❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetStripeAccount()
