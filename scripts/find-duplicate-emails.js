const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findDuplicateEmails() {
  console.log('🔍 SUCHE NACH DOPPELTEN E-MAIL-ADRESSEN');
  console.log('='.repeat(80));

  try {
    // 1. Alle User-E-Mails holen
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    });

    // 2. Alle B24Employee-E-Mails holen
    const employees = await prisma.b24Employee.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        password: true,
        position: true
      }
    });

    // 3. Duplikate finden
    const userEmails = new Set(users.map(u => u.email.toLowerCase()));
    const duplicates = employees.filter(emp => 
      userEmails.has(emp.email.toLowerCase())
    );

    console.log(`\n📊 STATISTIK:`);
    console.log(`   User-Accounts: ${users.length}`);
    console.log(`   Mitarbeiter-Accounts: ${employees.length}`);
    console.log(`   Doppelte E-Mails: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log('\n✅ Keine Duplikate gefunden! Alles in Ordnung.\n');
      await prisma.$disconnect();
      return;
    }

    // 4. Duplikate anzeigen
    console.log('\n⚠️  GEFUNDENE DUPLIKATE:\n');
    console.log('Diese E-Mails existieren SOWOHL als User ALS AUCH als Mitarbeiter:\n');

    for (const emp of duplicates) {
      const user = users.find(u => u.email.toLowerCase() === emp.email.toLowerCase());
      
      console.log(`📧 ${emp.email}`);
      console.log(`   ┌─ USER (Tabelle: users)`);
      console.log(`   │  Name: ${user.firstName} ${user.lastName}`);
      console.log(`   │  Role: ${user.role}`);
      console.log(`   │  Aktiv: ${user.isActive ? 'Ja' : 'Nein'}`);
      console.log(`   │`);
      console.log(`   └─ MITARBEITER (Tabelle: b24_employees)`);
      console.log(`      Name: ${emp.firstName} ${emp.lastName}`);
      console.log(`      Position: ${emp.position || 'keine'}`);
      console.log(`      Passwort: ${emp.password ? 'gesetzt' : 'NICHT gesetzt'}`);
      console.log(`      Aktiv: ${emp.isActive ? 'Ja' : 'Nein'}`);
      console.log('');
    }

    // 5. Problem erklären
    console.log('='.repeat(80));
    console.log('\n❌ PROBLEM:');
    console.log('   Beim Login über /login wird IMMER der User-Account verwendet.');
    console.log('   Der Mitarbeiter-Account wird IGNORIERT, wenn ein User existiert!\n');
    
    console.log('💡 LÖSUNGEN:\n');
    console.log('   Option 1: VERSCHIEDENE E-MAIL-ADRESSEN');
    console.log('   ├─ Mitarbeiter-E-Mail ändern (z.B. mitarbeiter@bereifung24.de)');
    console.log('   ├─ Script: node scripts/change-employee-email.js');
    console.log('   └─ Empfohlen für klare Trennung\n');
    
    console.log('   Option 2: DUAL-ROLE-SYSTEM (User bleibt, wird als Mitarbeiter markiert)');
    console.log('   ├─ User-Tabelle bekommt isEmployee=true Flag');
    console.log('   ├─ Login-Logik prüft: Wenn isEmployee → Zeige Auswahl');
    console.log('   ├─ User wählt: "Als Kunde" oder "Als Mitarbeiter"');
    console.log('   └─ Komplex, aber flexibel\n');
    
    console.log('   Option 3: USER LÖSCHEN, NUR MITARBEITER BEHALTEN');
    console.log('   ├─ Wenn User nur Admin ist → User löschen');
    console.log('   ├─ Mitarbeiter behält alle Rechte');
    console.log('   ├─ Script: node scripts/merge-admin-to-employee.js');
    console.log('   └─ Nur für Admin-User empfohlen!\n');

    console.log('⚡ SCHNELLE LÖSUNG (empfohlen):');
    console.log('   1. Entscheide pro E-Mail: Kunde ODER Mitarbeiter?');
    console.log('   2. Ändere die Mitarbeiter-E-Mail auf: vorname.nachname@bereifung24.de');
    console.log('   3. Mitarbeiter kann sich dann separat einloggen\n');

    // 6. Vorschlag für neue E-Mails generieren
    console.log('📝 VORGESCHLAGENE NEUE MITARBEITER-E-MAILS:\n');
    for (const emp of duplicates) {
      const newEmail = `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@bereifung24.de`;
      console.log(`   ${emp.email} → ${newEmail}`);
    }
    console.log('');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDuplicateEmails();
