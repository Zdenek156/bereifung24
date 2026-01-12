/**
 * Assign applications Application to Admin User
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find B24Employee record for admin user
  const employee = await prisma.b24Employee.findFirst({
    where: {
      user: {
        role: 'ADMIN'
      }
    },
    include: {
      user: true
    }
  })

  if (!employee) {
    console.log('❌ No B24Employee found for admin user')
    console.log('Creating one now...')
    
    // Get admin user
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (!admin) {
      console.log('❌ No admin user found at all')
      return
    }
    
    // Create B24Employee record
    const newEmployee = await prisma.b24Employee.create({
      data: {
        userId: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone || '',
        position: 'Administrator',
        department: 'Management',
        employmentType: 'FULL_TIME',
        startDate: new Date(),
        isActive: true
      }
    })
    
    console.log('✅ B24Employee created:', newEmployee.email)
    
    // Assign applications application
    const assignment = await prisma.b24EmployeeApplication.upsert({
      where: {
        employeeId_applicationKey: {
          employeeId: newEmployee.id,
          applicationKey: 'applications'
        }
      },
      update: {},
      create: {
        employeeId: newEmployee.id,
        applicationKey: 'applications'
      }
    })
    
    console.log('✅ Application assigned:', assignment)
    return
  }

  console.log('Found employee:', employee.user.email)

  // Assign applications application
  const assignment = await prisma.b24EmployeeApplication.upsert({
    where: {
      employeeId_applicationKey: {
        employeeId: employee.id,
        applicationKey: 'applications'
      }
    },
    update: {},
    create: {
      employeeId: employee.id,
      applicationKey: 'applications'
    }
  })

  console.log('✅ Application assigned:', assignment)

  // Show all assigned applications
  const allApps = await prisma.b24EmployeeApplication.findMany({
    where: { employeeId: employee.id },
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
