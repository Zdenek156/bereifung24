const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const pendingBookingIds = [
  'cmlghre0l00068niqcl5u8zmc',
  'cmlghri9200098niqrzuu29in',
  'cmlghrmmu000c8niq3atpl56y',
  'cmlghrtl1000f8niqi89dgiwi',
  'cmlghs06e000i8niq83upovw2',
  'cmlghs3qt000k8niq8iibv4vc'
]

async function analyzePendingBookings() {
  try {
    console.log('\n🔍 Analysiere PENDING Buchungen vom 10. Feb 11:02 Uhr...\n')

    for (const id of pendingBookingIds) {
      const booking = await prisma.directBooking.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          stripeSessionId: true,
          stripePaymentId: true,
          paymentId: true,
          paypalOrderId: true,
          reservedUntil: true,
          createdAt: true,
          updatedAt: true
        }
      })

      if (!booking) {
        console.log(`❌ Buchung ${id} nicht gefunden\n`)
        continue
      }

      console.log(`📋 Buchung: ${booking.id.substring(0, 12)}...`)
      console.log(`   Status: ${booking.status}`)
      console.log(`   Payment Status: ${booking.paymentStatus}`)
      console.log(`   Payment Method: ${booking.paymentMethod || 'NICHT GESETZT'}`)
      console.log(`   Stripe Session: ${booking.stripeSessionId || 'KEINE'}`)
      console.log(`   Stripe Payment: ${booking.stripePaymentId || 'KEINE'}`)
      console.log(`   PayPal Order: ${booking.paypalOrderId || 'KEINE'}`)
      console.log(`   Payment ID: ${booking.paymentId || 'KEINE'}`)
      console.log(`   Reserved Until: ${booking.reservedUntil || 'KEINE'}`)
      console.log(`   Created: ${booking.createdAt}`)
      console.log(`   Updated: ${booking.updatedAt}`)

      // Analyze what happened
      if (booking.stripeSessionId) {
        console.log(`   ⚠️  Stripe Session vorhanden - Webhook könnte nicht angekommen sein`)
      } else if (booking.paypalOrderId) {
        console.log(`   ⚠️  PayPal Order vorhanden - Confirm könnte fehlgeschlagen sein`)
      } else {
        console.log(`   ℹ️  Keine Payment-IDs - Zahlung wurde wahrscheinlich nicht gestartet`)
      }

      // Check if reservation expired
      if (booking.reservedUntil) {
        const now = new Date()
        const reserved = new Date(booking.reservedUntil)
        if (now > reserved) {
          const minutesAgo = Math.floor((now - reserved) / 1000 / 60)
          console.log(`   ⏰ Reservierung abgelaufen vor ${minutesAgo} Minuten`)
        }
      }

      console.log('')
    }

    // Summary
    const withStripe = (await Promise.all(
      pendingBookingIds.map(id => 
        prisma.directBooking.findUnique({ where: { id }, select: { stripeSessionId: true } })
      )
    )).filter(b => b?.stripeSessionId).length

    const withPayPal = (await Promise.all(
      pendingBookingIds.map(id => 
        prisma.directBooking.findUnique({ where: { id }, select: { paypalOrderId: true } })
      )
    )).filter(b => b?.paypalOrderId).length

    console.log('📊 Zusammenfassung:')
    console.log(`   Buchungen mit Stripe Session: ${withStripe}/6`)
    console.log(`   Buchungen mit PayPal Order: ${withPayPal}/6`)
    console.log(`   Ohne Payment-IDs: ${6 - withStripe - withPayPal}/6`)
    console.log('')

    if (withStripe > 0) {
      console.log('⚠️  VERMUTUNG: Stripe Sessions wurden erstellt, aber Webhooks kamen nicht an')
      console.log('   LÖSUNG: Webhook-Handler prüfen + Stripe Dashboard checken')
    } else if (withPayPal > 0) {
      console.log('⚠️  VERMUTUNG: PayPal Orders erstellt, aber Confirm fehlgeschlagen')
      console.log('   LÖSUNG: PayPal Confirm Route prüfen')
    } else {
      console.log('ℹ️  VERMUTUNG: Zahlungen wurden nie gestartet (Kunde hat abgebrochen vor Payment)')
      console.log('   STATUS: Normal - Reservierungen sind abgelaufen und auf CANCELLED gesetzt')
    }

  } catch (error) {
    console.error('❌ Fehler:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

analyzePendingBookings()
