import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get customer and their vehicles
    const customer = await prisma.customer.findUnique({
      where: { userId: session.user.id },
      include: {
        vehicles: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return NextResponse.json({ vehicles: [] })
    }

    const vehicles = customer.vehicles

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Error fetching customer vehicles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    )
  }
}
