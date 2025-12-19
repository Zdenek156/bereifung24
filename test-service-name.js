// Test the service name extraction
function getServiceName(additionalNotes) {
  if (!additionalNotes) return 'Service'
  
  // Extract service type from emoji prefix
  if (additionalNotes.includes('🔧 SONSTIGE REIFENSERVICES')) {
    return 'Sonstige Reifenservices'
  } else if (additionalNotes.includes('🔄 RÄDERWECHSEL')) {
    return 'Räderwechsel'
  } else if (additionalNotes.includes('🛞 REIFENWECHSEL')) {
    return 'Reifenwechsel'
  } else if (additionalNotes.includes('🔧 REIFENREPARATUR')) {
    return 'Reifenreparatur'
  } else if (additionalNotes.includes('🏍️ MOTORRADREIFEN')) {
    return 'Motorradreifen'
  } else if (additionalNotes.includes('📐 ACHSVERMESSUNG')) {
    return 'Achsvermessung'
  } else if (additionalNotes.includes('❄️ KLIMASERVICE')) {
    return 'Klimaservice'
  } else if (additionalNotes.includes('🔴 BREMSENSERVICE')) {
    return 'Bremsenservice'
  } else if (additionalNotes.includes('🔋 BATTERIESERVICE')) {
    return 'Batterieservice'
  }
  
  return 'Service'
}

// Test cases
const testCases = [
  '🔧 SONSTIGE REIFENSERVICES\nBeschreibung: Nur waschen und spülen',
  '🔄 RÄDERWECHSEL\nBeschreibung: Räder umstecken',
  null,
  'Some other text'
]

testCases.forEach((test, i) => {
  console.log(`Test ${i + 1}: "${test}"`)
  console.log(`Result: "${getServiceName(test)}"`)
  console.log('')
})
