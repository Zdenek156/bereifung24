const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkLuxus24() {
  try {
    const workshop = await prisma.workshop.findUnique({
      where: { id: 'cml3g7rxd000ckeyn9ypqgg65' },
      select: {
        companyName: true,
        taxMode: true,
        userId: true
      }
    })
    
    console.log('Luxus24 Workshop Data:')
    console.log(JSON.stringify(workshop, null, 2))
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error:', error)
    await prisma.$disconnect()
    process.exit(1)
  }
}

checkLuxus24()
