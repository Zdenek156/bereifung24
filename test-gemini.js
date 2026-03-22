const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Get the API key
  const setting = await prisma.adminApiSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } })
  if (!setting || !setting.value) {
    console.log('ERROR: No API key found')
    return
  }

  console.log('Key loaded, testing Gemini API...')

  // Test the Gemini API directly
  const { GoogleGenerativeAI } = require('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(setting.value)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })

  try {
    const result = await model.generateContent('Sag Hallo auf Deutsch in einem Satz.')
    const response = result.response.text()
    console.log('SUCCESS! Gemini response:', response)
  } catch (error) {
    console.log('ERROR calling Gemini:')
    console.log('  Name:', error.name)
    console.log('  Message:', error.message)
    if (error.status) console.log('  Status:', error.status)
    if (error.errorDetails) console.log('  Details:', JSON.stringify(error.errorDetails))
  }
}

main().catch(e => console.error('Unhandled:', e)).finally(() => prisma.$disconnect())
