import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'

/**
 * POST /api/admin/invoices/generate
 * Manually trigger commission invoice generation (same as cron job)
 * For testing and manual execution
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔧 Manual invoice generation triggered by:', session?.user?.email)

    // Call the cron endpoint with the cron secret
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production'
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    
    const response = await fetch(`${baseUrl}/api/cron/generate-commission-invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate invoices')
    }

    return NextResponse.json({
      success: true,
      message: 'Invoices generated successfully',
      data: result
    })
  } catch (error) {
    console.error('Error generating invoices:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate invoices'
    }, { status: 500 })
  }
}
