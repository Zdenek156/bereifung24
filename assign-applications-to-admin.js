/**
 * Assign applications Application to Admin User
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get admin user (your account)
  const admin = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    },
    include: {
      B24Employee: true
    }
  })

  if (!admin) {
    console.log('❌ No admin user found')
    return
  }

  console.log('Admin user:', admin.email)

  if (!admin.B24Employee) {
    console.log('❌ Admin has no B24Employee record')
    return
  }

  // Assign applications application
  const assignment = await prisma.b24EmployeeApplication.upsert({
    where: {
      employeeId_applicationKey: {
        employeeId: admin.B24Employee.id,
        applicationKey: 'applications'
      }
    },
    update: {},
    create: {
      employeeId: admin.B24Employee.id,
      applicationKey: 'applications'
    }
  })

  console.log('✅ Application assigned:', assignment)

  // Show all assigned applications
  const allApps = await prisma.b24EmployeeApplication.findMany({
    where: { employeeId: admin.B24Employee.id },
    include: { application: true }
  })

  console.log('\nAll assigned applications:')
  allApps.forEach(a => {
    console.log(`  - ${a.application.name} (${a.application.key})`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
