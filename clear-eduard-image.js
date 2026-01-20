const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function clearEduardImage() {
  try {
    console.log('Clearing Eduard\'s broken profileImage reference...')
    
    // Clear B24Employee profileImage
    await prisma.b24Employee.update({
      where: { id: 'cmkbadyry0006voitldd1pmmi' },
      data: { profileImage: null }
    })
    
    console.log('✅ Cleared profileImage from B24Employee')
    console.log('\nEduard kann jetzt ein neues Bild hochladen!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearEduardImage()
