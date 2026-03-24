const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const ws = await p.workshop.findUnique({
    where: { id: 'cml3g7rxd000ckeyn9ypqgg65' },
    select: { openingHours: true, calendarMode: true }
  });
  console.log('Calendar mode:', ws.calendarMode);
  console.log('Opening hours raw:', ws.openingHours);
  if (ws.openingHours) {
    let h = JSON.parse(ws.openingHours);
    if (typeof h === 'string') h = JSON.parse(h);
    console.log('Opening hours parsed:', JSON.stringify(h, null, 2));
  }
  
  const emps = await p.employee.findMany({
    where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' },
    select: { name: true, workingHours: true }
  });
  emps.forEach(e => {
    let wh = e.workingHours;
    if (wh) {
      let h = JSON.parse(wh);
      if (typeof h === 'string') h = JSON.parse(h);
      console.log('Employee', e.name, 'working hours:', JSON.stringify(h, null, 2));
    }
  });

  const user = await p.user.findFirst({
    where: { workshop: { id: 'cml3g7rxd000ckeyn9ypqgg65' } },
    select: { zipCode: true, city: true }
  });
  console.log('User ZIP:', user?.zipCode, '| City:', user?.city);
  
  await p.$disconnect();
})();
