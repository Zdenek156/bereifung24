const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEmailStatus() {
  try {
    // 1. Check email settings for employee
    const employee = await prisma.b24Employee.findFirst({
      where: { email: 'zdenek.kyzlink@bereifung24.de' }
    })
    
    if (!employee) {
      console.log('❌ Employee not found')
      return
    }
    
    console.log('✅ Employee found:', employee.id)
    
    // 2. Check email settings
    const settings = await prisma.emailSettings.findUnique({
      where: { b24EmployeeId: employee.id }
    })
    
    if (!settings) {
      console.log('❌ No email settings configured')
      console.log('👉 Please configure email settings at /mitarbeiter/email-settings')
      return
    }
    
    console.log('✅ Email settings found')
    console.log('   - Email:', settings.email)
    console.log('   - IMAP Server:', settings.imapHost)
    console.log('   - IMAP Port:', settings.imapPort)
    console.log('   - Last synced:', settings.lastSyncedAt)
    
    // 3. Check email messages
    const totalMessages = await prisma.emailMessage.count({
      where: { b24EmployeeId: employee.id }
    })
    
    const unreadMessages = await prisma.emailMessage.count({
      where: { 
        b24EmployeeId: employee.id,
        isRead: false
      }
    })
    
    console.log('\n📧 Email Messages in DB:')
    console.log('   - Total:', totalMessages)
    console.log('   - Unread:', unreadMessages)
    
    if (totalMessages === 0) {
      console.log('\n⚠️ No messages in database')
      console.log('👉 Try manual sync: Click "Synchronisieren" button in email page')
    }
    
    // 4. Show recent messages
    if (totalMessages > 0) {
      const recentMessages = await prisma.emailMessage.findMany({
        where: { b24EmployeeId: employee.id },
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          subject: true,
          from: true,
          date: true,
          isRead: true
        }
      })
      
      console.log('\n📬 Recent messages:')
      recentMessages.forEach((msg, i) => {
        console.log(`   ${i+1}. ${msg.isRead ? '✅' : '🔵'} ${msg.subject}`)
        console.log(`      From: ${msg.from}`)
        console.log(`      Date: ${msg.date}`)
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmailStatus()
