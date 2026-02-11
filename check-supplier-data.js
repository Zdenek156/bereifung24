const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkData() {
  try {
    const suppliers = await prisma.workshopSupplier.findMany({
      where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' }
    })
    console.log('Found suppliers:', suppliers.length)
    console.log(JSON.stringify(suppliers, null, 2))
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
