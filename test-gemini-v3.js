const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

async function test() {
  const prisma = new PrismaClient();
  const setting = await prisma.adminApiSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } });
  
  if (!setting || !setting.value) {
    console.log('No GEMINI_API_KEY found in DB');
    await prisma.$disconnect();
    return;
  }
  
  const key = setting.value.trim();
  console.log('Key prefix:', key.substring(0, 10) + '...');
  console.log('Key length:', key.length);
  console.log('Key ends with:', key.substring(key.length - 4));
  
  const genAI = new GoogleGenerativeAI(key);
  
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  
  for (const modelName of models) {
    console.log('\n--- Testing', modelName, '---');
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Sag einfach Hallo');
      const text = result.response.text();
      console.log('SUCCESS:', text.substring(0, 200));
      break; // stop on first success
    } catch (e) {
      const fullError = e.message || e.toString();
      console.log('FULL ERROR:', fullError);
      
      // Try to extract status code
      if (e.status) console.log('Status:', e.status);
      if (e.statusText) console.log('StatusText:', e.statusText);
      if (e.errorDetails) console.log('Details:', JSON.stringify(e.errorDetails));
    }
  }
  
  await prisma.$disconnect();
}

test().catch(e => console.error('Fatal:', e));
