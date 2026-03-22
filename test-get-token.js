const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const setting = await p.adminApiSetting.findUnique({ where: { key: 'GEMINI_API_KEY' } });
  if (!setting) { console.log('NO_KEY'); return; }

  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(setting.value);

  // Test gemini-2.0-flash-lite (highest free tier: 30 RPM)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 800,
    },
  });

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: 'Du bist ein Reifen-Berater.' }] },
        { role: 'model', parts: [{ text: 'Verstanden!' }] },
      ],
    });
    const result = await chat.sendMessage('Hallo, welche Reifen empfiehlst du fuer einen VW Golf?');
    console.log('SUCCESS:', result.response.text().substring(0, 300));
  } catch (e) {
    console.error('ERROR:', e.message);
  }

  await p.$disconnect();
}
main();
