// Migration script to reverse hierarchyLevel values
// Old: 0=Mitarbeiter, 1=Teamleiter, 2=Manager, 3=Geschäftsführung
// New: 0=Geschäftsführung, 1=Manager, 2=Teamleiter, 3=Mitarbeiter

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Starting hierarchyLevel migration...')
  
  // Get all employees
  const employees = await prisma.b24Employee.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      hierarchyLevel: true
    }
  })
  
  console.log(`Found ${employees.length} employees`)
  
  // Reverse the values: 3 - oldValue
  for (const employee of employees) {
    const oldValue = employee.hierarchyLevel
    const newValue = 3 - oldValue
    
    await prisma.b24Employee.update({
      where: { id: employee.id },
      data: { hierarchyLevel: newValue }
    })
    
    console.log(`${employee.firstName} ${employee.lastName}: ${oldValue} -> ${newValue}`)
  }
  
  console.log('Migration completed successfully!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
