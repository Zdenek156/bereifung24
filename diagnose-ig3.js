const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const GRAPH_API = 'https://graph.facebook.com/v21.0';

async function main() {
  try {
    const fb = await prisma.socialMediaAccount.findFirst({ where: { platform: 'FACEBOOK', isActive: true }});
    const token = fb.accessToken;

    // 1. Welche Seite gehört zum Token?
    console.log('=== Page vom Token ===');
    const me = await (await fetch(`${GRAPH_API}/me?fields=id,name,category&access_token=${encodeURIComponent(token)}`)).json();
    console.log('Page:', me.name, '(ID:', me.id + ')');

    // 2. Hat die Page einen verknüpften Instagram Business Account?
    console.log('\n=== Instagram-Verknüpfung der PAGE ===');
    const page = await (await fetch(`${GRAPH_API}/${me.id}?fields=instagram_business_account{id,username,name}&access_token=${encodeURIComponent(token)}`)).json();
    if (page.instagram_business_account?.username) {
      console.log('✅ VERKNÜPFT:', page.instagram_business_account.username, '(ID:', page.instagram_business_account.id + ')');
    } else {
      console.log('❌ NICHT VERKNÜPFT! instagram_business_account gibt keine IG-Daten zurück.');
      console.log('   RAW:', JSON.stringify(page));
    }

    // 3. User-Token prüfen: Welcher User steht hinter dem Token?
    console.log('\n=== Token Debug Info ===');
    const debug = await (await fetch(`${GRAPH_API}/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`)).json();
    console.log('Token-Typ:', debug.data?.type);
    console.log('User-ID:', debug.data?.user_id);
    console.log('Page-ID:', debug.data?.profile_id);

    // 4. Versuche mit User-ID die Instagram-Accounts zu holen
    if (debug.data?.user_id) {
      console.log('\n=== User-Instagram-Accounts ===');
      const userPages = await (await fetch(`${GRAPH_API}/${debug.data.user_id}/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`)).json();
      console.log('RAW:', JSON.stringify(userPages).substring(0, 500));
    }

    // 5. Prüfe welche Pages der User verwaltet
    console.log('\n=== Alle Pages des Users (via me/accounts) ===');
    // Ein Page-Token kann /me/accounts nicht aufrufen, aber User-Token schon
    // Wir versuchen es trotzdem
    const pages = await (await fetch(`${GRAPH_API}/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${encodeURIComponent(token)}`)).json();
    if (pages.data) {
      pages.data.forEach(p => {
        const ig = p.instagram_business_account ? `→ IG: ${p.instagram_business_account.username} (${p.instagram_business_account.id})` : '→ KEIN IG verknüpft';
        console.log(`  ${p.name} (${p.id}) ${ig}`);
      });
    } else {
      console.log('  Page-Token hat keinen Zugriff auf /me/accounts');
      console.log('  RAW:', JSON.stringify(pages).substring(0, 200));
    }

    console.log('\n=== ZUSAMMENFASSUNG ===');
    console.log('Das Problem: Instagram @bereifung24 ist mit dem');
    console.log('PERSÖNLICHEN Facebook-Profil verknüpft, nicht mit');
    console.log('der Facebook-SEITE "Bereifung24".');
    console.log('');
    console.log('Lösung: Instagram-App → Einstellungen → Konto →');
    console.log('"Verknüpfte Konten" → Facebook → Seite "Bereifung24" auswählen');

  } catch (err) { console.error('FEHLER:', err); }
  finally { await prisma.$disconnect(); }
}
main();
