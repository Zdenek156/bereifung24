import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        gocardlessMandateId: true,
        gocardlessMandateStatus: true,
        gocardlessMandateRef: true,
        gocardlessMandateCreatedAt: true,
        gocardlessCustomerId: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      total: workshops.length,
      workshops: workshops.map(w => ({
        id: w.id, // Vollständige ID
        name: w.companyName,
        email: w.user.email,
        owner: `${w.user.firstName} ${w.user.lastName}`,
        hasSepaMandate: !!w.gocardlessMandateId,
        mandateStatus: w.gocardlessMandateStatus,
        mandateRef: w.gocardlessMandateRef,
        mandateCreatedAt: w.gocardlessMandateCreatedAt,
        customerId: w.gocardlessCustomerId
      }))
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
