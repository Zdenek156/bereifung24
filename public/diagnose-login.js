// Influencer Login Diagnostic Tool
// Führen Sie dies in der Browser-Console aus (F12 → Console)
// auf der Seite https://www.bereifung24.de

console.log('🔍 Influencer Login Diagnostic Tool\n')

async function diagnoseLogin() {
  const email = prompt('Influencer Email:', 'turboga53@bereifung24.de')
  const password = prompt('Password:', '')
  
  if (!email || !password) {
    console.log('❌ Email oder Passwort nicht eingegeben')
    return
  }
  
  console.log(`\n📧 Testing login for: ${email}`)
  console.log('⏳ Sending request...\n')
  
  try {
    const response = await fetch('/api/influencer/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
    
    const data = await response.json()
    
    console.log('📥 Response Status:', response.status)
    console.log('📥 Response Data:', data)
    
    if (response.status === 200) {
      console.log('\n✅ LOGIN SUCCESSFUL!')
      console.log('🍪 Token should be set in cookies')
      console.log('🔄 Redirecting to dashboard...')
      window.location.href = '/influencer/dashboard'
    } else if (response.status === 401) {
      console.log('\n❌ LOGIN FAILED (401 Unauthorized)')
      
      if (data.error?.includes('Registrierung')) {
        console.log('\n⚠️  PROBLEM: Influencer ist nicht vollständig registriert')
        console.log('💡 LÖSUNG: isRegistered muss auf true gesetzt werden')
        console.log('💡 Oder: Passwort ist nicht gesetzt')
      } else {
        console.log('\n⚠️  PROBLEM: Email oder Passwort falsch')
        console.log('💡 LÖSUNG: Prüfen Sie die Anmeldedaten')
      }
    } else if (response.status === 403) {
      console.log('\n❌ ACCOUNT DEAKTIVIERT (403 Forbidden)')
      console.log('💡 LÖSUNG: isActive muss auf true gesetzt werden')
    } else {
      console.log('\n❌ UNEXPECTED ERROR')
      console.log('Error:', data.error)
    }
    
  } catch (error) {
    console.error('\n❌ Network Error:', error)
  }
}

console.log('📋 Starting diagnostic...\n')
diagnoseLogin()
