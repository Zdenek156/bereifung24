const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmployee() {
  try {
    console.log('=== Checking B24Employees ===')
    const employees = await prisma.b24Employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log('\nLast 5 B24Employees:')
    employees.forEach(emp => {
      console.log(`- ${emp.firstName} ${emp.lastName} (${emp.email})`)
      console.log(`  ID: ${emp.id}`)
      console.log(`  User ID: ${emp.userId || 'NOT SET'}`)
      console.log(`  Created: ${emp.createdAt}`)
      console.log('')
    })
    
    console.log('\n=== Checking Users with B24_EMPLOYEE role ===')
    const users = await prisma.user.findMany({
      where: { role: 'B24_EMPLOYEE' },
      select: {
        id: true,
        email: true,
        password: true,
        b24EmployeeId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })
    
    console.log('\nLast 5 Users with B24_EMPLOYEE role:')
    users.forEach(user => {
      console.log(`- ${user.email}`)
      console.log(`  User ID: ${user.id}`)
      console.log(`  Has Password: ${user.password ? 'YES' : 'NO'}`)
      console.log(`  B24Employee ID: ${user.b24EmployeeId || 'NOT SET'}`)
      console.log(`  Created: ${user.createdAt}`)
      console.log('')
    })
    
    console.log('\n=== Checking for mismatches ===')
    const employeesWithoutUser = await prisma.b24Employee.findMany({
      where: { userId: null },
      select: { id: true, firstName: true, lastName: true, email: true }
    })
    
    if (employeesWithoutUser.length > 0) {
      console.log('\n⚠️  B24Employees WITHOUT User account:')
      employeesWithoutUser.forEach(emp => {
        console.log(`- ${emp.firstName} ${emp.lastName} (${emp.email})`)
      })
    } else {
      console.log('\n✅ All B24Employees have User accounts')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmployee()
