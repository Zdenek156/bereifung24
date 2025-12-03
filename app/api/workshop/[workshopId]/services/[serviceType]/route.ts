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

    // If service has packages, convert them to legacy format
    if (service.servicePackages && service.servicePackages.length > 0) {
      const packages = service.servicePackages
      
      // Find relevant packages for TIRE_CHANGE
      const twoTires = packages.find(p => p.packageType === 'two_tires')
      const fourTires = packages.find(p => p.packageType === 'four_tires')
      const twoTiresDisposal = packages.find(p => p.packageType === 'two_tires_disposal')
      const fourTiresDisposal = packages.find(p => p.packageType === 'four_tires_disposal')
      
      // Calculate base prices and disposal fee
      const basePrice = twoTires?.price || service.basePrice
      const basePrice4 = fourTires?.price || service.basePrice4
      const durationMinutes = twoTires?.durationMinutes || service.durationMinutes
      const durationMinutes4 = fourTires?.durationMinutes || service.durationMinutes4
      
      // Calculate disposal fee per tire
      let disposalFee = service.disposalFee
      if (twoTiresDisposal && twoTires) {
        disposalFee = (twoTiresDisposal.price - twoTires.price) / 2
      } else if (fourTiresDisposal && fourTires) {
        disposalFee = (fourTiresDisposal.price - fourTires.price) / 4
      }
      
      return NextResponse.json({
        basePrice,
        basePrice4,
        disposalFee,
        durationMinutes,
        durationMinutes4
      })
    }

    // Legacy format without packages
    return NextResponse.json({
      basePrice: service.basePrice,
      basePrice4: service.basePrice4,
      disposalFee: service.disposalFee,
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
