const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.commissionInvoice.findMany({
  take: 5,
  orderBy: { createdAt: 'desc' },
  select: { id: true, invoiceNumber: true, pdfUrl: true, status: true }
}).then(r => {
  console.log(JSON.stringify(r, null, 2));
  p.$disconnect();
});
