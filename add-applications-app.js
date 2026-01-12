/**
 * Add 'applications' Application to Database
 * Run: node add-applications-app.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Adding "applications" Application...')

  const app = await prisma.application.upsert({
    where: { key: 'applications' },
    update: {
      name: 'Anwendungsverwaltung',
      description: 'Zuweisen von Anwendungen zu Mitarbeitern',
      icon: 'Grid',
      adminRoute: '/admin/applications',
      color: 'purple',
      category: 'HR',
      sortOrder: 31
    },
    create: {
      key: 'applications',
      name: 'Anwendungsverwaltung',
      description: 'Zuweisen von Anwendungen zu Mitarbeitern',
      icon: 'Grid',
      adminRoute: '/admin/applications',
      color: 'purple',
      category: 'HR',
      sortOrder: 31
    }
  })

  console.log('✅ Application created:', app)

  // Update recruitment and payroll sortOrder
  await prisma.application.updateMany({
    where: { key: 'recruitment' },
    data: { sortOrder: 32 }
  })

  await prisma.application.updateMany({
    where: { key: 'payroll' },
    data: { sortOrder: 33 }
  })

  console.log('✅ Sort orders updated')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
