const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.landingPage.findMany({ select: { slug: true, isActive: true }, orderBy: { slug: 'asc' } }).then(r => {
  r.forEach(x => console.log(x.slug, x.isActive));
  return p.$disconnect();
});
