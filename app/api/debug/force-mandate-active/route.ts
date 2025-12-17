// app/api/debug/force-mandate-active/route.ts
// Force update mandate status from GoCardless

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGocardlessClient } from '@/lib/gocardless'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.workshopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: session.user.workshopId },
      select: {
        id: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true
      }
    })

    if (!workshop || !workshop.gocardlessMandateId) {
      return NextResponse.json(
        { error: 'Kein Mandat gefunden' },
        { status: 404 }
      )
    }

    // Get current status from GoCardless
    const client = await getGocardlessClient()
    const mandate = await client.mandates.find(workshop.gocardlessMandateId)

    console.log(`📋 Current GoCardless status: ${mandate.status}`)

    // Update database with current status
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        gocardlessMandateStatus: mandate.status,
        gocardlessMandateRef: mandate.reference
      }
    })

    // Check if we can "submit" the mandate manually
    // Note: GoCardless usually does this automatically, but we can try to trigger it
    let actionTaken = 'Status aktualisiert'

    if (mandate.status === 'pending_submission') {
      // In production, GoCardless should handle this automatically
      // We can only wait or contact GoCardless support
      actionTaken = 'Status ist pending_submission - GoCardless muss das Mandat bei der Bank einreichen. Dies kann 3-5 Werktage dauern.'
    }

    return NextResponse.json({
      success: true,
      oldStatus: workshop.gocardlessMandateStatus,
      newStatus: mandate.status,
      message: actionTaken,
      mandate: {
        id: mandate.id,
        status: mandate.status,
        reference: mandate.reference,
        created_at: mandate.created_at,
        next_possible_charge_date: mandate.next_possible_charge_date,
        scheme: mandate.scheme
      },
      recommendation: mandate.status === 'pending_submission' 
        ? 'Das Mandat ist seit über 2 Wochen pending. Empfehlung: GoCardless Support kontaktieren oder neues Mandat erstellen.'
        : 'Mandat ist in Ordnung'
    })

  } catch (error: any) {
    console.error('Error forcing mandate status:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
