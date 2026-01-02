const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmailSettings() {
  try {
    const settings = await prisma.emailSettings.findFirst()
    
    console.log('\n=== E-MAIL EINSTELLUNGEN ===')
    console.log('Host:', settings?.host || 'NOT SET')
    console.log('Port:', settings?.port || 'NOT SET')
    console.log('User:', settings?.user || 'NOT SET')
    console.log('Password:', settings?.password ? '***SET***' : 'NOT SET')
    console.log('From:', settings?.from || 'NOT SET')
    console.log('Secure:', settings?.secure)
    console.log('\n')
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkEmailSettings()
