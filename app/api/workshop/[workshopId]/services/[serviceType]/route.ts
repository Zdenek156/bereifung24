import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Hole Service-Informationen einer Werkstatt (öffentlich für Kunden)
export async function GET(
  request: Request,
  { params }: { params: { workshopId: string; serviceType: string } }
) {
  try {
    const service = await prisma.workshopService.findFirst({
      where: {
        workshopId: params.workshopId,
        serviceType: params.serviceType,
        isActive: true
      },
      select: {
        basePrice: true,
        basePrice4: true,
        disposalFee: true,
        durationMinutes: true,
        durationMinutes4: true
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Error fetching workshop service:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Service-Informationen' },
      { status: 500 }
    )
  }
}
