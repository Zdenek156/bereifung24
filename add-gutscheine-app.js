// Insert Application record for Gutschein-Verwaltung
const { PrismaClient } = require('@prisma/client')

async function run() {
  const prisma = new PrismaClient()
  
  try {
    const result = await prisma.application.upsert({
      where: { key: 'gutscheine' },
      update: {},
      create: {
        id: 'cm_gutscheine_app_001',
        key: 'gutscheine',
        name: 'Gutschein-Verwaltung',
        description: 'Gutscheincodes erstellen, verwalten und Nutzung nachverfolgen',
        icon: 'Gift',
        adminRoute: '/admin/gutscheine',
        color: 'green',
        sortOrder: 55,
        isActive: true,
        category: 'SALES'
      }
    })
    console.log('Application record inserted:', result.key)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

run()
