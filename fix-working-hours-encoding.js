const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function fixWorkingHours() {
  try {
    console.log('🔧 Fixing double-encoded working hours...\n')
    
    const employee = await prisma.employee.findFirst({
      where: { name: 'Zdenek' }
    })
    
    if (!employee) {
      console.log('Employee not found')
      return
    }
    
    console.log('Current working hours:', employee.workingHours)
    console.log('Type:', typeof employee.workingHours)
    
    let workingHours = employee.workingHours
    
    // Check if it's double-encoded
    if (typeof workingHours === 'string') {
      try {
        const parsed = JSON.parse(workingHours)
        console.log('\nFirst parse:', typeof parsed)
        
        if (typeof parsed === 'string') {
          console.log('⚠️  Double-encoded detected!')
          const doubleParsed = JSON.parse(parsed)
          console.log('Second parse:', typeof doubleParsed)
          console.log('Thursday:', doubleParsed.thursday)
          
          // Fix it - save as proper JSON object
          await prisma.employee.update({
            where: { id: employee.id },
            data: {
              workingHours: JSON.stringify(doubleParsed)
            }
          })
          
          console.log('\n✅ Fixed! Working hours are now properly encoded.')
        } else {
          console.log('✅ Working hours are correctly encoded')
          console.log('Thursday:', parsed.thursday)
        }
      } catch (e) {
        console.error('Parse error:', e.message)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixWorkingHours()
