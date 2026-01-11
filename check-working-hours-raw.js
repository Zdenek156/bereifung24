const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkWorkingHoursRaw() {
  try {
    console.log('🔍 Checking raw working hours data...\n')
    
    const employee = await prisma.employee.findFirst({
      where: {
        name: 'Zdenek'
      },
      select: {
        id: true,
        name: true,
        workingHours: true,
        workshop: {
          select: {
            companyName: true
          }
        }
      }
    })
    
    if (!employee) {
      console.log('❌ Employee Zdenek not found')
      return
    }
    
    console.log(`📍 Employee: ${employee.name}`)
    console.log(`   Workshop: ${employee.workshop.companyName}`)
    console.log(`   Working Hours (raw): ${employee.workingHours}`)
    console.log(`   Type: ${typeof employee.workingHours}`)
    console.log(`   Is null: ${employee.workingHours === null}`)
    console.log(`   Is empty string: ${employee.workingHours === ''}`)
    
    if (employee.workingHours) {
      console.log('\n📊 Parsed Working Hours:')
      try {
        const parsed = JSON.parse(employee.workingHours)
        console.log(JSON.stringify(parsed, null, 2))
      } catch (e) {
        console.log('❌ Failed to parse JSON:', e.message)
      }
    } else {
      console.log('\n⚠️  Working hours are NOT saved in database!')
      console.log('   This is why the calendar slots are not showing.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkWorkingHoursRaw()
