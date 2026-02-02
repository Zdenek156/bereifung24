import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper functions to get readable names
function getServiceTypeName(serviceType: string): string {
  const names: Record<string, string> = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räder umstecken',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
    'ALIGNMENT_BOTH': 'Achsvermessung + Einstellung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsen-Service',
    'BATTERY_SERVICE': 'Batterie-Service',
    'OTHER_SERVICES': 'Sonstige Reifendienste'
  }
  return names[serviceType] || serviceType
}

function getPackageTypeName(packageType: string): string {
  const names: Record<string, string> = {
    // TIRE_CHANGE
    'two_tires': '2 Reifen wechseln',
    'four_tires': '4 Reifen wechseln',
    // TIRE_REPAIR
    'foreign_object': 'Reifenpanne / Loch (Fremdkörper)',
    'valve_damage': 'Ventilschaden',
    // MOTORCYCLE_TIRE
    'front': 'Vorderrad',
    'rear': 'Hinterrad',
    'both': 'Beide Räder',
    'front_disposal': 'Vorderrad + Entsorgung',
    'rear_disposal': 'Hinterrad + Entsorgung',
    'both_disposal': 'Beide + Entsorgung',
    // ALIGNMENT_BOTH
    'measurement_front': 'Vermessung Vorderachse',
    'measurement_rear': 'Vermessung Hinterachse',
    'measurement_both': 'Vermessung beide Achsen',
    'adjustment_front': 'Einstellung Vorderachse',
    'adjustment_rear': 'Einstellung Hinterachse',
    'adjustment_both': 'Einstellung beide Achsen',
    'full_service': 'Komplett-Service',
    // CLIMATE_SERVICE
    'check': 'Klimacheck/Inspektion',
    'basic': 'Basic Service',
    'comfort': 'Comfort Service',
    'premium': 'Premium Service',
    // BRAKE_SERVICE
    'front_pads': 'Vorderachse - Bremsbeläge',
    'front_pads_discs': 'Vorderachse - Beläge + Scheiben',
    'rear_pads': 'Hinterachse - Bremsbeläge',
    'rear_pads_discs': 'Hinterachse - Beläge + Scheiben',
    'rear_pads_discs_handbrake': 'Hinterachse - Beläge + Scheiben + Handbremse',
    // BATTERY_SERVICE
    'replacement': 'Batterie-Wechsel',
    // OTHER_SERVICES
    'rdks': 'RDKS-Service',
    'valve': 'Ventil-Wechsel',
    'storage': 'Reifen-Einlagerung',
    'tpms': 'TPMS-Programmierung'
  }
  return names[packageType] || packageType
}

// GET /api/workshop/services - Get all services for a workshop
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: {
          include: {
            workshopServices: {
              include: {
                servicePackages: {
                  orderBy: {
                    packageType: 'asc'
                  }
                }
              },
              orderBy: {
                serviceType: 'asc'
              }
            }
          }
        }
      }
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Transform workshopServices to the format expected by the UI
    // The UI expects: { id, serviceType, isActive, servicePackages: [...] }
    const services = user.workshop.workshopServices.map(service => ({
      id: service.id,
      serviceType: service.serviceType,
      isActive: service.isActive,
      basePrice: service.basePrice,
      basePrice4: service.basePrice4,
      durationMinutes: service.durationMinutes,
      durationMinutes4: service.durationMinutes4,
      balancingPrice: service.balancingPrice,
      balancingMinutes: service.balancingMinutes,
      storagePrice: service.storagePrice,
      storageAvailable: service.storageAvailable,
      refrigerantPricePer100ml: service.refrigerantPricePer100ml,
      runFlatSurcharge: service.runFlatSurcharge,
      disposalFee: service.disposalFee,
      servicePackages: service.servicePackages.map(pkg => ({
        id: pkg.id,
        packageType: pkg.packageType,
        name: pkg.name,
        description: pkg.description,
        price: pkg.price,
        durationMinutes: pkg.durationMinutes,
        isActive: pkg.isActive
      }))
    }))

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Services fetch error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { error: 'Fehler beim Laden der Services', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST /api/workshop/services - Create a new service
export async function POST(request: Request) {
  let body: any
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: true
      }
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    body = await request.json()
    const {
      serviceType,
      basePrice,
      basePrice4,
      runFlatSurcharge,
      disposalFee,
      wheelSizeSurcharge,
      balancingPrice,
      storagePrice,
      durationMinutes,
      durationMinutes4,
      balancingMinutes,
      storageAvailable,
      refrigerantPrice,
      description,
      internalNotes,
      isActive,
      packages
    } = body

    // Check if service already exists
    const existingService = await prisma.workshopService.findUnique({
      where: {
        workshopId_serviceType: {
          workshopId: user.workshop.id,
          serviceType
        }
      }
    })

    if (existingService) {
      return NextResponse.json(
        { error: 'Service existiert bereits' },
        { status: 400 }
      )
    }

    // Create service with packages if provided
    const service = await prisma.workshopService.create({
      data: {
        workshopId: user.workshop.id,
        serviceType,
        basePrice: basePrice ? parseFloat(basePrice) : 0,
        basePrice4: basePrice4 ? parseFloat(basePrice4) : null,
        runFlatSurcharge: (serviceType === 'TIRE_CHANGE' && runFlatSurcharge) ? parseFloat(runFlatSurcharge) : null,
        disposalFee: (['TIRE_CHANGE', 'MOTORCYCLE_TIRE'].includes(serviceType) && disposalFee) ? parseFloat(disposalFee) : null,
        wheelSizeSurcharge: wheelSizeSurcharge || null,
        balancingPrice: (serviceType === 'WHEEL_CHANGE' && balancingPrice) ? parseFloat(balancingPrice) : null,
        storagePrice: (serviceType === 'WHEEL_CHANGE' && storagePrice) ? parseFloat(storagePrice) : null,
        refrigerantPricePer100ml: (serviceType === 'CLIMATE_SERVICE' && refrigerantPrice) ? parseFloat(refrigerantPrice) : null,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : 60,
        durationMinutes4: durationMinutes4 ? parseInt(durationMinutes4) : null,
        balancingMinutes: (serviceType === 'WHEEL_CHANGE' && balancingMinutes) ? parseInt(balancingMinutes) : null,
        storageAvailable: (serviceType === 'WHEEL_CHANGE' && storageAvailable) ? storageAvailable : false,
        description: description || null,
        internalNotes: internalNotes || null,
        isActive: isActive !== undefined ? isActive : true,
        servicePackages: packages && packages.length > 0 ? {
          create: packages.map((pkg: any) => ({
            packageType: pkg.packageType,
            name: pkg.name,
            description: pkg.description || null,
            price: parseFloat(pkg.price),
            durationMinutes: parseInt(pkg.durationMinutes),
            isActive: pkg.isActive !== undefined ? pkg.isActive : true
          }))
        } : undefined
      },
      include: {
        servicePackages: true
      }
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    console.error('Service creation error:', error)
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    console.error('Request body was:', JSON.stringify(body))
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Services', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
