import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check workshops
    const workshops = await prisma.workshop.findMany({
      select: {
        id: true,
        companyName: true,
        serviceRadius: true,
        user: {
          select: {
            email: true,
            zipCode: true,
            city: true,
            latitude: true,
            longitude: true
          }
        },
        _count: {
          select: {
            offers: true
          }
        }
      }
    })

    return NextResponse.json({
      totalWorkshops: workshops.length,
      workshops: workshops.map(w => ({
        id: w.id,
        name: w.companyName,
        email: w.user.email,
        location: `${w.user.zipCode} ${w.user.city}`,
        hasCoordinates: !!(w.user.latitude && w.user.longitude),
        serviceRadius: w.serviceRadius,
        totalOffers: w._count.offers
      }))
    })
  } catch (error) {
    console.error('Error fetching workshops:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
