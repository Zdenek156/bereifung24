import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * TyreSystem REST API Test Endpoint
 * 
 * Tests both Inquiry (Artikelanfrage) and Order (Bestellung) endpoints
 * 
 * Usage: GET /api/admin/tyresystem/test?action=inquiry|order
 */

// TyreSystem API Configuration
const TYRESYSTEM_API_BASE = 'https://api.tyresystem.de/Rest'

// Get credentials from database for logged-in workshop
async function getWorkshopCredentials(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { workshop: true }
  })

  if (!user?.workshop) {
    throw new Error('Workshop not found')
  }

  const supplier = await prisma.workshopSupplier.findFirst({
    where: {
      workshopId: user.workshop.id,
      supplier: 'TYRESYSTEM',
      isActive: true,
      connectionType: 'API'
    }
  })

  if (!supplier || !supplier.usernameEncrypted || !supplier.passwordEncrypted) {
    throw new Error('TyreSystem API credentials not configured. Please add them in Settings → Lieferanten.')
  }

  const username = decrypt(supplier.usernameEncrypted)
  const password = decrypt(supplier.passwordEncrypted)

  return { username, password, supplierId: supplier.id }
}

// Create Basic Auth header
const createAuthHeader = (username: string, password: string) => {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${credentials}`
}

/**
 * Test Artikelanfrage (Product Inquiry)
 * GET https://api.tyresystem.de/Rest/Inquiry/{idArticle}/{amount}
 */
async function testInquiry(username: string, password: string) {
  try {
    // Test with article ID 222 (from documentation example)
    const idArticle = '222'
    const amount = '1'
    
    const url = `${TYRESYSTEM_API_BASE}/Inquiry/${idArticle}/${amount}`
    
    console.log('🔍 Testing TyreSystem Inquiry API...')
    console.log('URL:', url)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(username, password),
        'Accept': 'application/json',
      },
    })

    console.log('Status:', response.status, response.statusText)
    
    const contentType = response.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    let data
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else if (contentType?.includes('xml')) {
      const xmlText = await response.text()
      data = { xmlResponse: xmlText }
    } else {
      data = { rawResponse: await response.text() }
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    }
  } catch (error) {
    console.error('❌ Inquiry test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}

/**
 * Test Bestellung (Order)
 * POST https://api.tyresystem.de/Rest/Order
 */
async function testOrder(username: string, password: string) {
  try {
    const url = `${TYRESYSTEM_API_BASE}/Order`
    
    // Test order data (from documentation example)
    const orderData = {
      order: {
        items: {
          item: [
            {
              pos: 1,
              idArticle: 102355,
              ean: '4019238594195',
              guid: null,
              amount: 1,
              price: 42.28,
            },
            {
              pos: 2,
              idArticle: 777,
              ean: '3286347602610',
              guid: null,
              amount: 2,
              price: 29.43,
            },
          ],
        },
        delivery_address: {
          neutraldelivery: 1,
          salutation: 'Firma',
          name: 'Test Bereifung24',
          street: 'Teststraße 1',
          zipcode: '89073',
          city: 'Ulm',
          countrycode: 'DE',
        },
        ordernumber_customer: 'TEST-' + Date.now(),
        commission: 'API Test Bestellung',
      },
    }

    console.log('📦 Testing TyreSystem Order API...')
    console.log('URL:', url)
    console.log('Order Data:', JSON.stringify(orderData, null, 2))
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': createAuthHeader(username, password),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    console.log('Status:', response.status, response.statusText)
    
    const contentType = response.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    let data
    if (contentType?.includes('application/json')) {
      data = await response.json()
    } else if (contentType?.includes('xml')) {
      const xmlText = await response.text()
      data = { xmlResponse: xmlText }
    } else {
      data = { rawResponse: await response.text() }
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      contentType,
      data,
      requestBody: orderData,
      headers: Object.fromEntries(response.headers.entries()),
    }
  } catch (error) {
    console.error('❌ Order test failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }
  }
}

/**
 * Test multiple article inquiries
 */
async function testMultipleInquiries(username: string, password: string) {
  const testArticles = [
    { id: '222', amount: 1, description: 'From documentation example' },
    { id: '102355', amount: 1, description: 'Test article 1' },
    { id: '777', amount: 2, description: 'Test article 2' },
  ]

  const results = []

  for (const article of testArticles) {
    try {
      const url = `${TYRESYSTEM_API_BASE}/Inquiry/${article.id}/${article.amount}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': createAuthHeader(username, password),
          'Accept': 'application/json',
        },
      })

      const contentType = response.headers.get('content-type')
      let data

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else if (contentType?.includes('xml')) {
        data = { xmlResponse: await response.text() }
      } else {
        data = { rawResponse: await response.text() }
      }

      results.push({
        article,
        success: response.ok,
        status: response.status,
        data,
      })
    } catch (error) {
      results.push({
        article,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return results
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized. Please log in as a workshop.' 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'inquiry'

    // Get credentials from database
    let username: string
    let password: string
    let supplierId: string

    try {
      const creds = await getWorkshopCredentials(session.user.id)
      username = creds.username
      password = creds.password
      supplierId = creds.supplierId
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load credentials',
        instructions: [
          '1. Go to Dashboard → Settings → Lieferanten',
          '2. Add TyreSystem as supplier',
          '3. Enter your API credentials (will be encrypted)',
          '4. Test the connection',
        ],
      }, { status: 400 })
    }

    let result

    switch (action) {
      case 'inquiry':
        result = await testInquiry(username, password)
        break
      
      case 'order':
        result = await testOrder(username, password)
        break
      
      case 'multiple':
        result = await testMultipleInquiries(username, password)
        break
      
      case 'all':
        const inquiryResult = await testInquiry(username, password)
        await new Promise(resolve => setTimeout(resolve, 1000)) // 1s delay between requests
        const orderResult = await testOrder(username, password)
        
        result = {
          inquiry: inquiryResult,
          order: orderResult,
        }
        break
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          validActions: ['inquiry', 'order', 'multiple', 'all'],
        }, { status: 400 })
    }

    // Update supplier with successful API check
    await prisma.workshopSupplier.update({
      where: { id: supplierId },
      data: {
        lastApiCheck: new Date(),
        lastApiError: null,
        apiCallsToday: { increment: 1 }
      }
    })

    return NextResponse.json({
      success: true,
      action,
      timestamp: new Date().toISOString(),
      testMode: true,
      result,
      documentation: {
        inquiry: {
          method: 'GET',
          url: 'https://api.tyresystem.de/Rest/Inquiry/{idArticle}/{amount}',
          description: 'Query product availability and pricing',
        },
        order: {
          method: 'POST',
          url: 'https://api.tyresystem.de/Rest/Order',
          description: 'Place an order',
        },
      },
    })

  } catch (error) {
    console.error('❌ TyreSystem test API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
}
