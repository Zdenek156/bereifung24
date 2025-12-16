// Test day of week calculation
const testDate = '2025-12-16' // Monday

console.log('Test Date:', testDate)
console.log('Method 1 (current):', new Date(testDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())
console.log('Method 2 (with time):', new Date(testDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase())

// Check what the workingHours parsing returns
const workingHours = '{"monday":{"from":"08:00","to":"17:00","working":true},"tuesday":{"from":"08:00","to":"17:00","working":true},"wednesday":{"from":"08:00","to":"17:00","working":true},"thursday":{"from":"08:00","to":"17:00","working":true},"friday":{"from":"08:00","to":"17:00","working":true,"breakFrom":"06:15","breakTo":"06:30"},"saturday":{"from":"09:00","to":"13:00","working":false},"sunday":{"from":"09:00","to":"13:00","working":false}}'

const hours = JSON.parse(workingHours)
const dayOfWeek = new Date(testDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

console.log('\nDay of week:', dayOfWeek)
console.log('Day hours:', hours[dayOfWeek])
console.log('Is working?:', hours[dayOfWeek]?.working)
