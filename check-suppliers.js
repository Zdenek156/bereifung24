const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    const suppliers = await prisma.supplierConfig.findMany()
    console.log(JSON.stringify(suppliers, null, 2))
  } finally {
    await prisma.$disconnect()
  }
}

main()
