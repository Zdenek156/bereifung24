const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  try {
    const r = await p.tireChangePricingBySize.findFirst();
    console.log('tireChangePricingBySize OK:', r);
  } catch(e) {
    console.error('tireChangePricingBySize ERROR:', e.message.substring(0, 200));
  }

  try {
    const r2 = await p.workshopLandingPage.findFirst();
    console.log('workshopLandingPage OK:', r2 ? 'exists' : 'null');
  } catch(e) {
    console.error('workshopLandingPage ERROR:', e.message.substring(0, 200));
  }

  // Check if the table exists in DB
  try {
    const tables = await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_name IN ('tire_change_pricing_by_size', 'workshop_landing_pages') ORDER BY table_name");
    console.log('DB tables found:', JSON.stringify(tables));
  } catch(e) {
    console.error('Table check error:', e.message);
  }

  await p.$disconnect();
}
main();
