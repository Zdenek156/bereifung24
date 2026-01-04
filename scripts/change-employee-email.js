const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// KONFIGURATION: Welche E-Mails sollen geändert werden?
const EMAIL_CHANGES = [
  // Beispiel:
  // { old: 'admin@bereifung24.de', new: 'admin.mitarbeiter@bereifung24.de' },
  // { old: 'test@bereifung24.de', new: 'test.employee@bereifung24.de' },
  
  // HIER DEINE E-MAIL-ÄNDERUNGEN EINFÜGEN:
];

async function changeEmployeeEmails() {
  console.log('📧 ÄNDERE MITARBEITER-E-MAIL-ADRESSEN');
  console.log('='.repeat(80));

  if (EMAIL_CHANGES.length === 0) {
    console.log('\n⚠️  Keine E-Mail-Änderungen konfiguriert!');
    console.log('   Öffne das Script und füge deine Änderungen in EMAIL_CHANGES hinzu.\n');
    console.log('   Beispiel:');
    console.log('   const EMAIL_CHANGES = [');
    console.log('     { old: "admin@bereifung24.de", new: "admin.mitarbeiter@bereifung24.de" },');
    console.log('   ];\n');
    await prisma.$disconnect();
    return;
  }

  try {
    for (const change of EMAIL_CHANGES) {
      console.log(`\n🔄 Ändere: ${change.old} → ${change.new}`);

      // Prüfe ob alte E-Mail existiert
      const employee = await prisma.b24Employee.findUnique({
        where: { email: change.old }
      });

      if (!employee) {
        console.log(`   ❌ Mitarbeiter mit E-Mail ${change.old} nicht gefunden!`);
        continue;
      }

      // Prüfe ob neue E-Mail bereits existiert
      const existingEmployee = await prisma.b24Employee.findUnique({
        where: { email: change.new }
      });

      if (existingEmployee) {
        console.log(`   ❌ E-Mail ${change.new} wird bereits verwendet!`);
        continue;
      }

      const existingUser = await prisma.user.findUnique({
        where: { email: change.new }
      });

      if (existingUser) {
        console.log(`   ❌ E-Mail ${change.new} existiert bereits als User!`);
        continue;
      }

      // E-Mail ändern
      await prisma.b24Employee.update({
        where: { email: change.old },
        data: { 
          email: change.new,
          emailVerified: true // Wichtig für Login
        }
      });

      console.log(`   ✅ Erfolgreich geändert!`);
      console.log(`   📋 Neue Login-Daten:`);
      console.log(`      E-Mail: ${change.new}`);
      console.log(`      Passwort: ${employee.password ? 'Bestehendes Passwort' : 'NICHT GESETZT - Muss neu gesetzt werden!'}`);
    }

    console.log('\n✅ Alle E-Mail-Änderungen abgeschlossen!\n');

  } catch (error) {
    console.error('❌ Fehler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

changeEmployeeEmails();
