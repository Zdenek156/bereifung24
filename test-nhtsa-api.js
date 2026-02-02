// Test NHTSA API to see what data we get

async function testNHTSA() {
  console.log('🔍 Testing NHTSA API - VIN Lookup\n')
  
  // Test 1: VIN Lookup (BMW from earlier)
  const testVIN = 'WBAWY710500C9B457'
  console.log(`Testing VIN: ${testVIN}`)
  console.log('='.repeat(80))
  
  try {
    const vinResponse = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${testVIN}?format=json`
    )
    const vinData = await vinResponse.json()
    
    if (vinData.Results && vinData.Results[0]) {
      const vehicle = vinData.Results[0]
      
      console.log('\n📋 AVAILABLE FIELDS:')
      console.log('='.repeat(80))
      
      // Important fields for vehicle management
      const importantFields = [
        'Make',
        'Model', 
        'ModelYear',
        'VIN',
        'FuelTypePrimary',
        'FuelTypeSecondary',
        'EngineModel',
        'EngineConfiguration',
        'EngineCylinders',
        'EngineHP',
        'EngineKW',
        'DisplacementL',
        'DisplacementCC',
        'TransmissionStyle',
        'TransmissionSpeeds',
        'DriveType',
        'BodyClass',
        'Doors',
        'PlantCity',
        'PlantCountry',
        'VehicleType',
        'Trim',
        'Series',
        'GVWR',
        'CurbWeightLB',
        'WheelBaseType',
        'WheelBaseLong',
        'WheelBaseShort',
        'TrackWidth',
        'ElectrificationLevel',
        'BatteryType',
        'BatteryKWh'
      ]
      
      importantFields.forEach(field => {
        const value = vehicle[field]
        if (value && value !== '' && value !== 'Not Applicable') {
          console.log(`  ${field.padEnd(30)} : ${value}`)
        }
      })
      
      console.log('\n')
      console.log('='.repeat(80))
      console.log('📊 ALL FIELDS (including empty):')
      console.log('='.repeat(80))
      console.log(JSON.stringify(vehicle, null, 2))
    }
  } catch (error) {
    console.error('❌ VIN Lookup Error:', error.message)
  }
  
  console.log('\n\n')
  console.log('='.repeat(80))
  console.log('🔍 Testing NHTSA API - Make/Model Search')
  console.log('='.repeat(80))
  
  // Test 2: Get Models for Make
  try {
    console.log('\nGetting models for BMW...')
    const modelsResponse = await fetch(
      'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/BMW?format=json'
    )
    const modelsData = await modelsResponse.json()
    
    if (modelsData.Results && modelsData.Results.length > 0) {
      console.log(`\n✅ Found ${modelsData.Results.length} BMW models`)
      console.log('\nFirst 10 models:')
      modelsData.Results.slice(0, 10).forEach(model => {
        console.log(`  - ${model.Model_Name} (ID: ${model.Model_ID})`)
      })
    }
  } catch (error) {
    console.error('❌ Models Search Error:', error.message)
  }
  
  console.log('\n\n')
  console.log('='.repeat(80))
  console.log('🔍 Testing NHTSA API - Make/Model/Year Search')
  console.log('='.repeat(80))
  
  // Test 3: Get Models for Make and Year
  try {
    console.log('\nGetting BMW models for year 2020...')
    const yearModelsResponse = await fetch(
      'https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMakeYear/make/BMW/modelyear/2020?format=json'
    )
    const yearModelsData = await yearModelsResponse.json()
    
    if (yearModelsData.Results && yearModelsData.Results.length > 0) {
      console.log(`\n✅ Found ${yearModelsData.Results.length} BMW models for 2020`)
      console.log('\nFirst 10 models:')
      yearModelsData.Results.slice(0, 10).forEach(model => {
        console.log(`  - ${model.Model_Name} (Make: ${model.Make_Name})`)
      })
    }
  } catch (error) {
    console.error('❌ Year Models Search Error:', error.message)
  }
}

testNHTSA()
