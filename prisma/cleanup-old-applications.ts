/**
 * Cleanup old application keys that were renamed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Cleaning up old application keys...')

  // Delete old keys that were renamed
  const oldKeys = ['crm', 'email']

  for (const key of oldKeys) {
    const deleted = await prisma.application.deleteMany({
      where: { key }
    })
    if (deleted.count > 0) {
      console.log(`✅ Deleted old key: ${key}`)
    }
  }

  console.log('\n✨ Cleanup complete!')
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
