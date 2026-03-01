const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMuller() {
  try {
    const users = await prisma.user.findMany({
      where: {role: 'WORKSHOP'},
      include: {workshop: true}
    });
    
    const muller = users.find(u => u.workshop?.companyName?.includes('Müller'));
    
    if (muller) {
      console.log(JSON.stringify({
        email: muller.email,
        userStreet: muller.street,
        userZip: muller.zipCode,
        userCity: muller.city,
        userLat: muller.latitude,
        userLon: muller.longitude,
        companyName: muller.workshop.companyName,
        workshopLat: muller.workshop.latitude,
        workshopLon: muller.workshop.longitude,
        status: muller.workshop.status
      }, null, 2));
    } else {
      console.log('Müller Werkstatt nicht gefunden');
    }
  } catch (error) {
    console.error('Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkMuller();
