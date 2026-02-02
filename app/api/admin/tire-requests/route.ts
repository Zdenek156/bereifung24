import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/tire-requests
 * Get all tire requests with advanced filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Filter parameters
    const status = searchParams.get('status') // PENDING, OPEN, QUOTED, ACCEPTED, REJECTED, EXPIRED
    const serviceType = searchParams.get('serviceType') // tires, brakes, etc.
    const customerSearch = searchParams.get('customer') // Search by name/email
    const workshopId = searchParams.get('workshopId') // Filter by workshop
    const zipCode = searchParams.get('zipCode') // Filter by region
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const hasOffers = searchParams.get('hasOffers') // true, false, any
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'createdAt' // createdAt, needByDate, offersCount
    const sortOrder = searchParams.get('sortOrder') || 'desc' // asc, desc

    // Build where clause
    const where: any = {}

    // Status filter
    if (status && status !== 'ALL') {
      if (status === 'EXPIRED') {
        // Expired: needByDate < today AND status IN (PENDING, OPEN, QUOTED)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        where.needByDate = { lt: today }
        where.status = { in: ['PENDING', 'OPEN', 'QUOTED'] }
      } else {
        where.status = status
      }
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    // Customer search (name or email)
    if (customerSearch) {
      where.customer = {
        user: {
          OR: [
            { firstName: { contains: customerSearch, mode: 'insensitive' } },
            { lastName: { contains: customerSearch, mode: 'insensitive' } },
            { email: { contains: customerSearch, mode: 'insensitive' } }
          ]
        }
      }
    }

    // Workshop filter
    if (workshopId) {
      where.offers = {
        some: {
          workshopId
        }
      }
    }

    // ZIP code filter
    if (zipCode) {
      where.zipCode = { startsWith: zipCode }
    }

    // Has offers filter
    if (hasOffers === 'true') {
      where.offers = { some: {} }
    } else if (hasOffers === 'false') {
      where.offers = { none: {} }
    }

    // Build orderBy
    let orderBy: any = {}
    if (sortBy === 'offersCount') {
      // Sorting by offer count requires aggregation (handled after query)
      orderBy = { createdAt: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Count total for pagination
    const total = await prisma.tireRequest.count({ where })

    // Fetch requests (only tire requests for now, can expand to other types)
    const tireRequests = await prisma.tireRequest.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            vehicleType: true
          }
        },
        offers: {
          select: {
            id: true,
            price: true,
            status: true,
            createdAt: true,
            workshop: {
              select: {
                id: true,
                companyName: true,
                user: {
                  select: {
                    city: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        adminNotes: {
          select: {
            id: true,
            note: true,
            isImportant: true,
            createdAt: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        booking: {
          select: {
            id: true,
            appointmentDate: true,
            status: true
          }
        }
      }
    })

    // Format response
    const formattedRequests = tireRequests.map((req) => {
      // Determine correct serviceType with fallback logic for old requests
      let serviceType = req.serviceType || 'TIRE_CHANGE'
      
      // For old requests without proper serviceType, detect from additionalNotes
      if (serviceType === 'TIRE_CHANGE' && req.additionalNotes) {
        if (req.additionalNotes.includes('RÄDER UMSTECKEN')) {
          serviceType = 'WHEEL_CHANGE'
        } else if (req.additionalNotes.includes('KLIMASERVICE')) {
          serviceType = 'CLIMATE_SERVICE'
        } else if (req.additionalNotes.includes('ACHSVERMESSUNG')) {
          serviceType = 'ALIGNMENT_BOTH'
        } else if (req.additionalNotes.includes('BREMSEN-SERVICE')) {
          serviceType = 'BRAKE_SERVICE'
        } else if (req.additionalNotes.includes('BATTERIE-SERVICE')) {
          serviceType = 'BATTERY_SERVICE'
        } else if (req.additionalNotes.includes('🔧 REPARATUR')) {
          serviceType = 'TIRE_REPAIR'
        }
      }
      
      return {
        id: req.id,
        type: 'TIRE',
        status: req.status,
        serviceType,
        createdAt: req.createdAt,
      needByDate: req.needByDate,
      customer: {
        name: `${req.customer.user.firstName} ${req.customer.user.lastName}`,
        email: req.customer.user.email,
        phone: req.customer.user.phone
      },
      vehicle: req.vehicle ? {
        make: req.vehicle.make,
        model: req.vehicle.model,
        year: req.vehicle.year,
        type: req.vehicle.vehicleType
      } : null,
      location: {
        zipCode: req.zipCode,
        city: req.city,
        radiusKm: req.radiusKm
      },
      serviceDetails: {
        season: req.season,
        tireSize: `${req.width}/${req.aspectRatio} R${req.diameter}`,
        quantity: req.quantity,
        preferredBrands: req.preferredBrands,
        notes: req.additionalNotes
      },
      offers: req.offers.map(offer => ({
        id: offer.id,
        workshopId: offer.workshop.id,
        workshopName: offer.workshop.companyName,
        city: offer.workshop.user?.city,
        price: parseFloat(offer.price.toString()),
        status: offer.status,
        createdAt: offer.createdAt
      })),
      offersCount: req.offers.length,
      booking: req.booking,
      adminNotes: req.adminNotes,
      notesCount: req.adminNotes.length,
      hasImportantNotes: req.adminNotes.some(n => n.isImportant)
      }
    })

    // Sort by offer count if requested
    if (sortBy === 'offersCount') {
      formattedRequests.sort((a, b) => {
        const diff = b.offersCount - a.offersCount
        return sortOrder === 'asc' ? -diff : diff
      })
    }

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching tire requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tire requests' },
      { status: 500 }
    )
  }
}
