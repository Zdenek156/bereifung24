import { getSupplierCredentials } from '@/lib/services/workshopSupplierService'
import {
  cacheInquiry,
  getCachedInquiry,
  incrementApiCallCounter,
} from '@/lib/redis/cache'

/**
 * TyreSystem API Service
 * Handles all communication with TyreSystem REST API
 */

const TYRESYSTEM_API_BASE = 'https://api.tyresystem.de/Rest'

interface TyreSystemInquiryResponse {
  inquiryResponse: {
    offerData: {
      idArticle: string
      ean: string
      price: string
      amount: string
      description: string
      errorCode: number
      stock: string
    }
  }
}

interface TyreSystemOrderItem {
  pos: number
  idArticle: number | string
  ean: string
  guid?: string | null
  amount: number
  price: number
}

interface TyreSystemOrderData {
  order: {
    items: {
      item: TyreSystemOrderItem[]
    }
    delivery_address: {
      neutraldelivery: number // 0 = normal, 1 = neutral
      salutation: string // "Firma", "Herr", "Frau"
      name: string
      street: string
      zipcode: string
      city: string
      countrycode: string
    }
    ordernumber_customer: string
    commission?: string
  }
}

interface TyreSystemOrderResponse {
  orderResponse: {
    positions: {
      position: Array<{
        ordernumber: string
        orderStatus: boolean
        error: number
        errorMessage: string | null
        pos: number
      }>
    }
  }
}

/**
 * Create Basic Auth header from credentials
 */
function createAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${credentials}`
}

/**
 * Query article inquiry (Artikelanfrage)
 * GET https://api.tyresystem.de/Rest/Inquiry/{idArticle}/{amount}
 */
export async function inquireArticle(
  workshopId: string,
  articleId: string,
  amount: number = 1
): Promise<TyreSystemInquiryResponse | null> {
  try {
    // Check cache first
    const cached = await getCachedInquiry(workshopId, articleId, amount)
    if (cached) {
      console.log(`✅ Cache HIT: ${articleId}`)
      return cached
    }

    // Get workshop credentials
    const credentials = await getSupplierCredentials(workshopId, 'TYRESYSTEM')
    if (!credentials) {
      throw new Error('TyreSystem credentials not found for workshop')
    }

    const url = `${TYRESYSTEM_API_BASE}/Inquiry/${articleId}/${amount}`

    console.log(`🔍 TyreSystem Inquiry: ${articleId} x${amount}`)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: createAuthHeader(credentials.username, credentials.password),
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`TyreSystem API error: ${response.status} ${response.statusText}`)
    }

    const data: TyreSystemInquiryResponse = await response.json()

    // Cache the result
    await cacheInquiry(workshopId, articleId, amount, data)

    // Track API call
    await incrementApiCallCounter(workshopId, 'TYRESYSTEM')

    console.log(`✅ TyreSystem Inquiry successful: ${data.inquiryResponse.offerData.description}`)

    return data
  } catch (error) {
    console.error('❌ TyreSystem Inquiry error:', error)
    return null
  }
}

/**
 * Place order (Bestellung)
 * POST https://api.tyresystem.de/Rest/Order
 */
export async function placeOrder(
  workshopId: string,
  orderData: TyreSystemOrderData
): Promise<TyreSystemOrderResponse | null> {
  try {
    // Get workshop credentials
    const credentials = await getSupplierCredentials(workshopId, 'TYRESYSTEM')
    if (!credentials) {
      throw new Error('TyreSystem credentials not found for workshop')
    }

    const url = `${TYRESYSTEM_API_BASE}/Order`

    console.log(`📦 TyreSystem Order: ${orderData.order.ordernumber_customer}`)
    console.log(`   Items: ${orderData.order.items.item.length}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: createAuthHeader(credentials.username, credentials.password),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`TyreSystem Order API error: ${response.status} - ${errorText}`)
    }

    const data: TyreSystemOrderResponse = await response.json()

    // Track API call
    await incrementApiCallCounter(workshopId, 'TYRESYSTEM')

    // Check for errors in response
    const hasErrors = data.orderResponse.positions.position.some(
      (pos) => pos.error !== 0 || !pos.orderStatus
    )

    if (hasErrors) {
      console.warn('⚠️ TyreSystem Order completed with errors:')
      data.orderResponse.positions.position.forEach((pos) => {
        if (pos.error !== 0) {
          console.warn(`   Pos ${pos.pos}: ${pos.errorMessage}`)
        }
      })
    } else {
      console.log(`✅ TyreSystem Order successful`)
      data.orderResponse.positions.position.forEach((pos) => {
        console.log(`   Pos ${pos.pos}: Order #${pos.ordernumber}`)
      })
    }

    return data
  } catch (error) {
    console.error('❌ TyreSystem Order error:', error)
    return null
  }
}

/**
 * Search tires by dimensions
 * (This uses multiple inquiry calls - one per matching article)
 */
export async function searchTires(
  workshopId: string,
  width: string,
  height: string,
  rim: string,
  season?: 'SUMMER' | 'WINTER' | 'ALL_SEASON'
): Promise<any[]> {
  try {
    // TODO: TyreSystem does not have a search endpoint
    // You need to maintain your own tire database or use another service
    // This would typically involve:
    // 1. Local tire database with TyreSystem article IDs
    // 2. Filter by dimensions
    // 3. Call inquireArticle() for each match to get current price/stock
    
    console.warn('⚠️ searchTires: Not implemented - requires tire database')
    return []
  } catch (error) {
    console.error('❌ TyreSystem Search error:', error)
    return []
  }
}

/**
 * Build order data from booking
 */
export function buildOrderFromBooking(
  booking: any,
  customerOrderNumber: string,
  neutralDelivery: boolean = false
): TyreSystemOrderData {
  // Extract tire article IDs from booking
  const items: TyreSystemOrderItem[] = []
  
  // TODO: Extract tire data from booking
  // This depends on your booking structure
  
  return {
    order: {
      items: { item: items },
      delivery_address: {
        neutraldelivery: neutralDelivery ? 1 : 0,
        salutation: 'Firma',
        name: booking.workshopName || 'Workshop',
        street: booking.workshopStreet || '',
        zipcode: booking.workshopZipCode || '',
        city: booking.workshopCity || '',
        countrycode: 'DE',
      },
      ordernumber_customer: customerOrderNumber,
      commission: `Bereifung24 Booking #${booking.id}`,
    },
  }
}
