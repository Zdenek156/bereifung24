const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPaymentProvider() {
  try {
    const booking = await prisma.directBooking.findUnique({
      where: { id: 'cmlgw7h2e000583ubctfsugmi' },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        paypalOrderId: true,
        stripeSessionId: true,
        stripePaymentId: true,
        paymentId: true,
        createdAt: true
      }
    })

    console.log('\n📊 Buchungsdetails (PAID):')
    console.log('ID:', booking.id)
    console.log('Status:', booking.status)
    console.log('Payment Status:', booking.paymentStatus)
    console.log('Payment Method:', booking.paymentMethod || 'NICHT GESETZT')
    console.log('PayPal Order ID:', booking.paypalOrderId || 'KEINE')
    console.log('Stripe Session ID:', booking.stripeSessionId || 'KEINE')
    console.log('Stripe Payment ID:', booking.stripePaymentId || 'KEINE')
    console.log('Payment ID:', booking.paymentId || 'KEINE')
    console.log('Created:', booking.createdAt)

    if (booking.paypalOrderId) {
      console.log('\n✅ Zahlung erfolgte über PayPal')
    } else if (booking.stripeSessionId || booking.stripePaymentId) {
      console.log('\n✅ Zahlung erfolgte über Stripe')
    } else {
      console.log('\n⚠️ Kein Payment-Provider identifizierbar')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkPaymentProvider()
