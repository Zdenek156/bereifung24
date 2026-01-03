import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/email/signature - Signatur abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const signature = await prisma.emailSignature.findUnique({
      where: { userId: session.user.id },
    })

    if (!signature) {
      return NextResponse.json(
        { htmlContent: '', enabled: false },
        { status: 200 }
      )
    }

    return NextResponse.json(signature)
  } catch (error: any) {
    console.error('Error fetching signature:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch signature' },
      { status: 500 }
    )
  }
}

// PUT /api/email/signature - Signatur aktualisieren
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { htmlContent, enabled } = body

    const signature = await prisma.emailSignature.upsert({
      where: { userId: session.user.id },
      update: {
        htmlContent: htmlContent || '',
        enabled: enabled !== undefined ? enabled : true,
      },
      create: {
        userId: session.user.id,
        htmlContent: htmlContent || '',
        enabled: enabled !== undefined ? enabled : true,
      },
    })

    return NextResponse.json(signature)
  } catch (error: any) {
    console.error('Error updating signature:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update signature' },
      { status: 500 }
    )
  }
}
