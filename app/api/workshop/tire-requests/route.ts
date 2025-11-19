import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Workshop holt verfügbare Anfragen in ihrer Nähe
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    // Hole Workshop-Profil
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id },
      include: { user: true }
    })

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop nicht gefunden' },
        { status: 404 }
      )
    }

    // Hole alle offenen Anfragen
    // TODO: Filter nach Entfernung basierend auf zipCode
    const tireRequests = await prisma.tireRequest.findMany({
      where: {
        status: {
          in: ['PENDING', 'QUOTED'] // Anfragen die noch offen sind oder bereits Angebote haben
        }
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                zipCode: true,
                city: true
              }
            }
          }
        },
        offers: {
          where: {
            workshopId: workshop.id
          },
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            offers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ requests: tireRequests })
  } catch (error) {
    console.error('Tire requests fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Anfragen' },
      { status: 500 }
    )
  }
}
