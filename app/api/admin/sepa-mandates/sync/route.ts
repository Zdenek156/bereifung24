// app/api/admin/sepa-mandates/sync/route.ts
// Manually sync SEPA mandate statuses from GoCardless

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { gocardless } from '@/lib/gocardless'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all workshops with pending mandates
    const workshops = await prisma.workshop.findMany({
      where: {
        gocardlessMandateId: { not: null },
        gocardlessMandateStatus: {
          in: ['pending_submission', 'submitted']
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    console.log(`🔄 Syncing ${workshops.length} pending mandates...`)

    const results = []

    for (const workshop of workshops) {
      try {
        // Fetch mandate from GoCardless
        const mandate = await gocardless.mandates.find(workshop.gocardlessMandateId!)
        
        const oldStatus = workshop.gocardlessMandateStatus
        const newStatus = mandate.status

        console.log(`Workshop ${workshop.companyName}: ${oldStatus} → ${newStatus}`)

        // Update if status changed
        if (oldStatus !== newStatus) {
          await prisma.workshop.update({
            where: { id: workshop.id },
            data: { gocardlessMandateStatus: newStatus }
          })

          results.push({
            workshop: workshop.companyName,
            oldStatus,
            newStatus,
            updated: true
          })

          // Send activation email if now active
          if (newStatus === 'active') {
            console.log(`📧 Sending activation email to ${workshop.user.email}`)
            // TODO: Trigger email sending here if needed
          }
        } else {
          results.push({
            workshop: workshop.companyName,
            status: oldStatus,
            updated: false
          })
        }

      } catch (error: any) {
        console.error(`❌ Error syncing ${workshop.companyName}:`, error.message)
        results.push({
          workshop: workshop.companyName,
          error: error.message,
          updated: false
        })
      }
    }

    return NextResponse.json({
      success: true,
      synced: results.filter(r => r.updated).length,
      total: workshops.length,
      results
    })

  } catch (error: any) {
    console.error('Error syncing SEPA mandates:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync mandates' },
      { status: 500 }
    )
  }
}
