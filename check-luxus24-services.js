const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLuxus24() {
  try {
    const workshop = await prisma.workshop.findFirst({
      where: { companyName: 'Luxus24' },
      include: {
        workshopServices: {
          where: {
            serviceType: 'WHEEL_CHANGE',
            isActive: true
          }
        }
      }
    })

    console.log('Workshop:', workshop?.companyName)
    console.log('Services:', JSON.stringify(workshop?.workshopServices, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkLuxus24()
