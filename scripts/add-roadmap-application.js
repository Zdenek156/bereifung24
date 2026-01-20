const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Add Roadmap Application to Database
 * Run: node scripts/add-roadmap-application.js
 */

async function main() {
  console.log('🗺️  Adding Roadmap Application...')

  // Check if application already exists
  const existing = await prisma.application.findUnique({
    where: { key: 'roadmap' }
  })

  if (existing) {
    console.log('⚠️  Roadmap application already exists')
    process.exit(0)
  }

  // Find the max sortOrder to add it at the end
  const maxApp = await prisma.application.findFirst({
    orderBy: { sortOrder: 'desc' }
  })
  const nextSortOrder = (maxApp?.sortOrder || 0) + 1

  // Create the application
  const app = await prisma.application.create({
    data: {
      key: 'roadmap',
      name: 'Roadmap',
      description: 'Unternehmensplanung und Meilensteine für 2026',
      icon: 'Map',
      adminRoute: '/admin/roadmap',
      color: 'purple',
      sortOrder: nextSortOrder,
      category: 'Planung'
    }
  })

  console.log('✅ Roadmap application created:', app)

  // Assign to all active employees
  const employees = await prisma.b24Employee.findMany({
    where: {
      isActive: true
    }
  })

  console.log(`📋 Found ${employees.length} active employees`)

  for (const employee of employees) {
    await prisma.b24EmployeeApplication.create({
      data: {
        employeeId: employee.id,
        applicationKey: app.key,
        assignedBy: 'system'
      }
    })
    console.log(`✅ Assigned to ${employee.firstName} ${employee.lastName}`)
  }

  console.log('🎉 Done!')
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
