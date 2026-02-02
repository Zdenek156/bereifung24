const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Finde Werkstatt von Otto Springer
    const workshop = await prisma.workshop.findFirst({
      where: {
        companyName: {
          contains: 'Springer'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            street: true,
            zipCode: true,
            city: true,
            latitude: true,
            longitude: true
          }
        },
        workshopServices: {
          where: {
            isActive: true
          },
          select: {
            serviceType: true,
            isActive: true
          }
        }
      }
    });
    
    if (workshop) {
      console.log('============================================');
      console.log('Werkstatt gefunden:');
      console.log('============================================');
      console.log('Name:', workshop.companyName);
      console.log('Email:', workshop.user.email);
      console.log('Adresse:', workshop.user.street, ',', workshop.user.zipCode, workshop.user.city);
      console.log('Koordinaten:', workshop.user.latitude, '/', workshop.user.longitude);
      console.log('\nKonfigurierte Services:');
      if (workshop.workshopServices.length === 0) {
        console.log('  ⚠️  KEINE SERVICES KONFIGURIERT!');
      } else {
        workshop.workshopServices.forEach(s => console.log('  ✓', s.serviceType));
      }
      console.log('');
    } else {
      console.log('Werkstatt nicht gefunden!');
    }
    
    await prisma.$disconnect();
  } catch (e) {
    console.error('Fehler:', e.message);
    process.exit(1);
  }
})();
