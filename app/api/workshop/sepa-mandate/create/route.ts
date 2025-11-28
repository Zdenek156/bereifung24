// app/api/workshop/sepa-mandate/create/route.ts
// API Endpoint to create SEPA mandate using GoCardless Redirect Flow

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { createRedirectFlow } from '@/lib/gocardless'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get workshop
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        ownerName: true,
        address: true,
        city: true,
        zipCode: true,
        gocardlessCustomerId: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // Check if already has active mandate
    if (workshop.gocardlessMandateId && workshop.gocardlessMandateStatus === 'active') {
      return NextResponse.json(
        { error: 'Workshop already has an active SEPA mandate' },
        { status: 400 }
      )
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Save session token temporarily (optional, for verification)
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        // You could add a temporary field for this, or use existing field
        // For now we'll just proceed
      }
    })

    // Create redirect flow
    const successRedirectUrl = `${process.env.NEXTAUTH_URL}/workshop/settings/sepa-mandate/complete`
    
    const redirectFlow = await createRedirectFlow({
      sessionToken,
      successRedirectUrl,
      description: `SEPA-Lastschriftmandat für ${workshop.name} - Bereifung24 Provisionsabzug`,
      prefillCustomer: {
        email: workshop.email,
        givenName: workshop.ownerName?.split(' ')[0],
        familyName: workshop.ownerName?.split(' ').slice(1).join(' '),
        companyName: workshop.name
      }
    })

    // Store session token in database for later verification
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        // Store in a temp field or in metadata
        // For now, we'll return it and handle in complete endpoint
      }
    })

    return NextResponse.json({
      success: true,
      redirectUrl: redirectFlow.redirect_url,
      redirectFlowId: redirectFlow.id,
      sessionToken,
      message: 'Bitte schließen Sie die SEPA-Mandatseinrichtung ab'
    })

  } catch (error: any) {
    console.error('Error creating SEPA mandate redirect flow:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create SEPA mandate' },
      { status: 500 }
    )
  }
}
