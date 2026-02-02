import crypto from 'crypto'

/**
 * PayPal Webhook Signature Verification
 * 
 * Verifies that the webhook request actually comes from PayPal
 * and hasn't been tampered with.
 * 
 * PayPal sends these headers:
 * - PAYPAL-TRANSMISSION-ID: Unique ID for this transmission
 * - PAYPAL-TRANSMISSION-TIME: Timestamp
 * - PAYPAL-TRANSMISSION-SIG: Signature to verify
 * - PAYPAL-CERT-URL: URL to PayPal's certificate
 * - PAYPAL-AUTH-ALGO: Algorithm used (usually SHA256withRSA)
 */

interface WebhookHeaders {
  'paypal-transmission-id': string
  'paypal-transmission-time': string
  'paypal-cert-url': string
  'paypal-transmission-sig': string
  'paypal-auth-algo': string
}

/**
 * Verify PayPal webhook signature
 * 
 * @param body - Raw webhook body (as string)
 * @param headers - PayPal webhook headers
 * @returns true if signature is valid
 */
export async function verifyPayPalWebhookSignature(
  body: string,
  headers: WebhookHeaders
): Promise<boolean> {
  try {
    // If verification is disabled in development, skip
    if (process.env.PAYPAL_WEBHOOK_VERIFY === 'false') {
      console.warn('⚠️  PayPal webhook verification DISABLED')
      return true
    }
    
    const webhookId = process.env.PAYPAL_WEBHOOK_ID
    if (!webhookId) {
      console.error('❌ PAYPAL_WEBHOOK_ID not configured')
      return false
    }
    
    const transmissionId = headers['paypal-transmission-id']
    const timestamp = headers['paypal-transmission-time']
    const certUrl = headers['paypal-cert-url']
    const actualSignature = headers['paypal-transmission-sig']
    const authAlgo = headers['paypal-auth-algo']
    
    // Validate required headers
    if (!transmissionId || !timestamp || !certUrl || !actualSignature) {
      console.error('❌ Missing required PayPal headers')
      return false
    }
    
    // Validate cert URL (must be from PayPal)
    if (!isValidPayPalCertUrl(certUrl)) {
      console.error('❌ Invalid PayPal certificate URL:', certUrl)
      return false
    }
    
    // Calculate CRC32 of body
    const crc = calculateCRC32(body)
    
    // Create expected signature string
    const expectedSignatureString = `${transmissionId}|${timestamp}|${webhookId}|${crc}`
    
    // Fetch PayPal's certificate
    const certificate = await fetchPayPalCertificate(certUrl)
    
    // Verify signature using RSA
    const isValid = verifyRSASignature(
      expectedSignatureString,
      actualSignature,
      certificate,
      authAlgo
    )
    
    if (isValid) {
      console.log('✅ PayPal signature verified')
    } else {
      console.error('❌ PayPal signature verification failed')
    }
    
    return isValid
    
  } catch (error) {
    console.error('❌ Error verifying PayPal signature:', error)
    return false
  }
}

/**
 * Validate that certificate URL is from PayPal
 */
function isValidPayPalCertUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    const validHosts = [
      'api.paypal.com',
      'api.sandbox.paypal.com',
      'api-m.paypal.com',
      'api-m.sandbox.paypal.com'
    ]
    return validHosts.includes(parsedUrl.hostname)
  } catch {
    return false
  }
}

/**
 * Calculate CRC32 checksum of string
 */
function calculateCRC32(str: string): string {
  const makeCRCTable = () => {
    let c: number
    const crcTable: number[] = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
      }
      crcTable[n] = c
    }
    return crcTable
  }
  
  const crcTable = makeCRCTable()
  let crc = 0 ^ (-1)
  
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
  }
  
  return ((crc ^ (-1)) >>> 0).toString()
}

/**
 * Fetch PayPal's public certificate
 */
async function fetchPayPalCertificate(certUrl: string): Promise<string> {
  try {
    const response = await fetch(certUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch certificate: ${response.statusText}`)
    }
    const cert = await response.text()
    return cert
  } catch (error) {
    console.error('❌ Error fetching PayPal certificate:', error)
    throw error
  }
}

/**
 * Verify RSA signature using PayPal's certificate
 */
function verifyRSASignature(
  data: string,
  signature: string,
  certificate: string,
  algorithm: string
): boolean {
  try {
    // Determine hash algorithm from auth algorithm
    let hashAlgorithm = 'SHA256'
    if (algorithm.includes('SHA256')) {
      hashAlgorithm = 'SHA256'
    } else if (algorithm.includes('SHA1')) {
      hashAlgorithm = 'SHA1'
    }
    
    // Create verifier
    const verifier = crypto.createVerify(hashAlgorithm)
    verifier.update(data)
    verifier.end()
    
    // Verify signature
    const isValid = verifier.verify(certificate, signature, 'base64')
    
    return isValid
  } catch (error) {
    console.error('❌ Error verifying RSA signature:', error)
    return false
  }
}

/**
 * Alternative: Verify via PayPal API
 * 
 * This method calls PayPal's verification endpoint
 * More reliable but adds an extra API call
 */
export async function verifyPayPalWebhookViaAPI(
  webhookId: string,
  headers: WebhookHeaders,
  body: any
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken()
    
    const verificationResponse = await fetch(
      `${process.env.PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          transmission_id: headers['paypal-transmission-id'],
          transmission_time: headers['paypal-transmission-time'],
          cert_url: headers['paypal-cert-url'],
          auth_algo: headers['paypal-auth-algo'],
          transmission_sig: headers['paypal-transmission-sig'],
          webhook_id: webhookId,
          webhook_event: body
        })
      }
    )
    
    const result = await verificationResponse.json()
    return result.verification_status === 'SUCCESS'
    
  } catch (error) {
    console.error('❌ Error verifying via PayPal API:', error)
    return false
  }
}

/**
 * Get PayPal access token
 */
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured')
  }
  
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
    throw new Error('Failed to get PayPal access token')
  }
  
  const data = await response.json()
  return data.access_token
}
