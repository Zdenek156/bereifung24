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
        street: true,
        postalCode: true,
        city: true,
        phone: true,
        email: true,
        averageRating: true,
        reviewCount: true,
        openingHours: true,
        googleCalendarId: true,
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

    return NextResponse.json(workshop)
  } catch (error) {
    console.error('Error fetching workshop:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workshop' },
      { status: 500 }
    )
  }
}
