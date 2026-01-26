const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addBlogApplication() {
  try {
    // Check if blog application already exists
    const existing = await prisma.application.findUnique({
      where: { key: 'blog' }
    })

    if (existing) {
      console.log('✅ Blog application already exists')
      return
    }

    // Create blog application
    const blogApp = await prisma.application.create({
      data: {
        key: 'blog',
        name: 'Blog & Content',
        description: 'SEO-optimiertes Blog-System für Bereifung24',
        icon: '📝',
        category: 'CONTENT',
        color: '#10B981',
        order: 13,
        enabled: true
      }
    })

    console.log('✅ Blog application created:', blogApp.id)

    // Grant access to all employees
    const employees = await prisma.employee.findMany({
      where: {
        terminatedAt: null
      }
    })

    for (const employee of employees) {
      const existingAccess = await prisma.employeeApplication.findUnique({
        where: {
          employeeId_applicationId: {
            employeeId: employee.id,
            applicationId: blogApp.id
          }
        }
      })

      if (!existingAccess) {
        await prisma.employeeApplication.create({
          data: {
            employeeId: employee.id,
            applicationId: blogApp.id
          }
        })
        console.log(`✅ Granted blog access to: ${employee.firstName} ${employee.lastName}`)
      }
    }

    console.log('✅ Blog application setup complete!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addBlogApplication()
