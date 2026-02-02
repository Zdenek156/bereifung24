const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshop() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Luxus',
          mode: 'insensitive'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            street: true,
            city: true,
            zipCode: true
          }
        }
      }
    })

    console.log('Workshop Daten:')
    console.log(JSON.stringify(workshop, null, 2))
    
    if (!workshop) {
      console.log('❌ Keine Werkstatt gefunden')
    } else if (!workshop.user.street || !workshop.user.city || !workshop.user.zipCode) {
      console.log('⚠️ Adressdaten fehlen!')
      console.log('Street:', workshop.user.street)
      console.log('City:', workshop.user.city)
      console.log('ZipCode:', workshop.user.zipCode)
    } else {
      console.log('✅ Adressdaten vollständig')
    }
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshop()
