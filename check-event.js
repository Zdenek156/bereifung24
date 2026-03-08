const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  const w = await p.workshop.findFirst({ where: { companyName: 'Luxus24' } });
  console.log('Calendar:', w.googleCalendarId);
  const o = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  o.setCredentials({ refresh_token: w.googleRefreshToken, access_token: w.googleAccessToken });
  const c = google.calendar({ version: 'v3', auth: o });
  
  // Check the new event
  try {
    const e = await c.events.get({ calendarId: w.googleCalendarId, eventId: 'ikicujoqmvku8ltb2uufh6qmeo' });
    console.log('NEW Event:');
    console.log('  Summary:', e.data.summary);
    console.log('  Start:', JSON.stringify(e.data.start));
    console.log('  End:', JSON.stringify(e.data.end));
    console.log('  Status:', e.data.status);
  } catch (err) {
    console.log('Error fetching new event:', err.message);
  }

  // Check the old event too
  try {
    const e2 = await c.events.get({ calendarId: w.googleCalendarId, eventId: 'r740uh8fpvv5o0todbbr34m2kg' });
    console.log('OLD Event:');
    console.log('  Summary:', e2.data.summary);
    console.log('  Start:', JSON.stringify(e2.data.start));
    console.log('  End:', JSON.stringify(e2.data.end));
    console.log('  Status:', e2.data.status);
  } catch (err) {
    console.log('Error fetching old event:', err.message);
  }

  await p.$disconnect();
})();
