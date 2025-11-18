import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tireRequest = await prisma.tireRequest.findFirst({
      where: {
        id: params.id,
        customerId: session.user.customerId!,
      },
      include: {
        offers: {
          include: {
            workshop: {
              select: {
                companyName: true,
                user: {
                  select: {
                    street: true,
                    zipCode: true,
                    city: true,
                    phone: true,
                  }
                }
              },
            },
          },
          orderBy: {
            price: 'asc',
          },
        },
      },
    })

    if (!tireRequest) {
      return NextResponse.json(
        { error: 'Anfrage nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ request: tireRequest })
  } catch (error) {
    console.error('Error fetching tire request:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
