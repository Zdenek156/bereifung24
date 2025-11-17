import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tireRequestSchema = z.object({
  season: z.enum(['SUMMER', 'WINTER', 'ALL_SEASON']),
  width: z.number().min(135).max(325),
  aspectRatio: z.number().min(30).max(85),
  diameter: z.number().min(13).max(24),
  loadIndex: z.number().min(50).max(150).optional(),
  speedRating: z.string().optional(),
  isRunflat: z.boolean().default(false),
  quantity: z.number().min(1).max(4).default(4),
  preferredBrands: z.string().optional(),
  additionalNotes: z.string().optional(),
  needByDate: z.string(),
  zipCode: z.string().length(5),
  radiusKm: z.number().min(5).max(100).default(25),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = tireRequestSchema.parse(body)

    // Check if needByDate is at least 7 days in the future
    const needByDate = new Date(validatedData.needByDate)
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 7)

    if (needByDate < minDate) {
      return NextResponse.json(
        { error: 'Das Benötigt-bis Datum muss mindestens 7 Tage in der Zukunft liegen' },
        { status: 400 }
      )
    }

    // Create tire request
    const tireRequest = await prisma.tireRequest.create({
      data: {
        customerId: session.user.customerId!,
        season: validatedData.season,
        width: validatedData.width,
        aspectRatio: validatedData.aspectRatio,
        diameter: validatedData.diameter,
        loadIndex: validatedData.loadIndex,
        speedRating: validatedData.speedRating,
        isRunflat: validatedData.isRunflat,
        quantity: validatedData.quantity,
        preferredBrands: validatedData.preferredBrands,
        additionalNotes: validatedData.additionalNotes,
        needByDate: needByDate,
        zipCode: validatedData.zipCode,
        radiusKm: validatedData.radiusKm,
        status: 'PENDING',
      },
    })

    return NextResponse.json({
      success: true,
      requestId: tireRequest.id,
      message: 'Reifenanfrage erfolgreich erstellt',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating tire request:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tireRequests = await prisma.tireRequest.findMany({
      where: {
        customerId: session.user.customerId!,
      },
      include: {
        _count: {
          select: {
            offers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ requests: tireRequests })
  } catch (error) {
    console.error('Error fetching tire requests:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
