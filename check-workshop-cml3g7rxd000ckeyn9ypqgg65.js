const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkshop() {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: 'cml3g7rxd000ckeyn9ypqgg65' },
      include: {
        companySettings: true,
        _count: {
          select: {
            reviews: true
          }
        }
      }
    })
    
    console.log('Workshop found:', JSON.stringify(workshop, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkshop()
