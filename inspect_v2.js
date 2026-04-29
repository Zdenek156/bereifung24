const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.directBooking.findUnique({
  where: { id: 'cmmcubg1k000cz8hogg173173' },
  include: { vehicle: true }
}).then(b => { console.log(JSON.stringify(b, null, 2)); process.exit(0); });
