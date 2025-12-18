const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const customerId = 'cmi99vhg'; // zdenek156@gmail.com
    
    const allRequests = await prisma.tireRequest.findMany({
      where: { customerId },
      select: { id: true, status: true, createdAt: true }
    });
    
    console.log(`Gesamt: ${allRequests.length} Anfragen`);
    
    const statusCounts = {};
    allRequests.forEach(req => {
      statusCounts[req.status] = (statusCounts[req.status] || 0) + 1;
    });
    
    console.log('\nStatus-Übersicht:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    // Check offers
    const offers = await prisma.offer.findMany({
      where: { 
        tireRequest: { customerId }
      },
      select: { id: true, tireRequestId: true }
    });
    
    console.log(`\nAngebote: ${offers.length}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
