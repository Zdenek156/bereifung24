const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function deleteSuppliers() {
  try {
    const result = await prisma.workshopSupplier.deleteMany({
      where: {
        workshopId: 'cml3g7rxd000ckeyn9ypqgg65'
      }
    })
    console.log('✅ Deleted', result.count, 'supplier entries')
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

deleteSuppliers()
