const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPaymentMethod() {
  try {
    const booking = await prisma.directBooking.findUnique({
      where: { id: 'cmlwcoxl0000r5mqgxndeirqv' },
      select: {
        paymentMethodDetail: true,
        stripeFee: true,
        totalPrice: true,
        stripePaymentId: true
      }
    })

    console.log('\n📊 Booking Payment Details:')
    console.log('  Payment Method:', booking.paymentMethodDetail)
    console.log('  Stripe Payment ID:', booking.stripePaymentId)
    console.log('  Total:', booking.totalPrice, '€')
    console.log('  Stripe Fee:', booking.stripeFee, '€')
    console.log('  Fee Percentage:', (Number(booking.stripeFee) / Number(booking.totalPrice) * 100).toFixed(2), '%')

  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkPaymentMethod()
