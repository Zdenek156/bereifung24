const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testEPREL() {
  try {
    console.log('📡 Teste EPREL API Header und Response Type...\n')
    
    // Hole API-Key aus Datenbank
    const setting = await prisma.adminApiSetting.findUnique({
      where: { key: 'EPREL_API_KEY' }
    })
    
    if (!setting || !setting.value) {
      console.error('❌ EPREL API Key nicht in Datenbank gefunden')
      return
    }
    
    console.log('✓ API-Key aus Datenbank geladen\n')
    
    // Teste EPREL API
    const response = await fetch('https://eprel.ec.europa.eu/api/exportProducts/tyres', {
      headers: {
        'X-Api-Key': setting.value,
        'Accept': 'application/json'
      }
    })
    
    console.log(`Status: ${response.status} ${response.statusText}\n`)
    
    // Zeige Response Headers
    console.log('📋 Response Headers:')
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
    
    console.log('\n📦 Content-Type:', response.headers.get('content-type'))
    console.log('📏 Content-Length:', response.headers.get('content-length'))
    console.log('📎 Content-Disposition:', response.headers.get('content-disposition'))
    
    // Lese ersten Teil des Body
    const buffer = await response.arrayBuffer()
    const uint8 = new Uint8Array(buffer)
    
    console.log('\n🔢 Erste 100 Bytes (Hex):')
    const hex = Array.from(uint8.slice(0, 100))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
    console.log(hex)
    
    console.log('\n📝 Erste 100 Bytes (Text):')
    const text = Array.from(uint8.slice(0, 100))
      .map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.')
      .join('')
    console.log(text)
    
    // Prüfe auf ZIP signature (PK)
    if (uint8[0] === 0x50 && uint8[1] === 0x4B) {
      console.log('\n🗜️  Response ist eine ZIP-Datei!')
    } else if (uint8[0] === 0x7B || uint8[0] === 0x5B) {
      console.log('\n📄 Response ist JSON')
    } else {
      console.log('\n❓ Unbekanntes Format')
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testEPREL()
