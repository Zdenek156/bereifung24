// app/api/admin/commissions/bill-month/route.ts
// Admin endpoint to trigger monthly billing for all workshops
// 
// ⚠️ DEPRECATED: Diese Route ist veraltet!
// Nutzt veraltetes GoCardless/SEPA System.
// Provisionen werden jetzt automatisch über Stripe abgezogen.
// 
// Verwende stattdessen: /api/admin/invoices/generate
// Dieser generiert nur noch Dokumentations-Rechnungen.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Check if admin or CEO
    const hasAccess = await isAdminOrCEO(session)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized - Admin or CEO only' }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: 'Diese Route ist veraltet. Bitte verwende /api/admin/invoices/generate',
        deprecated: true,
        newEndpoint: '/api/admin/invoices/generate',
        reason: 'Provisionen werden jetzt automatisch über Stripe abgezogen. Rechnungen dienen nur noch der Dokumentation.'
      },
      { status: 410 } // 410 Gone
    )

  } catch (error: any) {
    console.error('Error in deprecated bill-month endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
