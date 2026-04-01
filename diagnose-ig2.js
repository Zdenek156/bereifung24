const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const GRAPH_API = 'https://graph.facebook.com/v21.0';

async function main() {
  try {
    const fb = await prisma.socialMediaAccount.findFirst({ where: { platform: 'FACEBOOK', isActive: true }});
    const ig = await prisma.socialMediaAccount.findFirst({ where: { platform: 'INSTAGRAM', isActive: true }});
    const token = fb.accessToken;
    console.log('FB pageId aus DB:', fb.pageId);
    console.log('IG pageId aus DB:', ig.pageId);

    // 1. Page Info OHNE problematische Felder (einzeln testen)
    console.log('\n=== PAGE-INFO (einfach) ===');
    const r1 = await fetch(`${GRAPH_API}/${fb.pageId}?fields=id,name&access_token=${encodeURIComponent(token)}`);
    const d1 = await r1.json();
    console.log('RAW:', JSON.stringify(d1));

    // 2. instagram_business_account separat
    console.log('\n=== instagram_business_account ===');
    const r2 = await fetch(`${GRAPH_API}/${fb.pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`);
    const d2 = await r2.json();
    console.log('RAW:', JSON.stringify(d2));

    // 3. page_backed_instagram_accounts separat
    console.log('\n=== page_backed_instagram_accounts ===');
    const r3 = await fetch(`${GRAPH_API}/${fb.pageId}?fields=page_backed_instagram_accounts&access_token=${encodeURIComponent(token)}`);
    const d3 = await r3.json();
    console.log('RAW:', JSON.stringify(d3));

    // 4. Prüfe die IG-ID aus dem Token (17841465251272531) direkt
    console.log('\n=== Token-IG-ID (17841465251272531) prüfen ===');
    const r4 = await fetch(`${GRAPH_API}/17841465251272531?access_token=${encodeURIComponent(token)}`);
    const d4 = await r4.json();
    console.log('RAW:', JSON.stringify(d4));

    // 5. Prüfe die DB-IG-ID (17841462799004638) direkt
    console.log('\n=== DB-IG-ID (17841462799004638) prüfen ===');
    const r5 = await fetch(`${GRAPH_API}/17841462799004638?access_token=${encodeURIComponent(token)}`);
    const d5 = await r5.json();
    console.log('RAW:', JSON.stringify(d5));

    // 6. Prüfe /me mit dem Token
    console.log('\n=== /me Endpoint ===');
    const r6 = await fetch(`${GRAPH_API}/me?fields=id,name&access_token=${encodeURIComponent(token)}`);
    const d6 = await r6.json();
    console.log('RAW:', JSON.stringify(d6));

    // 7. Prüfe /me/accounts (welche Pages hat der Token-User?)
    console.log('\n=== /me/accounts ===');
    const r7 = await fetch(`${GRAPH_API}/me/accounts?access_token=${encodeURIComponent(token)}`);
    const d7 = await r7.json();
    console.log('RAW:', JSON.stringify(d7));

    // 8. Versuche mit User-Token statt Page-Token
    // (Page Token -> User Token ist nicht direkt möglich, aber prüfe ob
    //  der Token als User-Token für den IG-Endpoint funktioniert)
    console.log('\n=== Teste IG Container mit ALLEN IDs ===');
    const testIds = ['17841462799004638', '17841465251272531', fb.pageId];
    for (const id of testIds) {
      const params = new URLSearchParams({
        image_url: 'https://bereifung24.de/images/logo.png',
        caption: 'Test',
        access_token: token
      });
      const r = await fetch(`${GRAPH_API}/${id}/media`, { method: 'POST', body: params });
      const d = await r.json();
      const short = JSON.stringify(d).substring(0, 120);
      console.log(`  ${id}: ${short}`);
    }

    // 9. Prüfe ob die Bild-URL erreichbar ist
    console.log('\n=== Bild-URL prüfen ===');
    try {
      const imgR = await fetch('https://bereifung24.de/images/logo.png', { method: 'HEAD' });
      console.log('Status:', imgR.status, imgR.statusText);
      console.log('Content-Type:', imgR.headers.get('content-type'));
      console.log('Content-Length:', imgR.headers.get('content-length'));
    } catch(e) {
      console.log('Bild nicht erreichbar:', e.message);
    }

    // 10. Prüfe ob das Problem am Bild liegt - teste mit externem Bild
    console.log('\n=== Test mit externem Bild (Wikipedia) ===');
    const extParams = new URLSearchParams({
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/320px-Camponotus_flavomarginatus_ant.jpg',
      caption: 'Test mit externem Bild',
      access_token: token
    });
    const extR = await (await fetch(`${GRAPH_API}/17841462799004638/media`, { method: 'POST', body: extParams })).json();
    console.log('RAW:', JSON.stringify(extR).substring(0, 200));

    console.log('\n=== DIAGNOSE FERTIG ===');
  } catch (err) { console.error('FEHLER:', err); }
  finally { await prisma.$disconnect(); }
}
main();
