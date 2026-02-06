import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { workshopId: string } }
) {
  try {
    const { workshopId } = params

    // Fetch all services for this workshop with their packages
    const services = await prisma.workshopService.findMany({
      where: {
        workshopId,
        isActive: true,
      },
      include: {
        servicePackages: {
          where: {
            isActive: true,
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
      orderBy: {
        serviceType: 'asc',
      },
    })

    // Format the response
    const formattedServices = services
      .filter(service => service.servicePackages && service.servicePackages.length > 0) // Only services with active packages
      .map(service => ({
        id: service.id,
        type: service.serviceType,
        name: service.serviceType, // Use serviceType as name
        packages: service.servicePackages.map(pkg => ({
          id: pkg.id,
          type: pkg.packageType,
          name: pkg.name,
          price: Number(pkg.price),
          duration: pkg.durationMinutes,
          description: pkg.description || '',
        })),
      }))

    return NextResponse.json({
      success: true,
      services: formattedServices,
    })
  } catch (error) {
    console.error('[API] Error fetching workshop services:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    )
  }
}
