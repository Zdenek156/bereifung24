const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmailSettings() {
  try {
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM']
        }
      }
    })
    
    console.log('\n=== E-MAIL EINSTELLUNGEN aus adminApiSetting ===')
    
    if (settings.length === 0) {
      console.log('❌ KEINE E-Mail-Einstellungen gefunden!')
      console.log('\nEs müssen folgende Keys angelegt werden:')
      console.log('- EMAIL_HOST')
      console.log('- EMAIL_PORT')
      console.log('- EMAIL_USER')
      console.log('- EMAIL_PASSWORD')
      console.log('- EMAIL_FROM')
    } else {
      settings.forEach(setting => {
        if (setting.key === 'EMAIL_PASSWORD') {
          console.log(`${setting.key}: ***SET***`)
        } else {
          console.log(`${setting.key}: ${setting.value || 'NOT SET'}`)
        }
      })
    }
    
    console.log('\n=== Prüfe Umgebungsvariablen ===')
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET')
    console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET')
    console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET')
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***SET***' : 'NOT SET')
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM || 'NOT SET')
    console.log('\n')
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkEmailSettings()
