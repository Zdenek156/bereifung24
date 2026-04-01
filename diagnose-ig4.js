const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const fb = await prisma.socialMediaAccount.findFirst({ where: { platform: 'FACEBOOK', isActive: true }});
    const token = fb.accessToken;

    // 1. Token-Scopes prüfen
    console.log('=== TOKEN SCOPES ===');
    const debug = await (await fetch(`https://graph.facebook.com/v21.0/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`)).json();
    const scopes = debug.data?.scopes || [];
    console.log('Vorhandene Scopes:', scopes.join(', '));
    
    // Prüfe kritische fehlende Scopes
    const needed = ['instagram_basic', 'instagram_business_basic', 'instagram_content_publish', 'pages_show_list', 'pages_manage_posts'];
    needed.forEach(s => {
      const has = scopes.includes(s);
      console.log(`  ${has ? '✅' : '❌'} ${s}`);
    });

    // 2. App-Info prüfen
    console.log('\n=== APP STATUS ===');
    const appId = debug.data?.app_id;
    console.log('App-ID:', appId);
    console.log('Token-Typ:', debug.data?.type);
    console.log('is_valid:', debug.data?.is_valid);
    
    // 3. Granular Scopes - zeigt exakt welche Berechtigungen für welche IDs
    console.log('\n=== GRANULAR SCOPES (Detail) ===');
    debug.data?.granular_scopes?.forEach(s => {
      console.log(`  ${s.scope}:`);
      console.log(`    target_ids: [${(s.target_ids || []).join(', ')}]`);
    });

    // 4. Teste verschiedene API-Versionen
    console.log('\n=== API VERSION TEST ===');
    for (const ver of ['v18.0', 'v19.0', 'v20.0', 'v21.0', 'v22.0']) {
      const r = await (await fetch(`https://graph.facebook.com/${ver}/${fb.pageId}?fields=instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`)).json();
      const igba = r.instagram_business_account;
      if (igba?.username) {
        console.log(`  ${ver}: ✅ instagram_business_account = ${igba.username} (${igba.id})`);
      } else {
        console.log(`  ${ver}: ❌ Kein IG-Account (Response: ${JSON.stringify(r).substring(0, 80)})`);
      }
    }

    // 5. Permissions-Check (welche wurden granted, welche declined?)
    console.log('\n=== PERMISSIONS STATUS ===');
    const permsR = await (await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(token)}`)).json();
    if (permsR.data) {
      permsR.data.forEach(p => {
        const icon = p.status === 'granted' ? '✅' : '❌';
        console.log(`  ${icon} ${p.permission}: ${p.status}`);
      });
    } else {
      // Page-Token: Versuche über User-ID
      console.log('  Page-Token hat kein /me/permissions - versuche via User-ID...');
      const userId = debug.data?.user_id;
      if (userId) {
        const perms2 = await (await fetch(`https://graph.facebook.com/v21.0/${userId}/permissions?access_token=${encodeURIComponent(token)}`)).json();
        if (perms2.data) {
          perms2.data.forEach(p => {
            const icon = p.status === 'granted' ? '✅' : '❌';
            console.log(`  ${icon} ${p.permission}: ${p.status}`);
          });
        } else {
          console.log('  Auch über User-ID nicht möglich:', JSON.stringify(perms2).substring(0, 150));
        }
      }
    }

    // 6. Versuche direkt die Instagram Business Discovery (anderer Weg)
    console.log('\n=== INSTAGRAM BUSINESS DISCOVERY ===');
    // Wenn wir irgendeine gültige IG-ID hätten, könnten wir business_discovery nutzen
    const igIds = ['17841462799004638'];
    for (const igId of igIds) {
      const r = await (await fetch(`https://graph.facebook.com/v21.0/${igId}?fields=id,username,name,biography,ig_id,followers_count,media_count&access_token=${encodeURIComponent(token)}`)).json();
      console.log(`  ${igId}:`, JSON.stringify(r).substring(0, 200));
    }

    // 7. NEUE API: Instagram Business Login 
    console.log('\n=== FAZIT & NÄCHSTE SCHRITTE ===');
    if (!scopes.includes('instagram_basic')) {
      console.log('⚠️  FEHLT: instagram_basic');
      console.log('   → Neuen Token generieren MIT instagram_basic Permission!');
    }
    console.log('');
    console.log('Falls das nicht hilft:');
    console.log('1. App ist im Development-Modus → Instagram-Tester prüfen');
    console.log('2. Oder: Neue Instagram Business Login API verwenden');
    console.log('   (nutzt instagram_business_content_publish statt instagram_content_publish)');

  } catch (err) { console.error('FEHLER:', err); }
  finally { await prisma.$disconnect(); }
}
main();
