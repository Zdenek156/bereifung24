import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is admin
    if (!session?.user?.email || session.user.email !== 'zdenek@bereifung24.de') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // PENDING, APPROVED, PAID, CANCELLED

    const payments = await prisma.affiliatePayment.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        influencer: {
          select: {
            id: true,
            email: true,
            code: true,
            channelName: true,
            platform: true,
            paymentMethod: true,
            iban: true,
            bic: true,
            accountHolder: true,
            paypalEmail: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[ADMIN] Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
