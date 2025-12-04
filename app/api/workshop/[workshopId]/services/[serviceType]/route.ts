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
        runFlatSurcharge: true,
        durationMinutes: true,
        durationMinutes4: true,
        servicePackages: {
          where: {
            isActive: true
          },
          select: {
            packageType: true,
            price: true,
            durationMinutes: true
          }
        }
      }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service nicht gefunden' },
        { status: 404 }
      )
    }

    // If service has packages, use them directly
    if (service.servicePackages && service.servicePackages.length > 0) {
      const packages = service.servicePackages
      
      // Find base packages (without disposal)
      const twoTires = packages.find(p => p.packageType === 'two_tires')
      const fourTires = packages.find(p => p.packageType === 'four_tires')
      
      // Use package prices as base, disposal and runflat are separate
      const basePrice = twoTires?.price || service.basePrice
      const basePrice4 = fourTires?.price || service.basePrice4
      const durationMinutes = twoTires?.durationMinutes || service.durationMinutes
      const durationMinutes4 = fourTires?.durationMinutes || service.durationMinutes4
      
      return NextResponse.json({
        basePrice,
        basePrice4,
        disposalFee: service.disposalFee,
        runFlatSurcharge: service.runFlatSurcharge,
        durationMinutes,
        durationMinutes4
      })
    }

    // Legacy format without packages
    return NextResponse.json({
      basePrice: service.basePrice,
      basePrice4: service.basePrice4,
      disposalFee: service.disposalFee,
      runFlatSurcharge: service.runFlatSurcharge,
      durationMinutes: service.durationMinutes,
      durationMinutes4: service.durationMinutes4
    })
  } catch (error) {
    console.error('Error fetching workshop service:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Service-Informationen' },
      { status: 500 }
    )
  }
}
