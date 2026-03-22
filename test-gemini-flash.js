const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const setting = await prisma.adminApiSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } })
  if (!setting || !setting.value) { console.log('ERROR: No API key'); return }

  console.log('Testing gemini-2.0-flash...')
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(setting.value)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  try {
    const result = await model.generateContent('Sag Hallo auf Deutsch in einem Satz.')
    console.log('SUCCESS:', result.response.text())
  } catch (error) {
    console.log('ERROR:', error.message)
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
