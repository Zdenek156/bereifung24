const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupEmployeePortal() {
  console.log('🔧 Employee Portal Setup wird gestartet...\n');

  try {
    // 1. ENCRYPTION_KEY aus Umgebungsvariable lesen
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      console.error('❌ ENCRYPTION_KEY Umgebungsvariable ist nicht gesetzt!');
      console.error('   Bitte setzen Sie ENCRYPTION_KEY in der .env Datei auf dem Server.');
      process.exit(1);
    }
    
    await prisma.adminApiSetting.upsert({
      where: { key: 'ENCRYPTION_KEY' },
      update: { value: encryptionKey },
      create: {
        key: 'ENCRYPTION_KEY',
        value: encryptionKey,
        description: 'AES-256 Verschlüsselungsschlüssel für Mitarbeiter-Stammdaten (Steuer-ID, Bankdaten, etc.)'
      }
    });
    console.log('✅ ENCRYPTION_KEY erfolgreich gespeichert');

    // 2. Bestehende Keys anzeigen
    const allSettings = await prisma.adminApiSetting.findMany({
      select: { key: true, description: true }
    });
    
    console.log('\n📋 Verfügbare API-Settings:');
    allSettings.forEach(setting => {
      console.log(`   - ${setting.key}: ${setting.description || 'Keine Beschreibung'}`);
    });

    console.log('\n✨ Setup abgeschlossen!');
    console.log('\n📍 ENCRYPTION_KEY kann jetzt in Admin-Panel verwaltet werden:');
    console.log('   http://localhost:3000/admin/api-settings');
    
  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupEmployeePortal();
