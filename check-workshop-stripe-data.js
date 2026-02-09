const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshopData() {
  try {
    // Find workshop "Müller"
    const workshop = await prisma.workshop.findFirst({
      where: {
        OR: [
          { companyName: { contains: 'Müller' } },
          { user: { name: { contains: 'Müller' } } }
        ]
      },
      include: {
        user: true
      }
    })

    if (!workshop) {
      console.log('❌ Werkstatt Müller nicht gefunden')
      return
    }

    console.log('✅ Werkstatt gefunden:', workshop.id)
    console.log('\n📋 Daten für Stripe Connect:')
    console.log('----------------------------')
    console.log('Email:', workshop.user.email)
    console.log('Name:', workshop.user.name)
    console.log('Company Name:', workshop.companyName)
    console.log('Phone:', workshop.phone || '❌ FEHLT')
    console.log('Address:', workshop.address || '❌ FEHLT')
    console.log('City:', workshop.city || '❌ FEHLT')
    console.log('Zip Code:', workshop.zipCode || '❌ FEHLT')
    console.log('\n🔑 Stripe Account ID:', workshop.stripeAccountId || 'Noch nicht erstellt')
    
    // Check if name can be split
    if (workshop.user.name) {
      const nameParts = workshop.user.name.trim().split(' ')
      console.log('\n👤 Name Splitting:')
      console.log('First Name:', nameParts[0])
      console.log('Last Name:', nameParts.slice(1).join(' ') || '❌ FEHLT')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshopData()
