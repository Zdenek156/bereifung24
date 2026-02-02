// app/api/workshop/sepa-mandate/status/route.ts
// Get SEPA mandate status for logged-in workshop

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMandateStatus } from '@/lib/gocardless'

export async function GET(request: Request) {
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
        gocardlessMandateRef: true,
        gocardlessMandateCreatedAt: true
      }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
    }

    // If no mandate, return not configured
    if (!workshop.gocardlessMandateId) {
      return NextResponse.json({
        configured: false,
        message: 'Kein SEPA-Lastschriftmandat eingerichtet'
      })
    }

    // Try to get latest status from GoCardless
    let mandate
    let mandateStatus = workshop.gocardlessMandateStatus
    
    try {
      mandate = await getMandateStatus(workshop.gocardlessMandateId)

      console.log('=== SEPA MANDATE STATUS DEBUG ===')
      console.log('Workshop:', workshop.companyName)
      console.log('Mandate ID:', workshop.gocardlessMandateId)
      console.log('GoCardless Status:', mandate.status)
      console.log('Local Status:', workshop.gocardlessMandateStatus)
      console.log('Created At:', mandate.created_at)
      console.log('================================')

      // Update local status if changed
      if (mandate.status !== workshop.gocardlessMandateStatus) {
        console.log(`🔄 Updating mandate status from ${workshop.gocardlessMandateStatus} to ${mandate.status}`)
        await prisma.workshop.update({
          where: { id: workshop.id },
          data: {
            gocardlessMandateStatus: mandate.status
          }
        })
        mandateStatus = mandate.status
      } else {
        mandateStatus = mandate.status
      }
    } catch (gcError: any) {
      console.warn('⚠️ Could not fetch status from GoCardless, using local status:', gcError.message)
      // Use local database status as fallback
      mandate = {
        id: workshop.gocardlessMandateId,
        status: workshop.gocardlessMandateStatus,
        reference: workshop.gocardlessMandateRef,
        created_at: workshop.gocardlessMandateCreatedAt
      }
      mandateStatus = workshop.gocardlessMandateStatus
    }

    const response = {
      configured: true,
      mandate: {
        id: mandate.id,
        status: mandateStatus,
        reference: mandate.reference,
        createdAt: mandate.created_at,
        nextPossibleChargeDate: mandate.next_possible_charge_date,
        scheme: mandate.scheme
      }
    }

    console.log('API Response:', JSON.stringify(response, null, 2))

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Error getting SEPA mandate status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get mandate status' },
      { status: 500 }
    )
  }
}
