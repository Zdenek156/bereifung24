const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestEmployee() {
  const email = 'mitarbeiter@bereifung24.de'; // ANPASSEN
  const password = 'Test1234!'; // ANPASSEN
  const firstName = 'Test';
  const lastName = 'Mitarbeiter';

  try {
    // Prüfen ob E-Mail schon existiert
    const existing = await prisma.b24Employee.findUnique({
      where: { email }
    });

    if (existing) {
      console.log(`❌ Mitarbeiter mit E-Mail ${email} existiert bereits!`);
      console.log('   Möchtest du das Passwort zurücksetzen?');
      console.log('   Dann lösche erst den Account oder nutze eine andere E-Mail.\n');
      
      // Zeige aktuellen Status
      console.log('   Aktueller Status:');
      console.log(`   - Name: ${existing.firstName} ${existing.lastName}`);
      console.log(`   - E-Mail verifiziert: ${existing.emailVerified ? 'Ja' : 'Nein'}`);
      console.log(`   - Passwort gesetzt: ${existing.password ? 'Ja' : 'Nein'}`);
      console.log(`   - Aktiv: ${existing.isActive ? 'Ja' : 'Nein'}`);
      
      await prisma.$disconnect();
      return;
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // Mitarbeiter erstellen
    const employee = await prisma.b24Employee.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        emailVerified: true, // WICHTIG: Muss true sein für Login
        isActive: true,
        position: 'Test-Mitarbeiter',
        department: 'IT'
      }
    });

    console.log('✅ Test-Mitarbeiter erfolgreich erstellt!');
    console.log('');
    console.log('📋 Login-Daten:');
    console.log(`   E-Mail: ${email}`);
    console.log(`   Passwort: ${password}`);
    console.log('');
    console.log('🔗 Login-URL: https://www.bereifung24.de/login');
    console.log('');
    console.log('📝 Nach Login verfügbar:');
    console.log('   • /mitarbeiter - Dashboard');
    console.log('   • /mitarbeiter/profil - Profil bearbeiten');
    console.log('   • /mitarbeiter/dokumente - Dokumente hochladen');
    console.log('   • /mitarbeiter/email - E-Mail-System');
    console.log('');
    console.log('⚠️  WICHTIG: Ändere das Passwort nach dem ersten Login!');

    // Basis-Berechtigungen hinzufügen (optional)
    const basicResources = ['email', 'files'];
    
    for (const resource of basicResources) {
      await prisma.b24EmployeePermission.create({
        data: {
          employeeId: employee.id,
          resource,
          canRead: true,
          canWrite: false,
          canDelete: false
        }
      });
    }

    console.log('✅ Basis-Berechtigungen hinzugefügt (E-Mail, Dateien)');

  } catch (error) {
    console.error('❌ Fehler beim Erstellen:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestEmployee();
