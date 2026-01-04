const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllSessions() {
  console.log('🗑️  LÖSCHE ALLE SESSIONS');
  console.log('='.repeat(80));

  try {
    // Lösche alle Sessions aus der Datenbank
    const result = await prisma.session.deleteMany({});

    console.log(`✅ ${result.count} Session(s) gelöscht`);
    console.log('\n📋 NÄCHSTE SCHRITTE:');
    console.log('   1. Gehe zu: https://bereifung24.de/login');
    console.log('   2. Logge dich neu ein');
    console.log('   3. B24_EMPLOYEE sollte zu /mitarbeiter weitergeleitet werden\n');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSessions();
