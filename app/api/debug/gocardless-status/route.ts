// app/api/debug/gocardless-status/route.ts
// Debug endpoint to check GoCardless mandate status

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getGocardlessClient } from '@/lib/gocardless'
import { getApiSetting } from '@/lib/api-settings'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.workshopId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: session.user.workshopId },
      select: {
        id: true,
        companyName: true,
        gocardlessCustomerId: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        gocardlessMandateRef: true,
        gocardlessMandateCreatedAt: true,
        gocardlessBankAccountId: true
      }
    })

    if (!workshop || !workshop.gocardlessMandateId) {
      return NextResponse.json({
        hasMandate: false,
        message: 'Kein Mandat in der Datenbank gefunden'
      })
    }

    // Get live status from GoCardless
    const client = await getGocardlessClient()
    let gcMandate = null
    let gcError = null

    try {
      gcMandate = await client.mandates.find(workshop.gocardlessMandateId)
    } catch (error: any) {
      gcError = {
        message: error.message,
        code: error.code,
        type: error.type
      }
    }

    // Get customer info if available
    let gcCustomer = null
    if (workshop.gocardlessCustomerId) {
      try {
        gcCustomer = await client.customers.find(workshop.gocardlessCustomerId)
      } catch (error) {
        console.error('Error fetching customer:', error)
      }
    }

    return NextResponse.json({
      hasMandate: true,
      database: {
        workshopId: workshop.id,
        workshopName: workshop.companyName,
        customerId: workshop.gocardlessCustomerId,
        mandateId: workshop.gocardlessMandateId,
        mandateStatus: workshop.gocardlessMandateStatus,
        mandateRef: workshop.gocardlessMandateRef,
        mandateCreated: workshop.gocardlessMandateCreatedAt,
        bankAccountId: workshop.gocardlessBankAccountId
      },
      gocardless: {
        mandate: gcMandate,
        customer: gcCustomer,
        error: gcError
      },
      debug: {
        environment: await getApiSetting('GOCARDLESS_ENVIRONMENT', 'GOCARDLESS_ENVIRONMENT'),
        hasToken: !!(await getApiSetting('GOCARDLESS_ACCESS_TOKEN', 'GOCARDLESS_ACCESS_TOKEN')),
        tokenPreview: (await getApiSetting('GOCARDLESS_ACCESS_TOKEN', 'GOCARDLESS_ACCESS_TOKEN'))?.substring(0, 10) + '...'
      }
    })

  } catch (error: any) {
    console.error('Error in gocardless-status:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
