const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testEPRELKey() {
  try {
    // Get API key from database
    const setting = await prisma.adminApiSetting.findUnique({
      where: { key: 'EPREL_API_KEY' }
    })

    if (!setting || !setting.value) {
      console.log('❌ Kein EPREL API-Key in der Datenbank gefunden')
      await prisma.$disconnect()
      return
    }

    console.log('✓ API-Key aus Datenbank geladen')

    // Test mit einem bekannten Reifen (z.B. Continental)
    const testUrl = 'https://eprel.ec.europa.eu/api/products/tyres'
    
    console.log('\n🔍 Teste EPREL API mit Key...\n')

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'x-api-key': setting.value,
        'Accept': 'application/json'
      }
    })

    console.log(`Status: ${response.status} ${response.statusText}`)

    if (response.ok) {
      const data = await response.json()
      console.log('\n✅ API-Key funktioniert!')
      console.log(`Anzahl Produkte gefunden: ${data.results?.length || 0}`)
      
      if (data.results && data.results.length > 0) {
        console.log('\nBeispiel-Produkt:')
        const firstProduct = data.results[0]
        console.log(`- Hersteller: ${firstProduct.supplierName || 'N/A'}`)
        console.log(`- Modell: ${firstProduct.productModelName || 'N/A'}`)
        console.log(`- Registration: ${firstProduct.registrationNumber || 'N/A'}`)
      }
    } else {
      const errorText = await response.text()
      console.log('\n❌ API-Key funktioniert nicht!')
      console.log('Fehler:', errorText.substring(0, 200))
    }

  } catch (error) {
    console.error('❌ Fehler beim Testen:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testEPRELKey()
