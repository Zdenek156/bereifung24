const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function createTable() {
  try {
    const sql = fs.readFileSync('/tmp/create-weather-alerts-table.sql', 'utf8');
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ weather_alerts table created successfully!');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTable();
