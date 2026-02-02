const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkToken() {
  try {
    const apiSetting = await prisma.adminApiSetting.findUnique({
      where: { key: 'GOCARDLESS_ACCESS_TOKEN' }
    });
    
    if (!apiSetting || !apiSetting.value) {
      console.log('❌ GOCARDLESS_ACCESS_TOKEN nicht in Datenbank gefunden');
      return;
    }
    
    const token = apiSetting.value;
    console.log('✅ GoCardless Token gefunden:');
    console.log('   Länge:', token.length, 'Zeichen');
    console.log('   Erste 8 Zeichen:', token.substring(0, 8) + '...');
    console.log('   Letzte 4 Zeichen: ...' + token.substring(token.length - 4));
    console.log('   Aktualisiert am:', apiSetting.updatedAt);
    
    // Test API Call mit Token (nur zum Testen der Gültigkeit)
    const gocardless = require('gocardless-nodejs');
    const constants = require('gocardless-nodejs/constants');
    
    try {
      const client = gocardless(token, constants.Environments.Live);
      // Simple API Call zum Testen
      await client.mandates.list({ limit: 1 });
      console.log('\n✅ Token ist GÜLTIG - API-Call erfolgreich');
    } catch (apiError) {
      console.log('\n❌ Token ist UNGÜLTIG oder WIDERRUFEN');
      console.log('   Fehler:', apiError.message);
      if (apiError.response?.body?.error) {
        console.log('   API Error Code:', apiError.response.body.error.code);
        console.log('   API Error Type:', apiError.response.body.error.type);
      }
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkToken();
