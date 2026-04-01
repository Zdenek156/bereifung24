const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const GRAPH_API = 'https://graph.facebook.com/v21.0';

async function main() {
  try {
    const fb = await prisma.socialMediaAccount.findFirst({ where: { platform: 'FACEBOOK', isActive: true }});
    const ig = await prisma.socialMediaAccount.findFirst({ where: { platform: 'INSTAGRAM', isActive: true }});
    const token = fb.accessToken;

    console.log('=== 1. TOKEN-INFO ===');
    const tokenInfo = await (await fetch(`${GRAPH_API}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`)).json();
    console.log('Token-Typ:', tokenInfo.data?.type);
    console.log('App-ID:', tokenInfo.data?.app_id);
    console.log('Profil-ID:', tokenInfo.data?.profile_id);
    console.log('Läuft ab:', tokenInfo.data?.expires_at === 0 ? 'NIE' : new Date(tokenInfo.data?.expires_at * 1000).toISOString());
    console.log('Scopes:', tokenInfo.data?.scopes?.join(', '));
    console.log('Granular Scopes:');
    tokenInfo.data?.granular_scopes?.forEach(s => {
      console.log(`  ${s.scope}: targets=[${(s.target_ids || []).join(', ')}]`);
    });

    console.log('\n=== 2. PAGE-INFO ===');
    const pageInfo = await (await fetch(`${GRAPH_API}/${fb.pageId}?fields=id,name,instagram_business_account{id,username,name,profile_picture_url},page_backed_instagram_accounts{id,username},connected_instagram_accounts&access_token=${encodeURIComponent(token)}`)).json();
    console.log('Page:', pageInfo.id, pageInfo.name);
    console.log('instagram_business_account:', JSON.stringify(pageInfo.instagram_business_account));
    console.log('page_backed_instagram_accounts:', JSON.stringify(pageInfo.page_backed_instagram_accounts));
    console.log('connected_instagram_accounts:', JSON.stringify(pageInfo.connected_instagram_accounts));

    console.log('\n=== 3. ALLE IDs TESTEN ===');
    // Sammle alle möglichen IG-IDs
    const idsToTest = new Set();
    if (ig?.pageId) idsToTest.add(ig.pageId);
    if (pageInfo.instagram_business_account?.id) idsToTest.add(pageInfo.instagram_business_account.id);
    if (pageInfo.page_backed_instagram_accounts?.data) {
      pageInfo.page_backed_instagram_accounts.data.forEach(a => idsToTest.add(a.id));
    }
    // Auch die IDs aus granular_scopes testen
    const igScope = tokenInfo.data?.granular_scopes?.find(s => s.scope === 'instagram_content_publish');
    if (igScope?.target_ids) {
      igScope.target_ids.forEach(id => idsToTest.add(id));
    }
    
    console.log('Zu testende IDs:', [...idsToTest]);

    for (const testId of idsToTest) {
      console.log(`\n--- Test mit ID: ${testId} ---`);
      
      // a) Prüfe ob die ID ein IG User ist
      const info = await (await fetch(`${GRAPH_API}/${testId}?fields=id,username,name,biography,ig_id,profile_picture_url&access_token=${encodeURIComponent(token)}`)).json();
      console.log('  Info:', JSON.stringify(info).substring(0, 200));

      // b) Versuche Container zu erstellen
      const params = new URLSearchParams({
        image_url: 'https://bereifung24.de/images/logo.png',
        caption: 'Diagnose-Test',
        access_token: token
      });
      const container = await (await fetch(`${GRAPH_API}/${testId}/media`, { method: 'POST', body: params })).json();
      console.log('  Container:', JSON.stringify(container).substring(0, 200));
      
      if (container.id) {
        console.log('  ✅ CONTAINER ERSTELLT! Diese ID funktioniert!');
        // Lösche den Container (nicht publishen)
      }
    }

    console.log('\n=== 4. APP-BERECHTIGUNGEN ===');
    // Prüfe welche Permissions die App hat
    const perms = await (await fetch(`${GRAPH_API}/me/permissions?access_token=${encodeURIComponent(token)}`)).json();
    console.log('Aktive Berechtigungen:');
    perms.data?.forEach(p => {
      console.log(`  ${p.permission}: ${p.status}`);
    });

    console.log('\n=== 5. META APP STATUS ===');
    // Prüfe ob App im Development Mode ist
    const appId = tokenInfo.data?.app_id;
    if (appId) {
      const appInfo = await (await fetch(`${GRAPH_API}/${appId}?fields=name,status,category&access_token=${encodeURIComponent(token)}`)).json();
      console.log('App:', JSON.stringify(appInfo));
    }

    console.log('\n=== 6. INSTAGRAM API v21 vs v22 TEST ===');
    // Manche Features brauchen neuere API-Version
    for (const ver of ['v21.0', 'v22.0']) {
      const testId = ig?.pageId || [...idsToTest][0];
      const r = await (await fetch(`https://graph.facebook.com/${ver}/${testId}/media`, { 
        method: 'POST', 
        body: new URLSearchParams({
          image_url: 'https://bereifung24.de/images/logo.png',
          caption: 'API-Version-Test',
          access_token: token
        })
      })).json();
      console.log(`  ${ver}: ${JSON.stringify(r).substring(0, 150)}`);
    }

    console.log('\n=== 7. INSTAGRAM BUSINESS LOGIN API TEST ===');
    // Neue Instagram Business Login API nutzt andere Endpoints
    const igAppId = '2315728085587152'; // Instagram App ID aus Meta Dashboard
    console.log('Instagram App ID:', igAppId);
    console.log('Hinweis: Die neue Instagram Business Login API erfordert');
    console.log('möglicherweise einen separaten Token über Instagram OAuth.');

    console.log('\n=== DIAGNOSE ABGESCHLOSSEN ===');
  } catch (err) { console.error('FEHLER:', err); }
  finally { await prisma.$disconnect(); }
}
main();
