// app/api/workshop/sepa-mandate/create/route.ts
// API Endpoint to create SEPA mandate using GoCardless Redirect Flow

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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
        companyName: true,
        gocardlessCustomerId: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
            street: true,
            city: true,
            zipCode: true
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // If there's an existing mandate (any status), we'll replace it
    // Note: Old mandate will be automatically cancelled by GoCardless when new one becomes active
    const hasExistingMandate = !!workshop.gocardlessMandateId
    
    if (hasExistingMandate) {
      console.log(`🔄 Replacing existing mandate for ${workshop.companyName}:`, {
        oldMandateId: workshop.gocardlessMandateId,
        oldStatus: workshop.gocardlessMandateStatus
      })
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Create redirect flow
    const successRedirectUrl = `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings/sepa-mandate/complete`
    
    const prefillData = {
      email: workshop.user.email,
      givenName: workshop.user.firstName,
      familyName: workshop.user.lastName,
      companyName: workshop.companyName,
      addressLine1: workshop.user.street || undefined,
      city: workshop.user.city || undefined,
      postalCode: workshop.user.zipCode || undefined,
      countryCode: 'DE'
    }
    
    console.log('🔍 Prefill Data being sent to GoCardless:', JSON.stringify(prefillData, null, 2))
    
    const redirectFlow = await createRedirectFlow({
      sessionToken,
      successRedirectUrl,
      description: `SEPA-Lastschriftmandat für ${workshop.companyName} - Bereifung24 Provisionsabzug`,
      prefillCustomer: prefillData
    })

    // Store session token and redirect flow ID in database
    // If replacing an old mandate, keep old mandate info until new one is confirmed
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: {
        gocardlessSessionToken: sessionToken,
        gocardlessRedirectFlowId: redirectFlow.id
      }
    })

    console.log(`✅ SEPA mandate redirect flow created for ${workshop.companyName}`, {
      redirectFlowId: redirectFlow.id,
      replacingExisting: hasExistingMandate
    })

    return NextResponse.json({
      success: true,
      redirectUrl: redirectFlow.redirect_url,
      redirectFlowId: redirectFlow.id,
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
