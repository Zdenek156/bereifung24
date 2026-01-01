// Test Affiliate Tracking for TURBOGA53
// Führen Sie dies in der Browser Developer Console aus (F12)

console.log('🔍 Affiliate Tracking Test for TURBOGA53\n')

// Step 1: Check cookies
console.log('📝 Step 1: Checking cookies...')
const cookies = document.cookie.split('; ')
const affiliateRefCookie = cookies.find(c => c.startsWith('b24_affiliate_ref='))
const cookieIdCookie = cookies.find(c => c.startsWith('b24_cookie_id='))

if (affiliateRefCookie) {
  console.log('✅ Affiliate Ref Cookie:', affiliateRefCookie)
} else {
  console.log('❌ Affiliate Ref Cookie NOT SET')
  console.log('ℹ️  Visit: https://www.bereifung24.de?ref=TURBOGA53')
}

if (cookieIdCookie) {
  console.log('✅ Cookie ID:', cookieIdCookie)
} else {
  console.log('❌ Cookie ID NOT SET')
}

console.log('\n')

// Step 2: Test click tracking manually
console.log('📡 Step 2: Testing click tracking...')

const testCookieId = 'test-' + Math.random().toString(36).substring(7)

fetch(`/api/affiliate/track?ref=TURBOGA53&cookieId=${testCookieId}`)
  .then(async response => {
    const data = await response.json()
    console.log('Response Status:', response.status)
    console.log('Response Data:', data)
    
    if (response.status === 200 && data.status === 'tracked') {
      console.log('✅ Click tracking works!')
    } else if (response.status === 404) {
      console.log('❌ Influencer code TURBOGA53 not found in database')
      console.log('💡 Create the influencer first using Prisma Studio')
    } else if (response.status === 403) {
      console.log('❌ Influencer code is inactive or expired')
      console.log('💡 Check influencer status in database')
    } else {
      console.log('❌ Unexpected response')
    }
  })
  .catch(error => {
    console.error('❌ Error:', error)
  })

console.log('\n')

// Step 3: Check if logged in as influencer
console.log('🔐 Step 3: Checking influencer auth...')

fetch('/api/influencer/stats', {
  credentials: 'include'
})
  .then(async response => {
    const data = await response.json()
    console.log('Stats API Status:', response.status)
    
    if (response.status === 200) {
      console.log('✅ Logged in as influencer')
      console.log('Stats:', data.stats)
    } else if (response.status === 401) {
      console.log('❌ Not logged in as influencer')
      console.log('💡 Login at: /influencer/login')
    } else {
      console.log('❌ Error:', data)
    }
  })
  .catch(error => {
    console.error('❌ Error:', error)
  })

console.log('\n')
console.log('✨ Test completed. Check results above.')
console.log('\n')
console.log('📋 Next Steps:')
console.log('1. If cookie not set: Visit https://www.bereifung24.de?ref=TURBOGA53')
console.log('2. If influencer not found: Create influencer in Prisma Studio')
console.log('3. If not logged in: Login at /influencer/login')
console.log('4. After fixes: Re-run this script to verify')
