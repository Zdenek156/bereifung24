const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const ws = await p.workshop.findUnique({
    where: { id: 'cml3g7rxd000ckeyn9ypqgg65' },
    select: { name: true, openingHours: true, calendarMode: true, state: true, zipCode: true, city: true }
  });
  console.log('Workshop:', ws.name, '| State:', ws.state, '| ZIP:', ws.zipCode, '| City:', ws.city);
  console.log('Calendar mode:', ws.calendarMode);
  console.log('Opening hours:', ws.openingHours);
  
  const emps = await p.employee.findMany({
    where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' },
    select: { name: true, workingHours: true }
  });
  emps.forEach(e => {
    console.log('Employee:', e.name, '| workingHours:', e.workingHours);
  });
  
  await p.$disconnect();
})();
