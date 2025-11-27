const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function migrate() {
  try {
    const sql = fs.readFileSync('/tmp/migration_service_packages.sql', 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await prisma.$executeRawUnsafe(statement);
      }
    }
    
    console.log('✅ Migration erfolgreich abgeschlossen!');
  } catch (error) {
    console.error('❌ Migration fehlgeschlagen:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
