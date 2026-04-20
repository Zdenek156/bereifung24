const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.invoiceSettings.findUnique({ where: { id: 'default-settings' } }).then(r => {
  console.log(JSON.stringify(r, null, 2));
  p.$disconnect();
});
