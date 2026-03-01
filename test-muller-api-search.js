const fetch = require('node-fetch')

async function testMullerSearch() {
  console.log('🔍 Testing Müller Reifenservice tire search via API...\n')

  // Müller's coordinates (Winterberg)
  const searchBody = {
    serviceType: 'TIRE_CHANGE',
    packageTypes: ['four_tires', 'with_disposal'],
    radiusKm: 25,
    customerLat: 51.1953,
    customerLon: 8.5320,
    includeTires: true,
    tireDimensions: {
      width: 225,
      height: 45,
      diameter: 17
    },
    tireFilters: {
      minPrice: 50,
      maxPrice: 500,
      seasons: ['s'],
      quality: undefined,
      minFuelEfficiency: undefined,
      minWetGrip: undefined,
      threePMSF: undefined,
      showDOTTires: false
    }
  }

  console.log('📤 Request body:', JSON.stringify(searchBody, null, 2))
  
  try {
    const response = await fetch('http://localhost:3000/api/customer/direct-booking/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchBody)
    })

    const result = await response.json()
    
    console.log('\n📥 Response status:', response.status)
    console.log('📊 Result summary:', {
      success: result.success,
      workshopsCount: result.workshops?.length || 0,
      error: result.error
    })

    if (result.workshops && result.workshops.length > 0) {
      // Find Müller
      const muller = result.workshops.find(w => w.name?.includes('Müller'))
      
      if (muller) {
        console.log('\n✅ MÜLLER GEFUNDEN:')
        console.log('   - Name:', muller.name)
        console.log('   - Tire Recommendations:', muller.tireRecommendations?.length || 0)
        console.log('   - Total Price:', muller.totalPrice)
        console.log('   - Base Price:', muller.basePrice)
        
        if (muller.tireRecommendations && muller.tireRecommendations.length > 0) {
          console.log('\n🔧 Erste 3 Reifen:')
          muller.tireRecommendations.slice(0, 3).forEach((tire, idx) => {
            console.log(`   ${idx + 1}. ${tire.tire.brand} ${tire.tire.model} - €${tire.tire.sellingPrice}`)
          })
        } else {
          console.log('\n⚠️ KEINE REIFEN-EMPFEHLUNGEN!')
        }
      } else {
        console.log('\n❌ MÜLLER NICHT IN ERGEBNISSEN!')
        console.log('   Gefundene Werkstätten:', result.workshops.map(w => w.name))
      }
    } else {
      console.log('\n❌ KEINE WERKSTÄTTEN GEFUNDEN')
      console.log('   Error:', result.error)
    }
  } catch (error) {
    console.error('\n❌ Request failed:', error.message)
  }
}

testMullerSearch()
