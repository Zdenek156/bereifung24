const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function revertFix() {
  try {
    console.log('\n🔧 REVERT: Stelle korrekte Customer IDs wieder her...\n')

    const wrongUserId = 'cml3jmzte000jdlybqcf4lv2t' // Wir haben fälschlicherweise User.id verwendet
    const correctCustomerId = 'cml3jmzte000kdlybn0aqsi6i' // Korrekte Customer.id

    // Find all bookings we wrongly "fixed"
    const bookings = await prisma.directBooking.findMany({
      where: { customerId: wrongUserId },
      select: { id: true, createdAt: true, status: true, paymentStatus: true }
    })

    console.log(`❌ Fand ${bookings.length} Buchungen mit falscher User.id als customerId:`)
    bookings.forEach(b => {
      console.log(`   - ${b.id}: ${b.status}/${b.paymentStatus}, created ${b.createdAt}`)
    })

    if (bookings.length === 0) {
      console.log('\n✅ Keine Buchungen zu korrigieren!')
      return
    }

    console.log(`\n🔧 Setze customerId zurück auf korrekte Customer.id: ${correctCustomerId}`)

    const result = await prisma.directBooking.updateMany({
      where: { customerId: wrongUserId },
      data: { customerId: correctCustomerId }
    })

    console.log(`\n✅ ${result.count} Buchungen korrigiert!`)

    // Verification
    const wrongCount = await prisma.directBooking.count({
      where: { customerId: wrongUserId }
    })

    const correctCount = await prisma.directBooking.count({
      where: { customerId: correctCustomerId }
    })

    console.log(`\n📊 Verification:`)
    console.log(`   - Falsche User.id (${wrongUserId}): ${wrongCount} bookings`)
    console.log(`   - Korrekte Customer.id (${correctCustomerId}): ${correctCount} bookings`)

    if (wrongCount === 0) {
      console.log(`\n✅ Alles korrekt! Alle Buchungen haben jetzt die richtige Customer.id`)
    }

  } catch (error) {
    console.error('❌ Fehler:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

revertFix()
