// app/api/workshop/sepa-mandate/complete/route.ts
// Complete SEPA mandate setup after redirect from GoCardless

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { completeRedirectFlow } from '@/lib/gocardless'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { redirectFlowId } = await request.json()

    if (!redirectFlowId) {
      return NextResponse.json(
        { error: 'Missing redirectFlowId' },
        { status: 400 }
      )
    }

    // Get workshop with stored session token
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Verify redirect flow ID matches
    if (workshop.gocardlessRedirectFlowId !== redirectFlowId) {
      return NextResponse.json(
        { error: 'Invalid redirect flow ID' },
        { status: 400 }
      )
    }

    // Get stored session token
    const sessionToken = workshop.gocardlessSessionToken
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token not found' },
        { status: 400 }
      )
    }

    // Complete the redirect flow
    const completedFlow = await completeRedirectFlow(redirectFlowId, sessionToken)

    // Extract mandate and customer details
    const mandateId = completedFlow.links.mandate
    const customerId = completedFlow.links.customer
    const bankAccountId = completedFlow.links.customer_bank_account

    // Update workshop with GoCardless details and clear temporary session data
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        gocardlessCustomerId: customerId,
        gocardlessMandateId: mandateId,
        gocardlessMandateStatus: 'pending_submission', // Will be updated via webhook
        gocardlessMandateRef: completedFlow.mandate_request?.reference || null,
        gocardlessMandateCreatedAt: new Date(),
        gocardlessBankAccountId: bankAccountId,
        gocardlessSessionToken: null, // Clear temporary session token
        gocardlessRedirectFlowId: null // Clear temporary redirect flow ID
      }
    })

    console.log(`✅ SEPA Mandate created for workshop ${workshop.companyName}:`, {
      mandateId,
      customerId,
      status: 'pending_submission'
    })

    return NextResponse.json({
      success: true,
      message: 'SEPA-Lastschriftmandat erfolgreich eingerichtet',
      mandate: {
        id: mandateId,
        status: 'pending_submission',
        reference: completedFlow.mandate_request?.reference
      }
    })

  } catch (error: any) {
    console.error('Error completing SEPA mandate:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to complete SEPA mandate' },
      { status: 500 }
    )
  }
}
