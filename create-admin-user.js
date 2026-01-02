require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    // Konfiguration - HIER ANPASSEN
    const adminEmail = 'wordpress@stylo-app.de'; // Deine neue Admin-Email
    const adminPassword = 'Admin2026!'; // Temporäres Passwort - UNBEDINGT ÄNDERN nach erstem Login!
    const firstName = 'Zdenek';
    const lastName = 'Admin';
    
    console.log('Creating admin user with email:', adminEmail);
    
    // Prüfen ob User bereits existiert
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existing) {
      console.log('❌ User with this email already exists!');
      console.log('User ID:', existing.id);
      console.log('Current role:', existing.role);
      
      if (existing.role !== 'ADMIN') {
        console.log('\n⚠️  Updating existing user to ADMIN role...');
        const updated = await prisma.user.update({
          where: { email: adminEmail },
          data: { role: 'ADMIN' },
          select: { id: true, email: true, role: true }
        });
        console.log('✅ User updated:', JSON.stringify(updated, null, 2));
      } else {
        console.log('✅ User already has ADMIN role');
      }
      return;
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Admin-User erstellen
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN',
        firstName: firstName,
        lastName: lastName,
        emailVerified: new Date(),
        isActive: true
      },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('\n✅ Admin user created successfully!');
    console.log(JSON.stringify(admin, null, 2));
    console.log('\n📧 Email:', adminEmail);
    console.log('🔑 Temporary Password:', adminPassword);
    console.log('\n⚠️  WICHTIG: Ändere das Passwort nach dem ersten Login!');
    console.log('Login URL: https://bereifung24.de/login');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
