const { PrismaClient } = require('@prisma/client')
const fetch = require('node-fetch')

const ORDER_ID = '23070972M6254830B'

const prisma = new PrismaClient()

async function getCredentials() {
  console.log('📊 Getting credentials from database...')
  
  const settings = await prisma.adminApiSetting.findMany({
    where: {
      key: {
        in: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_MODE']
      }
    }
  })
  
  const credentials = {
    clientId: settings.find(s => s.key === 'PAYPAL_CLIENT_ID')?.value,
    clientSecret: settings.find(s => s.key === 'PAYPAL_CLIENT_SECRET')?.value,
    mode: settings.find(s => s.key === 'PAYPAL_MODE')?.value || 'sandbox'
  }
  
  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error('PayPal credentials not found in database')
  }
  
  const apiUrl = credentials.mode === 'live' 
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
  
  console.log('✅ Credentials loaded')
  console.log('   API URL:', apiUrl)
  console.log('   Client ID:', credentials.clientId.substring(0, 12) + '...')
  
  return { ...credentials, apiUrl }
}

async function getAccessToken(credentials) {
  console.log('\n🔐 Getting PayPal access token...')
  
  const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString('base64')
  
  const response = await fetch(`${credentials.apiUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get access token: ${error}`)
  }
  
  const data = await response.json()
  console.log('✅ Access token obtained')
  
  return data.access_token
}

async function getOrderDetails(credentials, accessToken, orderId) {
  console.log(`\n📋 Getting order details for: ${orderId}`)
  
  const response = await fetch(`${credentials.apiUrl}/v2/checkout/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get order details: ${error}`)
  }
  
  const order = await response.json()
  
  console.log('✅ Order details retrieved:')
  console.log('   Status:', order.status)
  console.log('   Payer:', order.payer?.email_address || 'N/A')
  console.log('   Amount:', order.purchase_units[0]?.amount?.value, order.purchase_units[0]?.amount?.currency_code)
  
  // Get capture information
  const captures = order.purchase_units[0]?.payments?.captures || []
  console.log('   Captures:', captures.length)
  
  captures.forEach((capture, index) => {
    console.log(`   Capture ${index + 1}:`, capture.id, '-', capture.status)
  })
  
  return order
}

async function refundCapture(credentials, accessToken, captureId, amount, currencyCode) {
  console.log(`\n💰 Refunding capture: ${captureId}`)
  console.log(`   Amount: ${amount} ${currencyCode}`)
  
  const response = await fetch(`${credentials.apiUrl}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: {
        value: amount,
        currency_code: currencyCode
      },
      note_to_payer: 'Rückerstattung aufgrund eines technischen Fehlers bei der Buchungserstellung'
    })
  })
  
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to refund capture: ${error}`)
  }
  
  const refund = await response.json()
  
  console.log('✅ Refund successful!')
  console.log('   Refund ID:', refund.id)
  console.log('   Status:', refund.status)
  
  return refund
}

async function main() {
  try {
    console.log('🚀 Starting PayPal refund process...\n')
    
    // Step 1: Get credentials from database
    const credentials = await getCredentials()
    
    // Step 2: Get access token
    const accessToken = await getAccessToken(credentials)
    
    // Step 3: Get order details
    const order = await getOrderDetails(credentials, accessToken, ORDER_ID)
    
    // Step 4: Refund all captures
    const captures = order.purchase_units[0]?.payments?.captures || []
    
    if (captures.length === 0) {
      console.log('\n⚠️ No captures found for this order')
      return
    }
    
    for (const capture of captures) {
      if (capture.status === 'COMPLETED') {
        await refundCapture(
          credentials,
          accessToken,
          capture.id,
          capture.amount.value,
          capture.amount.currency_code
        )
      } else {
        console.log(`\n⚠️ Skipping capture ${capture.id} - status: ${capture.status}`)
      }
    }
    
    console.log('\n✅ All refunds completed!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
