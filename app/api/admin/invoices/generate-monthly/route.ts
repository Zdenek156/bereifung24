import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'

/**
 * POST /api/admin/invoices/generate-monthly
 * 
 * Manual trigger for monthly invoice generation (testing)
 * Allows admins to manually trigger the cron job
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`🔧 Manual invoice generation triggered by ${session?.user?.email}`)

    // Call the cron endpoint with proper authorization
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

    return NextResponse.json({
      success: response.ok,
      data: result
    })
  } catch (error) {
    console.error('Error triggering manual invoice generation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to trigger invoice generation' },
      { status: 500 }
    )
  }
}
