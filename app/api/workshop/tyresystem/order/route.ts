import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * POST /api/workshop/tyresystem/order
 * 
 * Place an order with TyreSystem
 * 
 * Body:
 * {
 *   items: Array<{
 *     idArticle: number,
 *     ean: string,
 *     amount: number,
 *     price: number
 *   }>,
 *   deliveryAddress: {
 *     salutation?: string,
 *     name: string,
 *     street: string,
 *     zipcode: string,
 *     city: string,
 *     countrycode: string
 *   },
 *   orderNumber: string, // Your internal order number
 *   commission?: string // Optional notes
 * }
 */

const TYRESYSTEM_API_BASE = 'https://api.tyresystem.de/Rest'

interface OrderItem {
  idArticle: number
  ean: string
  amount: number
  price: number
}

interface DeliveryAddress {
  neutraldelivery?: number // 0 or 1
  salutation?: string
  name: string
  street: string
  zipcode: string
  city: string
  countrycode: string
}

interface OrderRequest {
  items: OrderItem[]
  deliveryAddress: DeliveryAddress
  orderNumber: string
  commission?: string
}

// Get decrypted credentials for workshop
async function getWorkshopCredentials(workshopId: string) {
  const supplier = await prisma.workshopSupplier.findFirst({
    where: {
      workshopId,
      supplier: 'TYRESYSTEM',
      isActive: true,
      connectionType: 'API'
    }
  })

  if (!supplier || !supplier.usernameEncrypted || !supplier.passwordEncrypted) {
    throw new Error('TyreSystem credentials not configured for this workshop')
  }

  const username = decrypt(supplier.usernameEncrypted)
  const password = decrypt(supplier.passwordEncrypted)

  return { username, password, supplierId: supplier.id }
}

// Create Basic Auth header
function createAuthHeader(username: string, password: string): string {
  const credentials = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${credentials}`
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { workshop: true }
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Get credentials
    const { username, password, supplierId } = await getWorkshopCredentials(user.workshop.id)

    // Parse request body
    const body: OrderRequest = await request.json()
    const { items, deliveryAddress, orderNumber, commission } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ 
        error: 'No items in order' 
      }, { status: 400 })
    }

    if (!deliveryAddress || !orderNumber) {
      return NextResponse.json({ 
        error: 'Missing required fields: deliveryAddress, orderNumber' 
      }, { status: 400 })
    }

    console.log(`📦 [TyreSystem] Placing order:`, {
      orderNumber,
      itemCount: items.length,
      destination: `${deliveryAddress.city}, ${deliveryAddress.countrycode}`
    })

    // Transform items to TyreSystem format
    const transformedItems = items.map((item, index) => ({
      pos: index + 1,
      idArticle: item.idArticle,
      ean: item.ean,
      guid: null,
      amount: item.amount,
      price: item.price
    }))

    // Build TyreSystem order format
    const orderPayload = {
      order: {
        items: {
          item: transformedItems
        },
        delivery_address: {
          ...deliveryAddress,
          neutraldelivery: deliveryAddress.neutraldelivery || 1
        },
        ordernumber_customer: orderNumber,
        commission: commission || ''
      }
    }

    const url = `${TYRESYSTEM_API_BASE}/Order`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': createAuthHeader(username, password),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(orderPayload)
    })

    const contentType = response.headers.get('content-type')
    let responseData

    if (contentType?.includes('application/json')) {
      responseData = await response.json()
    } else if (contentType?.includes('xml')) {
      responseData = { xmlResponse: await response.text() }
    } else {
      responseData = { rawResponse: await response.text() }
    }

    if (!response.ok) {
      console.error('❌ [TyreSystem] Order failed:', response.status, responseData)
      
      // Update supplier with error
      await prisma.workshopSupplier.update({
        where: { id: supplierId },
        data: {
          lastApiError: `Order failed: HTTP ${response.status}`,
          lastApiCheck: new Date()
        }
      })

      return NextResponse.json({
        success: false,
        error: 'Order failed',
        details: responseData
      }, { status: response.status })
    }

    // Update supplier success
    await prisma.workshopSupplier.update({
      where: { id: supplierId },
      data: {
        lastApiCheck: new Date(),
        lastApiError: null,
        apiCallsToday: { increment: 1 }
      }
    })

    console.log('✅ [TyreSystem] Order placed successfully:', responseData)

    // TODO: Save order to database (WorkshopInventory or new SupplierOrder table)

    return NextResponse.json({
      success: true,
      order: responseData,
      orderNumber,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [TyreSystem] Order error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
