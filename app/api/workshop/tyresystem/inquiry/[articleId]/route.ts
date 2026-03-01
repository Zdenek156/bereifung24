import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * GET /api/workshop/tyresystem/inquiry/{articleId}?amount=4
 * 
 * Get live pricing and availability for a specific article
 * 
 * Example: /api/workshop/tyresystem/inquiry/102355?amount=4
 */

const TYRESYSTEM_API_BASE = 'https://api.tyresystem.de/Rest'

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
    throw new Error('TyreSystem credentials not configured')
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

export async function GET(
  request: NextRequest,
  { params }: { params: { articleId: string } }
) {
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

    const { articleId } = params
    const { searchParams } = new URL(request.url)
    const amount = searchParams.get('amount') || '1'

    if (!articleId) {
      return NextResponse.json({ 
        error: 'Article ID required' 
      }, { status: 400 })
    }

    // Get credentials
    const { username, password, supplierId } = await getWorkshopCredentials(user.workshop.id)

    console.log(`🔍 [TyreSystem] Inquiry: Article ${articleId}, Amount: ${amount}`)

    const url = `${TYRESYSTEM_API_BASE}/Inquiry/${articleId}/${amount}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': createAuthHeader(username, password),
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [TyreSystem] Inquiry failed:`, response.status, errorText)
      
      await prisma.workshopSupplier.update({
        where: { id: supplierId },
        data: {
          lastApiError: `Inquiry failed: HTTP ${response.status}`,
          lastApiCheck: new Date()
        }
      })

      return NextResponse.json({
        error: 'TyreSystem API error',
        details: errorText
      }, { status: response.status })
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

    console.log(`✅ [TyreSystem] Inquiry successful for article ${articleId}`)

    // Expected response format from TyreSystem:
    // {
    //   "idArticle": 102355,
    //   "price": 42.28,
    //   "available": true,
    //   "deliveryTime": "2-3 days",
    //   ...
    // }

    return NextResponse.json({
      success: true,
      articleId,
      amount: parseInt(amount),
      pricing: data,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [TyreSystem] Inquiry error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
