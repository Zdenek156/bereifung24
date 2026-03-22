const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const setting = await prisma.adminApiSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } })
  if (!setting) {
    console.log('GEMINI_API_KEY: NOT FOUND in database')
  } else if (!setting.value || setting.value.trim() === '') {
    console.log('GEMINI_API_KEY: EMPTY (no value set)')
  } else {
    console.log('GEMINI_API_KEY: SET (length:', setting.value.length, ', starts with:', setting.value.substring(0, 6) + '...)')
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
