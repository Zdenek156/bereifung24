import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Temporäre API um SEPA-Status manuell auf active zu setzen
export async function POST(request: Request) {
  try {
    const { workshopId } = await request.json()

    if (!workshopId) {
      return NextResponse.json({ error: 'workshopId erforderlich' }, { status: 400 })
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop nicht gefunden' }, { status: 404 })
    }

    // Setze Status auf active
    await prisma.workshop.update({
      where: { id: workshopId },
      data: {
        gocardlessMandateStatus: 'active'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'SEPA-Mandat Status auf active gesetzt',
      workshop: {
        id: workshop.id,
        name: workshop.companyName,
        oldStatus: workshop.gocardlessMandateStatus,
        newStatus: 'active'
      }
    })
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Update',
      details: error.message 
    }, { status: 500 })
  }
}
