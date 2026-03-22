const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient();
  const setting = await prisma.adminApiSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } });
  const key = setting.value.trim();
  
  // List available models
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
  const data = await res.json();
  
  if (data.models) {
    console.log('Available models that support generateContent:');
    data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .forEach(m => console.log(' ', m.name));
  } else {
    console.log('Error listing models:', JSON.stringify(data));
  }
  
  // Try gemini-2.5-flash (newest)
  console.log('\n--- Testing gemini-2.5-flash ---');
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(key);
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent('Sag Hallo');
    console.log('SUCCESS:', result.response.text().substring(0, 200));
  } catch (e) {
    console.log('ERROR:', e.message);
  }
  
  await prisma.$disconnect();
}

run().catch(e => console.error('Fatal:', e));
