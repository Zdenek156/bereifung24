const { PrismaClient } = require('@prisma/client')
const { decrypt } = require('./lib/crypto/encryption')

const prisma = new PrismaClient()

async function testDecrypt() {
  try {
    console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY ? `${process.env.ENCRYPTION_KEY.substring(0, 10)}...` : 'NOT SET')
    
    const supplier = await prisma.workshopSupplier.findFirst({
      where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' }
    })
    
    if (!supplier) {
      console.log('No supplier found')
      return
    }
    
    console.log('Found supplier:', supplier.name)
    console.log('Username encrypted:', supplier.usernameEncrypted)
    console.log('Password encrypted:', supplier.passwordEncrypted)
    console.log('IV:', supplier.encryptionIv)
    
    console.log('\nAttempting decrypt...')
    const username = decrypt(supplier.usernameEncrypted, supplier.encryptionIv)
    const password = decrypt(supplier.passwordEncrypted, supplier.encryptionIv)
    
    console.log('✅ Decrypted successfully!')
    console.log('Username length:', username.length)
    console.log('Password length:', password.length)
  } catch (error) {
    console.error('❌ Decrypt failed:', error.message)
    console.error(error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

testDecrypt()
