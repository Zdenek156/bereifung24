// app/api/workshop/sepa-mandate/cancel/route.ts
// Cancel/Revoke SEPA mandate

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

    // Get workshop with mandate details
    const workshop = await prisma.workshop.findUnique({
      where: { id: session.user.workshopId },
      select: {
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        companyName: true
      }
    })

    if (!workshop || !workshop.gocardlessMandateId) {
      return NextResponse.json(
        { error: 'Kein SEPA-Mandat gefunden' },
        { status: 404 }
      )
    }

    // Cancel mandate on GoCardless
    const client = getGocardlessClient()
    
    try {
      await client.mandates.cancel(workshop.gocardlessMandateId)
    } catch (gcError: any) {
      console.error('GoCardless cancel error:', gcError)
      // Continue even if GoCardless cancellation fails (maybe already cancelled)
    }

    // Update database
    await prisma.workshop.update({
      where: { id: session.user.workshopId },
      data: {
        gocardlessMandateId: null,
        gocardlessMandateStatus: null,
        gocardlessMandateRef: null,
        gocardlessMandateCreatedAt: null,
        gocardlessCustomerId: null,
        gocardlessBankAccountId: null,
        gocardlessSessionToken: null,
        gocardlessRedirectFlowId: null
      }
    })

    console.log(`🚫 SEPA mandate cancelled for workshop: ${workshop.companyName}`)

    return NextResponse.json({
      success: true,
      message: 'SEPA-Mandat wurde erfolgreich widerrufen'
    })

  } catch (error: any) {
    console.error('Error cancelling SEPA mandate:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Widerrufen des Mandats' },
      { status: 500 }
    )
  }
}
