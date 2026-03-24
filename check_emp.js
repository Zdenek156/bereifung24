const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const emps = await p.employee.findMany({
    where: { workshopId: 'cml3g7rxd000ckeyn9ypqgg65' },
    select: { id: true, name: true, googleCalendarId: true, googleRefreshToken: true, googleAccessToken: true, googleTokenExpiry: true, workingHours: true }
  });
  emps.forEach(e => {
    console.log(e.name);
    console.log('  calendarId:', e.googleCalendarId ? 'YES' : 'NO');
    console.log('  refreshToken:', e.googleRefreshToken ? 'YES' : 'NO');
    console.log('  accessToken:', e.googleAccessToken ? 'YES' : 'NO');
    console.log('  tokenExpiry:', e.googleTokenExpiry);
    let wh = e.workingHours;
    if (wh) {
      let h = JSON.parse(wh);
      if (typeof h === 'string') h = JSON.parse(h);
      console.log('  saturday:', JSON.stringify(h.saturday));
    }
  });
  await p.$disconnect();
})();
