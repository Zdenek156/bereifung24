const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const lp = await p.workshopLandingPage.findUnique({
    where: { slug: "test" },
    select: { workshopId: true, isActive: true }
  });
  if (!lp) { console.log("No landing page with slug 'test'"); return; }
  console.log("Landing Page:", JSON.stringify(lp, null, 2));

  const w = await p.workshop.findUnique({
    where: { id: lp.workshopId },
    select: {
      id: true, companyName: true, isVerified: true,
      stripeEnabled: true, stripeAccountId: true,
      googleCalendarId: true, latitude: true, longitude: true
    }
  });
  console.log("Workshop:", JSON.stringify(w, null, 2));

  const emps = await p.employee.findMany({
    where: { workshopId: lp.workshopId },
    select: { id: true, firstName: true, googleCalendarId: true }
  });
  console.log("Employees:", JSON.stringify(emps, null, 2));

  const svcs = await p.workshopService.findMany({
    where: { workshopId: lp.workshopId },
    select: { serviceType: true, isActive: true, allowsDirectBooking: true, acceptsMountingOnly: true }
  });
  console.log("Services:", JSON.stringify(svcs, null, 2));

  await p.$disconnect();
})();
