const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function fixMissingProfileImages() {
  try {
    console.log('🔍 Checking for missing profile images...\n')
    
    const employees = await prisma.b24Employee.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true
      }
    })

    let fixed = 0
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles')

    for (const employee of employees) {
      if (employee.profileImage) {
        // Check if file exists
        const imagePath = path.join(process.cwd(), 'public', employee.profileImage)
        
        if (!fs.existsSync(imagePath)) {
          console.log(`❌ Missing: ${employee.firstName} ${employee.lastName}`)
          console.log(`   Path: ${employee.profileImage}`)
          console.log(`   Full path: ${imagePath}`)
          
          await prisma.b24Employee.update({
            where: { id: employee.id },
            data: { profileImage: null }
          })
          
          console.log(`   ✅ Cleared profile image path\n`)
          fixed++
        } else {
          console.log(`✓ OK: ${employee.firstName} ${employee.lastName} - ${employee.profileImage}`)
        }
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total employees: ${employees.length}`)
    console.log(`   With images: ${employees.filter(e => e.profileImage).length}`)
    console.log(`   Fixed: ${fixed}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixMissingProfileImages()
