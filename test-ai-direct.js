const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    // Get API key from DB
    const setting = await prisma.adminApiSetting.findFirst({
      where: { key: 'GEMINI_API_KEY' }
    });
    
    if (!setting) {
      console.log('No GEMINI_API_KEY found in DB');
      return;
    }
    
    console.log('API Key found, length:', setting.value.length);
    console.log('Key prefix:', setting.value.substring(0, 10) + '...');
    
    // Test gemini-2.0-flash
    const genAI = new GoogleGenerativeAI(setting.value);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 800,
      },
    });
    
    console.log('\nTesting gemini-2.0-flash...');
    const result = await model.generateContent('Sage Hallo auf Deutsch, kurz.');
    const text = result.response.text();
    console.log('Response:', text);
    console.log('\n✅ gemini-2.0-flash works!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.status) console.error('Status:', error.status);
    if (error.statusText) console.error('StatusText:', error.statusText);
    console.error('Full error:', JSON.stringify(error, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

test();
