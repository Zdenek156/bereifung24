const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLogoUrl() {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: 'cml3g7rxd000ckeyn9ypqgg65' },
      select: { 
        logoUrl: true, 
        companyName: true 
      }
    })
    console.log(JSON.stringify(workshop, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkLogoUrl()
