import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getGocardlessClient } from '@/lib/gocardless'

export async function POST(request: Request) {
  try {
    const { workshopId } = await request.json()

    if (!workshopId) {
      return NextResponse.json({ error: 'workshopId erforderlich' }, { status: 400 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId }
    })

    if (!workshop || !workshop.gocardlessMandateId) {
      return NextResponse.json({ error: 'Kein SEPA-Mandat gefunden' }, { status: 404 })
    }

    // Hole aktuellen Status von GoCardless
    const client = getGocardlessClient()
    const mandate = await client.mandates.find(workshop.gocardlessMandateId)

    // Update in Datenbank
    await prisma.workshop.update({
      where: { id: workshopId },
      data: {
        gocardlessMandateStatus: mandate.status
      }
    })

    return NextResponse.json({
      success: true,
      oldStatus: workshop.gocardlessMandateStatus,
      newStatus: mandate.status,
      mandateDetails: {
        id: mandate.id,
        status: mandate.status,
        createdAt: mandate.created_at,
        reference: mandate.reference
      }
    })
  } catch (error: any) {
    console.error('Error checking mandate:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Prüfen des Mandats',
      details: error.message 
    }, { status: 500 })
  }
}
