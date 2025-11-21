import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Ungültiger Bestätigungslink' },
        { status: 400 }
      )
    }

    // Finde User mit diesem Token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Bestätigungslink' },
        { status: 400 }
      )
    }

    // Setze emailVerified und lösche Token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        verificationToken: null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'E-Mail erfolgreich bestätigt! Du kannst dich jetzt anmelden.'
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
