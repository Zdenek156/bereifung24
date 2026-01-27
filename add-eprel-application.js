const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function addEPRELApplication() {
  try {
    console.log('🔧 Creating EPREL Application entry...')

    // Check if application already exists
    const existing = await prisma.application.findUnique({
      where: { key: 'eprel' }
    })

    if (existing) {
      console.log('✅ EPREL Application already exists')
      await prisma.$disconnect()
      return
    }

    // Create EPREL application
    const eprelApp = await prisma.application.create({
      data: {
        key: 'eprel',
        name: 'EPREL Reifendaten',
        description: 'EU-Reifenlabel Datenbank mit wöchentlichen Updates',
        icon: 'Database',
        adminRoute: '/admin/eprel',
        color: 'cyan',
        category: 'SYSTEM',
        sortOrder: 1000,
        isActive: true
      }
    })

    console.log('✅ Created EPREL Application:', eprelApp.id)

    // Assign to all admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    })

    for (const admin of admins) {
      const employee = await prisma.b24Employee.findUnique({
        where: { userId: admin.id }
      })

      if (employee) {
        await prisma.b24EmployeeApplication.create({
          data: {
            employeeId: employee.id,
            applicationId: eprelApp.id
          }
        })
        console.log(`✅ Assigned EPREL to admin: ${admin.email}`)
      }
    }

    console.log('✅ EPREL Application setup complete!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addEPRELApplication()
