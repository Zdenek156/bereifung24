const { PrismaClient } = require('@prisma/client')
const AdmZip = require('adm-zip')

const prisma = new PrismaClient()

async function debugEPREL() {
  try {
    console.log('[EPREL Debug] Analyzing EPREL data structure...\n')

    // Get API key
    const setting = await prisma.adminApiSetting.findUnique({
      where: { key: 'EPREL_API_KEY' }
    })
    
    if (!setting || !setting.value) {
      throw new Error('EPREL API Key nicht gefunden')
    }

    // Download ZIP
    console.log('[EPREL Debug] Downloading ZIP...')
    const response = await fetch('https://eprel.ec.europa.eu/api/exportProducts/tyres', {
      headers: {
        'X-Api-Key': setting.value,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const buffer = await response.arrayBuffer()
    console.log(`[EPREL Debug] Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB\n`)

    // Extract ZIP
    const zip = new AdmZip(Buffer.from(buffer))
    const entries = zip.getEntries()

    console.log(`[EPREL Debug] ZIP contains ${entries.length} files:\n`)
    entries.forEach(entry => {
      console.log(`  - ${entry.entryName} (${(entry.header.size / 1024).toFixed(2)} KB)`)
    })

    // Get first JSON file
    const jsonEntry = entries.find(e => e.entryName.endsWith('.json'))
    if (!jsonEntry) {
      throw new Error('No JSON file found in ZIP')
    }

    console.log(`\n[EPREL Debug] Analyzing ${jsonEntry.entryName}...\n`)
    
    const jsonContent = jsonEntry.getData().toString('utf8')
    const tires = JSON.parse(jsonContent)

    if (!Array.isArray(tires)) {
      console.log('[EPREL Debug] Data is not an array!')
      console.log('Type:', typeof tires)
      console.log('Keys:', Object.keys(tires))
      return
    }

    console.log(`[EPREL Debug] Found ${tires.length} tires\n`)

    // Show first 3 tires
    console.log('[EPREL Debug] First 3 tire entries:\n')
    for (let i = 0; i < Math.min(3, tires.length); i++) {
      console.log(`\n=== TIRE ${i + 1} ===`)
      console.log(JSON.stringify(tires[i], null, 2))
      console.log('\n' + '='.repeat(50))
    }

    // Show all unique keys
    console.log('\n[EPREL Debug] All unique field names across first 100 tires:\n')
    const allKeys = new Set()
    for (let i = 0; i < Math.min(100, tires.length); i++) {
      Object.keys(tires[i]).forEach(key => allKeys.add(key))
    }
    console.log(Array.from(allKeys).sort().join(', '))

    // Find tires with dimension info
    console.log('\n[EPREL Debug] Looking for dimension patterns...\n')
    const dimensionExamples = []
    for (let i = 0; i < Math.min(50, tires.length); i++) {
      const tire = tires[i]
      const dimensionFields = Object.keys(tire).filter(k => 
        k.toLowerCase().includes('dimension') ||
        k.toLowerCase().includes('size') ||
        k.toLowerCase().includes('width') ||
        k.toLowerCase().includes('aspect') ||
        k.toLowerCase().includes('diameter')
      )
      
      if (dimensionFields.length > 0) {
        const example = {}
        dimensionFields.forEach(field => {
          example[field] = tire[field]
        })
        dimensionExamples.push(example)
        
        if (dimensionExamples.length >= 5) break
      }
    }

    console.log('Sample dimension data:')
    dimensionExamples.forEach((ex, i) => {
      console.log(`\nExample ${i + 1}:`, JSON.stringify(ex, null, 2))
    })

  } catch (error) {
    console.error('[EPREL Debug] Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

debugEPREL()
