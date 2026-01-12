/**
 * Assign applications Application to Admin User
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Find your B24Employee by email (replace with your actual admin email)
  const adminEmail = 'info@bereifung24.de' // Change this to your admin email
  
  const employee = await prisma.b24Employee.findUnique({
    where: { email: adminEmail }
  })

  if (!employee) {
    console.log(`❌ No B24Employee found with email: ${adminEmail}`)
    console.log('Available employees:')
    const all = await prisma.b24Employee.findMany({
      select: { email: true, firstName: true, lastName: true }
    })
    all.forEach(e => console.log(`  - ${e.email} (${e.firstName} ${e.lastName})`))
    return
  }

  console.log('Found employee:', employee.email, '-', employee.firstName, employee.lastName)

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
