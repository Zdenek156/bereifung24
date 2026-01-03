const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetWorkshop() {
  try {
    console.log('🔧 Setze Test Werkstatt zurück für echtes Mandate...\n');
    
    // Finde Test Werkstatt über User
    const workshop = await prisma.workshop.findFirst({
      where: {
        user: {
          email: 'bikeanzeigen@gmail.com'
        }
      },
      include: {
        user: true
      }
    });

    if (!workshop) {
      console.error('❌ Test Werkstatt nicht gefunden');
      return;
    }

    console.log('📊 Aktuelle Daten:');
    console.log('   Name:', workshop.companyName);
    console.log('   Email:', workshop.user.email);
    console.log('   Mandate ID:', workshop.gocardlessMandateId);
    console.log('   Customer ID:', workshop.gocardlessCustomerId);
    console.log('');

    // Neuer realistischer Name
    const newName = 'Müller Reifenservice GmbH';

    console.log('✏️  Ändere Namen und setze GoCardless-Daten zurück...');
    
    const updated = await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        companyName: newName,
        // Setze alle GoCardless-Felder zurück
        gocardlessCustomerId: null,
        gocardlessMandateId: null,
        gocardlessMandateStatus: null,
        gocardlessMandateRef: null,
        gocardlessMandateCreatedAt: null,
        gocardlessBankAccountId: null,
        gocardlessSessionToken: null,
        gocardlessRedirectFlowId: null
      }
    });

    console.log('\n✅ Workshop erfolgreich zurückgesetzt!');
    console.log('   Neuer Name:', updated.companyName);
    console.log('   Email:', workshop.user.email);
    console.log('   GoCardless-Daten: Alle gelöscht');
    console.log('');
    console.log('📌 Nächste Schritte:');
    console.log('   1. Logge dich als Workshop ein: bikeanzeigen@gmail.com');
    console.log('   2. Gehe zu Einstellungen → SEPA-Lastschrift');
    console.log('   3. Klicke auf "SEPA-Mandat einrichten"');
    console.log('   4. Fülle echte Bankdaten aus (oder Test-IBAN: DE89370400440532013000)');
    console.log('   5. Das neue Mandate sollte innerhalb von Minuten aktiviert werden!');
    console.log('');
    console.log('💡 Tipp: Verwende eine deutsche Test-IBAN für sofortige Aktivierung:');
    console.log('   DE89370400440532013000 (GoCardless Test-Konto)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetWorkshop();
