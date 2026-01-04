const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// KONFIGURATION: Welcher User soll gelöscht werden?
const EMAIL_TO_DELETE = 'zdenek.kyzlink@bereifung24.de'; // User "Jirka Michl"

async function deleteCustomerUser() {
  console.log('🗑️  LÖSCHE USER-ACCOUNT');
  console.log('='.repeat(80));

  try {
    // 1. User finden
    const user = await prisma.user.findUnique({
      where: { email: EMAIL_TO_DELETE }
    });

    if (!user) {
      console.log(`\n❌ User mit E-Mail ${EMAIL_TO_DELETE} nicht gefunden!`);
      await prisma.$disconnect();
      return;
    }

    console.log(`\n📋 USER-DETAILS:`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   E-Mail: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Erstellt: ${user.createdAt}`);

    // WARNUNG anzeigen
    console.log('\n⚠️  WARNUNG: Dieser User wird DAUERHAFT gelöscht!');
    console.log('   Alle verknüpften Accounts und Sessions werden entfernt.');
    
    // Prüfe ob B24Employee mit gleicher E-Mail existiert
    const employee = await prisma.b24Employee.findUnique({
      where: { email: EMAIL_TO_DELETE }
    });

    if (employee) {
      console.log('\n✅ Mitarbeiter-Account existiert:');
      console.log(`   Name: ${employee.firstName} ${employee.lastName}`);
      console.log(`   Position: ${employee.position || 'keine'}`);
      console.log(`   Passwort: ${employee.password ? '✅ gesetzt' : '❌ NICHT gesetzt'}`);
      console.log('\n   Nach Löschung kann sich dieser Mitarbeiter einloggen!');
    } else {
      console.log('\n⚠️  ACHTUNG: KEIN Mitarbeiter-Account gefunden!');
      console.log('   Nach Löschung kann sich niemand mit dieser E-Mail einloggen!');
    }

    console.log('\n🔄 Lösche User...');

    // User löschen (CASCADE sollte Sessions automatisch löschen)
    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log('\n✅ USER ERFOLGREICH GELÖSCHT!');
    console.log(`\n📧 Die E-Mail ${EMAIL_TO_DELETE} ist jetzt frei!`);
    
    if (employee) {
      console.log('\n🎯 NÄCHSTER SCHRITT:');
      console.log(`   Login auf: https://bereifung24.de/login`);
      console.log(`   E-Mail: ${EMAIL_TO_DELETE}`);
      console.log(`   Passwort: ${employee.password ? 'Bestehendes Mitarbeiter-Passwort' : 'MUSS NOCH GESETZT WERDEN!'}`);
      console.log(`   → Sollte zu /mitarbeiter Portal weiterleiten`);
    }

  } catch (error) {
    console.error('\n❌ Fehler beim Löschen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteCustomerUser();
