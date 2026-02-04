/**
 * Refund Failed PayPal Order
 * Order ID: 84S645627M240605B
 * 
 * This script refunds a PayPal order that was paid but booking creation failed
 */

const fetch = require('node-fetch')

const PAYPAL_API_URL = 'https://api-m.paypal.com' // Live mode
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || 'YOUR_LIVE_CLIENT_ID'
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || 'YOUR_LIVE_CLIENT_SECRET'
const ORDER_ID = '84S645627M240605B'

async function getAccessToken() {
  console.log('🔐 Getting PayPal access token...')
  
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
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

async function getOrderDetails(accessToken) {
  console.log(`\n📋 Getting order details for: ${ORDER_ID}`)
  
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${ORDER_ID}`, {
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

async function refundCapture(accessToken, captureId, amount, currency) {
  console.log(`\n💰 Refunding capture: ${captureId}`)
  console.log(`   Amount: ${amount} ${currency}`)
  
  const response = await fetch(`${PAYPAL_API_URL}/v2/payments/captures/${captureId}/refund`, {
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
  console.log('   Amount:', refund.amount.value, refund.amount.currency_code)
  
  return refund
}

async function main() {
  try {
    console.log('🚀 Starting PayPal refund process...\n')
    
    // Step 1: Get access token
    const accessToken = await getAccessToken()
    
    // Step 2: Get order details
    const { order, captureId } = await getOrderDetails(accessToken)
    
    if (order.status !== 'COMPLETED') {
      console.log('\n⚠️  Warning: Order status is not COMPLETED')
      console.log('   Current status:', order.status)
      console.log('   Refund may not be possible')
      return
    }
    
    if (!captureId) {
      console.log('\n❌ Error: No capture found for this order')
      console.log('   Cannot refund an order without a capture')
      return
    }
    
    // Step 3: Refund the capture
    const amount = order.purchase_units[0].amount.value
    const currency = order.purchase_units[0].amount.currency_code
    
    const refund = await refundCapture(accessToken, captureId, amount, currency)
    
    console.log('\n✅ REFUND COMPLETED SUCCESSFULLY!')
    console.log('═══════════════════════════════════════')
    console.log('Order ID:', ORDER_ID)
    console.log('Capture ID:', captureId)
    console.log('Refund ID:', refund.id)
    console.log('Amount:', refund.amount.value, refund.amount.currency_code)
    console.log('Status:', refund.status)
    console.log('═══════════════════════════════════════')
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message)
    process.exit(1)
  }
}

// Run the script
main()
