const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkCustomerRecords() {
  try {
    console.log('\n🔍 Prüfe Customer Records Problem...\n')

    // Check if Customer record exists for the user
    const userId = 'cml3jmzte000jdlybqcf4lv2t' // antonmichl85@gmail.com
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    })

    console.log('👤 User:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.firstName} ${user.lastName}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Created: ${user.createdAt}`)
    console.log('')

    // Check if Customer record exists
    const customer = await prisma.customer.findUnique({
      where: { userId: userId }
    })

    if (customer) {
      console.log('✅ Customer Record EXISTS:')
      console.log(`   Customer ID: ${customer.id}`)
      console.log(`   User ID: ${customer.userId}`)
      console.log(`   Created: ${customer.createdAt}`)
      console.log('')
      console.log('ℹ️  Das ist gut! Reserve API sollte funktionieren.')
    } else {
      console.log('❌ Customer Record FEHLT!')
      console.log('')
      console.log('⚠️  DAS IST DAS PROBLEM!')
      console.log('   Reserve API macht: const customer = await prisma.customer.findUnique({ where: { userId } })')
      console.log('   customer ist NULL, aber customer.id wird trotzdem verwendet')
      console.log('   Resultat: Falsche customerId in DirectBooking')
      console.log('')
      console.log('LÖSUNG: Customer Record erstellen ODER User.id direkt verwenden')
    }

    // Check all users without customer records
    const allUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      select: { id: true, email: true }
    })

    const usersWithoutCustomer = []
    for (const u of allUsers) {
      const c = await prisma.customer.findUnique({ where: { userId: u.id } })
      if (!c) {
        usersWithoutCustomer.push(u)
      }
    }

    console.log('')
    console.log(`📊 Statistik:`)
    console.log(`   Gesamt CUSTOMER Users: ${allUsers.length}`)
    console.log(`   Ohne Customer Record: ${usersWithoutCustomer.length}`)
    console.log('')

    if (usersWithoutCustomer.length > 0) {
      console.log('⚠️  Folgende User haben kein Customer Record:')
      usersWithoutCustomer.forEach(u => {
        console.log(`   - ${u.email} (${u.id})`)
      })
      console.log('')
      console.log('💡 EMPFEHLUNG:')
      console.log('   1. Customer Records für bestehende User erstellen')
      console.log('   2. Registration so anpassen dass Customer Record automatisch erstellt wird')
      console.log('   3. Reserve API robuster machen (Fehlerbehandlung)')
    }

  } catch (error) {
    console.error('❌ Fehler:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCustomerRecords()
