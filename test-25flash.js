const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const s = await prisma.adminApiSetting.findFirst({ where: { key: 'GEMINI_API_KEY' } });
  const g = new GoogleGenerativeAI(s.value);
  const m = g.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const r = await m.generateContent('Sage Hallo auf Deutsch, kurz.');
  console.log('Response:', r.response.text());
  await prisma.$disconnect();
})().catch(e => { console.error('Error:', e.message); process.exit(1); });
