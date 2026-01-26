const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

/**
 * Add Blog Application to Database
 * Run: node scripts/add-blog-application.js
 */

async function main() {
  console.log('📝 Adding Blog Application...')

  // Check if application already exists
  const existing = await prisma.application.findUnique({
    where: { key: 'blog' }
  })

  if (existing) {
    console.log('⚠️  Blog application already exists')
    console.log('Updating existing application...')
    
    const updated = await prisma.application.update({
      where: { key: 'blog' },
      data: {
        name: 'Blog & Content',
        description: 'SEO-Blog System für Kunden- und Werkstatt-Content',
        icon: 'FileText',
        adminRoute: '/admin/blog',
        color: 'cyan',
        category: 'Marketing'
      }
    })
    
    console.log('✅ Blog application updated:', updated)
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
      key: 'blog',
      name: 'Blog & Content',
      description: 'SEO-Blog System für Kunden- und Werkstatt-Content',
      icon: 'FileText',
      adminRoute: '/admin/blog',
      color: 'cyan',
      sortOrder: nextSortOrder,
      category: 'Marketing'
    }
  })

  console.log('✅ Blog application created:', app)

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
