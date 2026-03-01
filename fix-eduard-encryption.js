const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const prisma = new PrismaClient()

function decrypt(encryptedText) {
  if (!encryptedText) return ''
  
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format')
    }
    
    const iv = Buffer.from(parts[0], 'hex')
    const encryptedData = parts[1]
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex').slice(0, 32)
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    throw new Error('Failed to decrypt data: ' + error.message)
  }
}

async function fixEduardBankData() {
  try {
    const eduardId = 'cmkbadyry0006voitldd1pmmi'
    
    const employee = await prisma.b24Employee.findUnique({
      where: { id: eduardId },
      include: {
        profile: true
      }
    })

    if (!employee) {
      console.log('Eduard not found')
      return
    }

    console.log('Eduard gefunden:', {
      id: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      hasProfile: !!employee.profile,
      hasBankAccount: !!employee.profile?.bankAccount
    })

    if (employee.profile?.bankAccount) {
      console.log('\nBankAccount verschlüsselter Wert:', employee.profile.bankAccount.substring(0, 50) + '...')
      console.log('Versuche zu entschlüsseln mit aktuellem ENCRYPTION_KEY...')
      
      try {
        const decrypted = decrypt(employee.profile.bankAccount)
        console.log('✓ Erfolgreich entschlüsselt:', decrypted)
        console.log('\n✅ Bankdaten sind korrekt verschlüsselt - kein Problem!')
      } catch (error) {
        console.log('✗ Fehler beim Entschlüsseln:', error.message)
        console.log('\n⚠️  Die Bankdaten wurden mit einem ANDEREN Encryption Key verschlüsselt!')
        console.log('Lösche korrupte Bankdaten...')
        
        await prisma.employeeProfile.update({
          where: { id: employee.profile.id },
          data: {
            bankAccount: null,
            bic: null,
            bankName: null
          }
        })
        
        console.log('✓ Korrupte Bankdaten gelöscht. Eduard kann jetzt neue Daten eingeben.')
      }
    } else {
      console.log('Keine Bankdaten vorhanden')
    }

  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixEduardBankData()
