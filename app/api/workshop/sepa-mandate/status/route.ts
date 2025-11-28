// app/api/workshop/sepa-mandate/status/route.ts
// Get SEPA mandate status for logged-in workshop

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
        name: true,
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

    // Get latest status from GoCardless
    const mandate = await getMandateStatus(workshop.gocardlessMandateId)

    // Update local status if changed
    if (mandate.status !== workshop.gocardlessMandateStatus) {
      await prisma.workshop.update({
        where: { id: workshop.id },
        data: {
          gocardlessMandateStatus: mandate.status
        }
      })
    }

    return NextResponse.json({
      configured: true,
      mandate: {
        id: mandate.id,
        status: mandate.status,
        reference: mandate.reference,
        createdAt: mandate.created_at,
        nextPossibleChargeDate: mandate.next_possible_charge_date,
        scheme: mandate.scheme
      }
    })

  } catch (error: any) {
    console.error('Error getting SEPA mandate status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get mandate status' },
      { status: 500 }
    )
  }
}
