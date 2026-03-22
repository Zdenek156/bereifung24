const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const setting = await prisma.adminApiSetting.upsert({
    where: { key: 'GEMINI_API_KEY' },
    update: { description: 'Google Gemini API Key für KI-Reifen-Berater (Gemini 2.0 Flash-Lite)' },
    create: {
      key: 'GEMINI_API_KEY',
      value: '',
      description: 'Google Gemini API Key für KI-Reifen-Berater (Gemini 2.0 Flash-Lite)'
    }
  })
  console.log('✓ GEMINI_API_KEY added:', setting.key)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
