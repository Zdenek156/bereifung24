// Open browser console on workshop page and run:
console.log('=== DEBUG TIRE BOOKING DATA ===');
const tireBookingData = sessionStorage.getItem('tireBookingData');
if (tireBookingData) {
  const data = JSON.parse(tireBookingData);
  console.log('Full data:', data);
  console.log('isMixedTires:', data.isMixedTires);
  console.log('hasTires:', data.hasTires);
  console.log('selectedFrontTire:', data.selectedFrontTire);
  console.log('selectedRearTire:', data.selectedRearTire);
  console.log('selectedTire:', data.selectedTire);
} else {
  console.log('❌ NO tireBookingData in sessionStorage');
}
