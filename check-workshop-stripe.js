const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkAndUpdateWorkshop() {
  try {
    // Finde die Luxus24 Werkstatt
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Luxus24'
        }
      },
      select: {
        id: true,
        companyName: true,
        stripeAccountId: true,
        stripeEnabled: true,
        user: {
          select: {
            email: true
          }
        }
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt nicht gefunden')
      return
    }

    console.log('🔍 Werkstatt gefunden:')
    console.log('  ID:', workshop.id)
    console.log('  Name:', workshop.companyName)
    console.log('  Stripe Account ID:', workshop.stripeAccountId)
    console.log('  Stripe Enabled:', workshop.stripeEnabled)
    console.log('  Email:', workshop.user?.email)

    if (!workshop.stripeEnabled) {
      console.log('\n📝 Aktiviere Stripe für diese Werkstatt...')
      
      const updated = await prisma.workshop.update({
        where: { id: workshop.id },
        data: { stripeEnabled: true }
      })
      
      console.log('✅ Stripe wurde aktiviert!')
      console.log('  stripeEnabled:', updated.stripeEnabled)
    } else {
      console.log('\n✅ Stripe ist bereits aktiviert')
    }

    console.log('\n🎉 Werkstatt ist bereit für Klarna-Zahlungen!')
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAndUpdateWorkshop()
