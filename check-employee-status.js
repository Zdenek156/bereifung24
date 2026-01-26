const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmployeeStatus() {
  try {
    // Check if status column exists
    const employees = await prisma.b24Employee.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    })

    console.log('\n=== Recent Employees ===')
    employees.forEach(emp => {
      console.log(`${emp.firstName} ${emp.lastName} (${emp.email})`)
      console.log(`  Status: ${emp.status || 'NULL'}`)
      console.log(`  Created: ${emp.createdAt}`)
      console.log('')
    })

    // Check job applications with HIRED status
    const hiredApplications = await prisma.jobApplication.findMany({
      where: { status: 'HIRED' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true
      }
    })

    console.log('\n=== HIRED Applications ===')
    console.log(`Total: ${hiredApplications.length}`)
    hiredApplications.forEach(app => {
      console.log(`${app.firstName} ${app.lastName} (${app.email})`)
      console.log(`  Application ID: ${app.id}`)
      console.log(`  Created: ${app.createdAt}`)
      console.log('')
    })

  } catch (error) {
    console.error('Error:', error)
    if (error.message.includes('status')) {
      console.log('\n❌ Status column does not exist yet!')
    }
  } finally {
    await prisma.$disconnect()
  }
}

checkEmployeeStatus()
