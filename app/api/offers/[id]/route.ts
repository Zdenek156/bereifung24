import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Einzelnes Angebot abrufen
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const offer = await prisma.offer.findUnique({
      where: { id: params.id },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            taxMode: true,
            website: true,
            description: true,
            openingHours: true,
            iban: true,
            accountHolder: true,
            paypalEmail: true,
            paymentMethods: true,
            calendarMode: true,
            user: {
              select: {
                email: true,
                phone: true,
                street: true,
                zipCode: true,
                city: true,
                latitude: true,
                longitude: true,
              }
            },
            employees: {
              where: {
                googleRefreshToken: { not: null }
              },
              select: {
                id: true,
                name: true,
                email: true,
                workingHours: true
              }
            }
          }
        },
        tireRequest: {
          include: {
            customer: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (!offer) {
      return NextResponse.json(
        { error: 'Angebot nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung
    if (session.user.role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({
        where: { userId: session.user.id }
      })
      
      if (!customer || offer.tireRequest.customerId !== customer.id) {
        return NextResponse.json(
          { error: 'Nicht autorisiert für dieses Angebot' },
          { status: 403 }
        )
      }
    } else if (session.user.role === 'WORKSHOP') {
      const workshop = await prisma.workshop.findUnique({
        where: { userId: session.user.id }
      })
      
      if (!workshop || offer.workshopId !== workshop.id) {
        return NextResponse.json(
          { error: 'Nicht autorisiert für dieses Angebot' },
          { status: 403 }
        )
      }
    }

    // Format workshop data
    const formattedOffer = {
      ...offer,
      selectedTireOptionIds: offer.selectedTireOptionIds || [],
      workshop: {
        id: offer.workshop.id,
        companyName: offer.workshop.companyName,
        taxMode: offer.workshop.taxMode,
        street: offer.workshop.user.street || '',
        zipCode: offer.workshop.user.zipCode || '',
        city: offer.workshop.user.city || '',
        phone: offer.workshop.user.phone || '',
        email: offer.workshop.user.email,
        website: offer.workshop.website,
        description: offer.workshop.description,
        openingHours: offer.workshop.openingHours,
        latitude: offer.workshop.user.latitude,
        longitude: offer.workshop.user.longitude,
        paymentMethods: offer.workshop.paymentMethods,
        iban: offer.workshop.iban,
        accountHolder: offer.workshop.accountHolder,
        paypalEmail: offer.workshop.paypalEmail,
        calendarMode: offer.workshop.calendarMode,
        employees: offer.workshop.employees,
      }
    }

    return NextResponse.json({ offer: formattedOffer })

  } catch (error) {
    console.error('Offer fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden des Angebots' },
      { status: 500 }
    )
  }
}
