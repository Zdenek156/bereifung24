const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Simplified decrypt check - just try to parse as base64
function isEncrypted(data) {
  // Encrypted data should start with specific format
  // If it's plain text IBAN (e.g., "DE89370400440532013000"), it's not encrypted
  if (!data) return false
  
  // Check if it looks like a plain IBAN (starts with country code)
  if (/^[A-Z]{2}\d{2}/.test(data)) {
    return false // Plain IBAN
  }
  
  // If it contains base64-like structure (from our encryption), consider it encrypted
  if (data.includes(':') && data.length > 20) {
    return true
  }
  
  return false
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
      console.log('\nBankAccount Wert (erste 50 Zeichen):', employee.profile.bankAccount.substring(0, 50))
      
      // Check if encrypted
      if (isEncrypted(employee.profile.bankAccount)) {
        console.log('✓ Bankdaten sind verschlüsselt')
      } else {
        console.log('✗ Bankdaten sind NICHT verschlüsselt')
        console.log('Voller Wert:', employee.profile.bankAccount)
        console.log('\nLösche unverschlüsselte Bankdaten...')
        
        await prisma.employeeProfile.update({
          where: { id: employee.profile.id },
          data: {
            bankAccount: null,
            bic: null,
            bankName: null
          }
        })
        
        console.log('✓ Unverschlüsselte Bankdaten gelöscht')
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
