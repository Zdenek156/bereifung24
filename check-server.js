const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  const lp = await prisma.workshopLandingPage.findUnique({ 
    where: { slug: 'test' } 
  })
  console.log('Hero Image:', lp ? lp.heroImage : 'Not found')
  console.log('Show Logo:', lp ? lp.showLogo : 'Not found')
  await prisma.$disconnect()
}

check().catch(console.error)
