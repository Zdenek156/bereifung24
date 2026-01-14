const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkSalesApp() {
  try {
    const app = await prisma.application.findUnique({
      where: { id: 10 }
    })
    console.log('Sales CRM Application:')
    console.log(JSON.stringify(app, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSalesApp()
