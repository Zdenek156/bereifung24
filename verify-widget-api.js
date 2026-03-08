const { PrismaClient } = require('@prisma/client');
const http = require('http');
const prisma = new PrismaClient();

async function main() {
  const ws = await prisma.workshop.findFirst({
    where: { companyName: { contains: 'Müller' } },
    select: { id: true }
  });
  
  const url = `http://localhost:3000/api/widget/${ws.id}`;
  
  http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const json = JSON.parse(data);
      console.log('Workshop:', json.name);
      console.log('profileUrl:', json.profileUrl);
      console.log('bookingUrl:', json.bookingUrl);
      console.log('Services:');
      json.services.forEach(s => {
        console.log(`  ${s.type} | ${s.label} | detail: "${s.detail || ''}" | ${s.price} EUR`);
      });
      prisma.$disconnect();
    });
  });
}

main();
