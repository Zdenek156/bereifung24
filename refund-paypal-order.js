/**
 * Refund Failed PayPal Order - Get credentials from database
 * Order ID: 84S645627M240605B
 */

const fetch = require('node-fetch')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const ORDER_ID = '84S645627M240605B'

async function getCredentials() {
  console.log('📊 Getting credentials from database...')
  
  const settings = await prisma.adminApiSetting.findMany({
    where: {
      key: {
        in: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_API_URL']
      }
    }
  })
  
  const clientId = settings.find(s => s.key === 'PAYPAL_CLIENT_ID')?.value
  const clientSecret = settings.find(s => s.key === 'PAYPAL_CLIENT_SECRET')?.value
  const apiUrl = settings.find(s => s.key === 'PAYPAL_API_URL')?.value || 'https://api-m.paypal.com'
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not found in database')
  }
  
  console.log('✅ Credentials loaded')
  console.log('   API URL:', apiUrl)
  console.log('   Client ID:', clientId.substring(0, 10) + '...')
  
  return { clientId, clientSecret, apiUrl }
}

async function getAccessToken(clientId, clientSecret, apiUrl) {
  console.log('\n🔐 Getting PayPal access token...')
  
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  
  const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
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

async function getOrderDetails(accessToken, apiUrl) {
  console.log(`\n📋 Getting order details for: ${ORDER_ID}`)
  
  const response = await fetch(`${apiUrl}/v2/checkout/orders/${ORDER_ID}`, {
    method: 'GET',
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
  console.log('   Payer:', order.payer?.email_address)
  console.log('   Amount:', order.purchase_units[0]?.amount?.value, order.purchase_units[0]?.amount?.currency_code)
  
  // Check if order has captures
  if (order.purchase_units[0]?.payments?.captures) {
    const captures = order.purchase_units[0].payments.captures
    console.log('   Captures:', captures.length)
    captures.forEach((capture, index) => {
      console.log(`   Capture ${index + 1}:`, capture.id, '-', capture.status)
    })
    return { order, captureId: captures[0]?.id }
  }
  
  return { order, captureId: null }
}

async function refundCapture(accessToken, apiUrl, captureId, amount, currency) {
  console.log(`\n💰 Refunding capture: ${captureId}`)
  console.log(`   Amount: ${amount} ${currency}`)
  
  const response = await fetch(`${apiUrl}/v2/payments/captures/${captureId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: {
        value: amount,
        currency_code: currency
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
  if (refund.amount) {
    console.log('   Amount:', refund.amount.value, refund.amount.currency_code)
  }
  
  return refund
}

async function main() {
  try {
    console.log('🚀 Starting PayPal refund process...\n')
    
    // Step 1: Get credentials from database
    const { clientId, clientSecret, apiUrl } = await getCredentials()
    
    // Step 2: Get access token
    const accessToken = await getAccessToken(clientId, clientSecret, apiUrl)
    
    // Step 3: Get order details
    const { order, captureId } = await getOrderDetails(accessToken, apiUrl)
    
    if (order.status !== 'COMPLETED') {
      console.log('\n⚠️  Warning: Order status is not COMPLETED')
      console.log('   Current status:', order.status)
      console.log('   Refund may not be possible')
      await prisma.$disconnect()
      return
    }
    
    if (!captureId) {
      console.log('\n❌ Error: No capture found for this order')
      console.log('   Cannot refund an order without a capture')
      await prisma.$disconnect()
      return
    }
    
    // Step 4: Refund the capture
    const amount = order.purchase_units[0].amount.value
    const currency = order.purchase_units[0].amount.currency_code
    
    const refund = await refundCapture(accessToken, apiUrl, captureId, amount, currency)
    
    console.log('\n✅ REFUND COMPLETED SUCCESSFULLY!')
    console.log('═══════════════════════════════════════')
    console.log('Order ID:', ORDER_ID)
    console.log('Capture ID:', captureId)
    console.log('Refund ID:', refund.id)
    console.log('Amount:', refund.amount.value, refund.amount.currency_code)
    console.log('Status:', refund.status)
    console.log('═══════════════════════════════════════')
    
    await prisma.$disconnect()
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    await prisma.$disconnect()
    process.exit(1)
  }
}

// Run the script
main()
