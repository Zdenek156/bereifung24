const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmailSettings() {
  try {
    console.log('\n=== EMAIL SETTINGS CHECK ===\n')
    
    // Finde User mit Email zdenek.kyzlink@bereifung24.de
    const user = await prisma.user.findUnique({
      where: { email: 'zdenek.kyzlink@bereifung24.de' }
    })
    
    if (!user) {
      console.log('❌ User nicht gefunden')
      return
    }
    
    console.log('✅ User gefunden:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    
    // Prüfe B24Employee
    const employee = await prisma.b24Employee.findUnique({
      where: { userId: user.id }
    })
    
    if (employee) {
      console.log(`\n✅ B24Employee gefunden:`)
      console.log(`   ID: ${employee.id}`)
      console.log(`   Name: ${employee.firstName} ${employee.lastName}`)
      
      // Prüfe Email Settings für B24Employee
      const employeeSettings = await prisma.emailSettings.findUnique({
        where: { b24EmployeeId: employee.id }
      })
      
      if (employeeSettings) {
        console.log('\n✅ Email Settings für B24Employee gefunden:')
        console.log(`   ID: ${employeeSettings.id}`)
        console.log(`   IMAP Host: ${employeeSettings.imapHost}`)
        console.log(`   IMAP Port: ${employeeSettings.imapPort}`)
        console.log(`   IMAP User: ${employeeSettings.imapUser}`)
        console.log(`   IMAP TLS: ${employeeSettings.imapTls}`)
        console.log(`   SMTP Host: ${employeeSettings.smtpHost}`)
        console.log(`   SMTP Port: ${employeeSettings.smtpPort}`)
        console.log(`   SMTP User: ${employeeSettings.smtpUser}`)
        console.log(`   SMTP Secure: ${employeeSettings.smtpSecure}`)
        console.log(`   Sync Enabled: ${employeeSettings.syncEnabled}`)
        console.log(`   Password Set: ${employeeSettings.imapPassword ? 'YES' : 'NO'}`)
      } else {
        console.log('\n❌ KEINE Email Settings für B24Employee gefunden!')
      }
    }
    
    // Prüfe auch Email Settings für User direkt
    const userSettings = await prisma.emailSettings.findUnique({
      where: { userId: user.id }
    })
    
    if (userSettings) {
      console.log('\n✅ Email Settings für User gefunden:')
      console.log(`   ID: ${userSettings.id}`)
      console.log(`   IMAP Host: ${userSettings.imapHost}`)
      console.log(`   IMAP User: ${userSettings.imapUser}`)
    } else {
      console.log('\n❌ KEINE Email Settings für User gefunden')
    }
    
    // Prüfe alle EmailSettings Einträge
    const allSettings = await prisma.emailSettings.findMany({
      select: {
        id: true,
        userId: true,
        b24EmployeeId: true,
        imapUser: true,
        imapHost: true,
      }
    })
    
    console.log(`\n📊 Gesamt ${allSettings.length} EmailSettings Einträge in DB:`)
    allSettings.forEach(setting => {
      console.log(`   - ID: ${setting.id}, User: ${setting.userId || 'null'}, Employee: ${setting.b24EmployeeId || 'null'}, Email: ${setting.imapUser}`)
    })
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmailSettings()
