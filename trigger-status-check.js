const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function triggerStatusCheck() {
  try {
    console.log('🔍 Trigger Stripe Account Status Check...\n')
    
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Luxus24' },
      include: { user: true }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }

    if (!workshop.stripeAccountId) {
      console.log('❌ Keine Stripe Account ID vorhanden')
      return
    }

    console.log('✅ Werkstatt:', workshop.companyName)
    console.log('📧 Email:', workshop.user.email)
    console.log('🆔 Stripe Account ID:', workshop.stripeAccountId)
    console.log('📊 Current Status:', workshop.stripeEnabled ? 'Enabled ✅' : 'Disabled ❌')

    console.log('\n💡 Rufe Account-Status-API auf...')
    console.log('👉 URL: https://bereifung24.de/api/workshop/stripe-connect/account-status')
    console.log('\n📝 Bitte öffnen Sie diese URL im Browser (eingeloggt als Werkstatt) oder:')
    console.log('\n1. Gehen Sie zu: https://bereifung24.de/dashboard/workshop/settings')
    console.log('2. Scrollen Sie zu "Zahlungsmethoden"')
    console.log('3. Klicken Sie auf "Status prüfen" beim Stripe-Account')
    console.log('\nOder führen Sie aus:')
    console.log('curl -X GET https://bereifung24.de/api/workshop/stripe-connect/account-status \\')
    console.log(`  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"`)

  } catch (error) {
    console.error('\n❌ Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

triggerStatusCheck()
