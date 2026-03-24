const http = require('http');
const dates = [
  '2026-03-28', // Samstag
  '2026-04-03', // Karfreitag (NW Feiertag)
  '2026-04-04', // Samstag
  '2026-04-06', // Ostermontag
  '2026-04-07', // Dienstag
  '2026-05-01', // Tag der Arbeit
  '2026-05-14', // Christi Himmelfahrt
  '2026-05-25', // Pfingstmontag
  '2026-06-04', // Fronleichnam (NW Feiertag)
  '2026-10-03', // Tag der Deutschen Einheit
  '2026-11-01', // Allerheiligen (NW Feiertag)
  '2026-12-25', // 1. Weihnachtstag
];

async function check(date) {
  return new Promise((resolve) => {
    const url = `http://localhost:3000/api/gcal/available-slots?workshopId=cml3g7rxd000ckeyn9ypqgg65&date=${date}&duration=60`;
    http.get(url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const dayName = new Date(date).toLocaleDateString('de-DE', { weekday: 'short' });
          const slots = j.availableSlots ? j.availableSlots.length : 0;
          const msg = j.message || '';
          console.log(`${date} (${dayName}): status=${res.statusCode} slots=${slots} ${msg}`);
        } catch(e) {
          console.log(`${date}: PARSE ERROR`);
        }
        resolve();
      });
    }).on('error', (e) => { console.log(`${date}: ERROR:`, e.message); resolve(); });
  });
}

(async () => {
  for (const d of dates) {
    await check(d);
  }
})();
