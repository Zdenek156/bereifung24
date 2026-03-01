import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * POST /api/workshop/tyresystem/batch-inquiry
 * 
 * Get live pricing for multiple articles at once
 * 
 * Body:
 * {
 *   queries: [
 *     { articleId: "102355", amount: 4 },
 *     { articleId: "222", amount: 4 },
 *     ...
 *   ]
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   results: [
 *     { articleId: "102355", success: true, pricing: {...} },
 *     { articleId: "222", success: false, error: "..." },
 *     ...
 *   ]
 * }
 */

const TYRESYSTEM_API_BASE = 'https://api.tyresystem.de/Rest'

interface BatchQuery {
  articleId: string
  amount: number
}

interface BatchRequest {
  queries: BatchQuery[]
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

// Query single article
async function querySingleArticle(
  articleId: string,
  amount: number,
  username: string,
  password: string
) {
  try {
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
      return {
        articleId,
        amount,
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
      }
    }

    const data = await response.json()

    return {
      articleId,
      amount,
      success: true,
      pricing: data
    }
  } catch (error) {
    return {
      articleId,
      amount,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
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

    // Parse request body
    const body: BatchRequest = await request.json()
    const { queries } = body

    if (!queries || queries.length === 0) {
      return NextResponse.json({ 
        error: 'No queries provided' 
      }, { status: 400 })
    }

    // Limit batch size to prevent abuse
    if (queries.length > 50) {
      return NextResponse.json({ 
        error: 'Maximum 50 queries per batch' 
      }, { status: 400 })
    }

    // Get credentials
    const { username, password, supplierId } = await getWorkshopCredentials(user.workshop.id)

    console.log(`🔍 [TyreSystem] Batch inquiry: ${queries.length} articles`)

    // Query all articles (with a small delay between requests to avoid rate limiting)
    const results = []
    for (const query of queries) {
      const result = await querySingleArticle(
        query.articleId,
        query.amount,
        username,
        password
      )
      results.push(result)
      
      // Small delay to avoid rate limiting (100ms between requests)
      if (queries.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    // Update supplier
    await prisma.workshopSupplier.update({
      where: { id: supplierId },
      data: {
        lastApiCheck: new Date(),
        lastApiError: failureCount > 0 ? `${failureCount}/${results.length} queries failed` : null,
        apiCallsToday: { increment: results.length }
      }
    })

    console.log(`✅ [TyreSystem] Batch inquiry completed: ${successCount} success, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      },
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [TyreSystem] Batch inquiry error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
