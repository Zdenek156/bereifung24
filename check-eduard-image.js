const { PrismaClient } = require('@prisma/client')
const { existsSync } = require('fs')
const { join } = require('path')

const prisma = new PrismaClient()

async function checkEduardImage() {
  try {
    // Find Eduard in database
    const eduard = await prisma.b24Employee.findUnique({
      where: { id: 'cmkbadyry0006voitldd1pmmi' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profileImage: true
      }
    })

    console.log('\n=== Eduard in Database ===')
    console.log(JSON.stringify(eduard, null, 2))

    if (eduard?.profileImage) {
      // Check if file exists
      const filePath = join(process.cwd(), 'public', eduard.profileImage)
      const exists = existsSync(filePath)
      
      console.log('\n=== File Check ===')
      console.log('Expected path:', filePath)
      console.log('File exists:', exists)
      
      if (!exists) {
        console.log('\n⚠️ IMAGE FILE DOES NOT EXIST ON DISK!')
        console.log('Need to clear profileImage from database or re-upload image')
      } else {
        console.log('\n✅ Image file exists')
      }
    } else {
      console.log('\n⚠️ No profileImage set in database')
    }

    // Check EmployeeProfile too
    const profile = await prisma.employeeProfile.findUnique({
      where: { employeeId: 'cmkbadyry0006voitldd1pmmi' },
      select: {
        profileImageUrl: true
      }
    })

    console.log('\n=== EmployeeProfile ===')
    console.log(JSON.stringify(profile, null, 2))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEduardImage()
