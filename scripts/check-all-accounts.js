const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAccounts() {
  console.log('📋 ACCOUNT-ÜBERSICHT');
  console.log('='.repeat(80));
  
  // 1. ADMIN-USERS
  console.log('\n1️⃣  ADMIN-ACCOUNTS (User-Tabelle):');
  const adminUsers = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true }
  });
  
  if (adminUsers.length > 0) {
    adminUsers.forEach(user => {
      console.log(`   ✅ ${user.email} - ${user.firstName} ${user.lastName} ${user.isActive ? '(aktiv)' : '(inaktiv)'}`);
    });
  } else {
    console.log('   ❌ Keine Admin-Accounts gefunden');
  }

  // 2. KUNDEN
  console.log('\n2️⃣  KUNDEN-ACCOUNTS (User-Tabelle):');
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true, emailVerified: true }
  });
  
  console.log(`   Anzahl: ${customers.length}`);
  if (customers.length > 0) {
    customers.slice(0, 3).forEach(user => {
      console.log(`   • ${user.email} ${user.emailVerified ? '✓' : '(unverifiziert)'}`);
    });
    if (customers.length > 3) {
      console.log(`   ... und ${customers.length - 3} weitere`);
    }
  }

  // 3. WERKSTÄTTEN
  console.log('\n3️⃣  WERKSTATT-ACCOUNTS (User-Tabelle):');
  const workshops = await prisma.user.findMany({
    where: { role: 'WORKSHOP' },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true }
  });
  
  console.log(`   Anzahl: ${workshops.length}`);
  if (workshops.length > 0) {
    workshops.slice(0, 3).forEach(user => {
      console.log(`   • ${user.email}`);
    });
    if (workshops.length > 3) {
      console.log(`   ... und ${workshops.length - 3} weitere`);
    }
  }

  // 4. B24-MITARBEITER
  console.log('\n4️⃣  MITARBEITER-ACCOUNTS (B24Employee-Tabelle):');
  const employees = await prisma.b24Employee.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      emailVerified: true,
      password: true,
      position: true
    }
  });
  
  if (employees.length > 0) {
    employees.forEach(emp => {
      const hasPassword = emp.password ? '🔐 Passwort gesetzt' : '❌ KEIN Passwort';
      const verified = emp.emailVerified ? '✓' : '(unverifiziert)';
      console.log(`   ${emp.email} - ${emp.firstName} ${emp.lastName}`);
      console.log(`      ${hasPassword} ${verified} | Position: ${emp.position || 'keine'}`);
    });
  } else {
    console.log('   ❌ Keine Mitarbeiter-Accounts gefunden');
  }

  // 5. INFLUENCER
  console.log('\n5️⃣  INFLUENCER-ACCOUNTS:');
  const influencers = await prisma.influencer.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, status: true }
  });
  
  console.log(`   Anzahl: ${influencers.length}`);
  if (influencers.length > 0) {
    influencers.slice(0, 3).forEach(inf => {
      console.log(`   • ${inf.email} (${inf.status})`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n💡 HINWEIS:');
  console.log('   • Kunden/Werkstätten loggen sich über /login ein (User-Tabelle)');
  console.log('   • Mitarbeiter loggen sich AUCH über /login ein (B24Employee-Tabelle)');
  console.log('   • Mitarbeiter MÜSSEN ein Passwort haben (emailVerified=true + password)');
  console.log('   • Admin-User können AUCH als B24Employee existieren (für /admin Zugriff)');
  console.log('\n📧 Um dich als Mitarbeiter einzuloggen:');
  console.log('   1. Gehe zu /login');
  console.log('   2. Nutze die E-Mail des B24Employee (mit Passwort)');
  console.log('   3. Nach Login: Zugriff auf /mitarbeiter Portal');

  await prisma.$disconnect();
}

checkAccounts();
