const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check if legal-texts application already exists
  const existing = await prisma.application.findFirst({
    where: { key: 'legal-texts' }
  });
  
  if (existing) {
    console.log('Application legal-texts already exists:', existing.id);
    return;
  }
  
  // Get a sample application to understand the structure
  const sample = await prisma.application.findFirst({
    where: { key: 'blog' }
  });
  console.log('Sample app (blog):', JSON.stringify(sample, null, 2));
  
  // Create the legal-texts application
  const app = await prisma.application.create({
    data: {
      name: 'Rechtliche Texte',
      key: 'legal-texts',
      description: 'AGB, Impressum und Datenschutz verwalten',
      icon: 'Scale',
      adminRoute: '/admin/legal-texts',
      color: 'blue',
      sortOrder: 90,
      isActive: true,
      category: 'System',
    }
  });
  
  console.log('Created application:', app.id, app.name);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
