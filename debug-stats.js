const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Finde den Kunden mit Email
    const user = await prisma.user.findFirst({
      where: { email: 'zdenekkyzlink@gmail.com' }
    });
    
    if (!user) {
      console.log('User nicht gefunden');
      return;
    }
    
    const customer = await prisma.customer.findUnique({
      where: { userId: user.id }
    });
    
    if (!customer) {
      console.log('Customer nicht gefunden');
      return;
    }
    
    console.log('Customer ID:', customer.id);
    
    // Alle TireRequests für diesen Kunden
    const allRequests = await prisma.tireRequest.findMany({
      where: { customerId: customer.id },
      select: { id: true, status: true, createdAt: true }
    });
    
    console.log('\nAlle TireRequests:');
    console.log(JSON.stringify(allRequests, null, 2));
    
    // Zähle nach Status
    const statusCounts = {};
    allRequests.forEach(req => {
      statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
    });
    
    console.log('\nStatus-Übersicht:');
    console.log(JSON.stringify(statusCounts, null, 2));
    
    // Aktuelle Statistiken berechnen
    const openRequests = await prisma.tireRequest.count({
      where: { customerId: customer.id, status: 'OPEN' }
    });
    
    const receivedOffers = await prisma.tireRequest.count({
      where: { customerId: customer.id, status: 'OFFERS_RECEIVED' }
    });
    
    const upcomingAppointments = await prisma.booking.count({
      where: {
        tireRequest: { customerId: customer.id },
        status: { in: ['CONFIRMED', 'PENDING'] },
        appointmentDate: { gte: new Date() }
      }
    });
    
    console.log('\nBerechnete Stats:');
    console.log({
      openRequests,
      receivedOffers,
      upcomingAppointments,
      total: openRequests + receivedOffers + upcomingAppointments
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
