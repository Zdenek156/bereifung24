import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Update workshop verification status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { isVerified } = body

    if (typeof isVerified !== 'boolean') {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    const workshop = await prisma.workshop.update({
      where: {
        id: params.id
      },
      data: {
        isVerified,
        verifiedAt: isVerified ? new Date() : null
      }
    })

    return NextResponse.json(workshop)

  } catch (error) {
    console.error('Workshop update error:', error)
    return NextResponse.json({ error: 'Failed to update workshop' }, { status: 500 })
  }
}
