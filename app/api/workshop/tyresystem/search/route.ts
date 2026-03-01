import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * POST /api/workshop/tyresystem/search
 * 
 * Search for tires in TyreSystem catalog
 * 
 * Body:
 * {
 *   width: number,
 *   height: number,
 *   diameter: number,
 *   season?: 'SUMMER' | 'WINTER' | 'ALL_SEASON',
 *   minPrice?: number,
 *   maxPrice?: number,
 *   limit?: number
 * }
 */

const TYRESYSTEM_API_BASE = 'https://api.tyresystem.de/Rest'

interface TireSearchParams {
  width: number
  height: number
  diameter: number
  season?: string
  minPrice?: number
  maxPrice?: number
  limit?: number
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
    const body: TireSearchParams = await request.json()
    const { width, height, diameter, season, minPrice, maxPrice, limit = 50 } = body

    if (!width || !height || !diameter) {
      return NextResponse.json({ 
        error: 'Missing required parameters: width, height, diameter' 
      }, { status: 400 })
    }

    console.log(`🔍 [TyreSystem] Searching tires: ${width}/${height} R${diameter}`, {
      season,
      priceRange: minPrice || maxPrice ? `${minPrice || 0}-${maxPrice || '∞'}` : 'any'
    })

    // TODO: TyreSystem API doesn't have a direct search by dimensions endpoint
    // We need to use their catalog/article list and filter
    // For now, we'll use a test inquiry to demonstrate the integration
    
    // Example: Query a specific article
    const testArticleId = '222' // From documentation
    const amount = '4' // Default to 4 tires
    
    const inquiryUrl = `${TYRESYSTEM_API_BASE}/Inquiry/${testArticleId}/${amount}`
    
    const response = await fetch(inquiryUrl, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(username, password),
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [TyreSystem] API error:', response.status, errorText)
      
      // Update supplier with error
      await prisma.workshopSupplier.update({
        where: { id: supplierId },
        data: {
          lastApiError: `HTTP ${response.status}: ${errorText}`,
          lastApiCheck: new Date()
        }
      })

      return NextResponse.json({
        error: 'TyreSystem API error',
        details: errorText
      }, { status: 500 })
    }

    const data = await response.json()

    // Update supplier success
    await prisma.workshopSupplier.update({
      where: { id: supplierId },
      data: {
        lastApiCheck: new Date(),
        lastApiError: null,
        apiCallsToday: { increment: 1 }
      }
    })

    console.log('✅ [TyreSystem] Search successful')

    return NextResponse.json({
      success: true,
      tires: data, // TODO: Transform to our format
      searchParams: { width, height, diameter, season },
      note: 'This is a test response. Full catalog search integration pending.'
    })

  } catch (error) {
    console.error('❌ [TyreSystem] Search error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
