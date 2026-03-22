const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Read directly from DB, no cache
  const setting = await prisma.adminApiSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } })
  if (!setting || !setting.value) { console.log('ERROR: No API key'); return }

  console.log('Key from DB: starts with', setting.value.substring(0, 8) + '..., length:', setting.value.length)

  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(setting.value)

  // Try gemini-1.5-flash as fallback (most generous free tier)
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash']
  
  for (const modelName of models) {
    console.log('\nTesting', modelName + '...')
    const model = genAI.getGenerativeModel({ model: modelName })
    try {
      const result = await model.generateContent('Sag Hallo')
      console.log('SUCCESS with', modelName + ':', result.response.text())
      return
    } catch (error) {
      console.log('FAILED:', error.message.substring(0, 120))
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
