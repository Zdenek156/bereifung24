const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testEPREL() {
  try {
    console.log('📡 Teste EPREL API mit echtem Key...\n')
    
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
    
    console.log(`Status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const text = await response.text()
      console.error('❌ API-Fehler:', text)
      return
    }
    
    const data = await response.json()
    
    console.log('\n📊 EPREL API Antwort:')
    console.log('Typ:', Array.isArray(data) ? 'Array' : typeof data)
    
    if (Array.isArray(data)) {
      console.log('Anzahl Reifen:', data.length)
      
      if (data.length > 0) {
        console.log('\n🔍 Erstes Reifen-Objekt (Struktur):')
        console.log(JSON.stringify(data[0], null, 2))
        
        console.log('\n🔑 Verfügbare Felder im ersten Objekt:')
        console.log(Object.keys(data[0]).join(', '))
        
        // Suche nach einem 205/55R16 Reifen
        console.log('\n🔍 Suche nach 205/55R16 Reifen...')
        const example = data.find(tire => {
          const dim = JSON.stringify(tire).toLowerCase()
          return dim.includes('205') && dim.includes('55') && dim.includes('16')
        })
        
        if (example) {
          console.log('✓ Beispiel 205/55R16 gefunden:')
          console.log(JSON.stringify(example, null, 2))
        } else {
          console.log('❌ Keine 205/55R16 Reifen gefunden')
          
          // Zeige Beispiel-Dimensionen
          console.log('\n📐 Beispiel-Dimensionen aus den Daten:')
          const dimensions = new Set()
          data.slice(0, 20).forEach(tire => {
            Object.keys(tire).forEach(key => {
              const value = tire[key]
              if (typeof value === 'string' && /\d{3}\/\d{2}/.test(value)) {
                dimensions.add(`${key}: ${value}`)
              }
            })
          })
          Array.from(dimensions).slice(0, 10).forEach(dim => console.log('  -', dim))
        }
      }
    } else {
      console.log('Struktur:', Object.keys(data))
      console.log('Daten:', JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Fehler:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testEPREL()
