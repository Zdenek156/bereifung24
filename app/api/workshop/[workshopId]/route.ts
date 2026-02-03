import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/workshop/[workshopId]
 * Returns complete workshop information including employees for Google Calendar
 */
export async function GET(
  request: Request,
  { params }: { params: { workshopId: string } }
) {
  try {
    const { workshopId } = params

    // Fetch workshop with employees and Google Calendar credentials
    const workshop = await prisma.workshop.findUnique({
      where: { id: workshopId },
      select: {
        id: true,
        companyName: true,
        openingHours: true,
        googleCalendarId: true,
        user: {
          select: {
            street: true,
            zipCode: true,
            city: true,
            phone: true,
            email: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        employees: {
          where: {
            status: 'ACTIVE',
            googleCalendarId: { not: null }
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            googleCalendarId: true,
            googleRefreshToken: true
          }
        }
      }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop not found' },
        { status: 404 }
      )
    }

    // Calculate average rating
    const averageRating = workshop.reviews.length > 0
      ? workshop.reviews.reduce((sum, r) => sum + r.rating, 0) / workshop.reviews.length
      : 0

    // Flatten user data and add calculated fields
    const response = {
      id: workshop.id,
      companyName: workshop.companyName,
      street: workshop.user?.street || '',
      postalCode: workshop.user?.zipCode || '',
      city: workshop.user?.city || '',
      phone: workshop.user?.phone || '',
      email: workshop.user?.email || '',
      averageRating,
      reviewCount: workshop.reviews.length,
      openingHours: workshop.openingHours,
      googleCalendarId: workshop.googleCalendarId,
      employees: workshop.employees
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching workshop:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workshop' },
      { status: 500 }
    )
  }
}
