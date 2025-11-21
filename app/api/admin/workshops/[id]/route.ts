import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, workshopVerifiedEmailTemplate } from '@/lib/email'

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
      },
      include: {
        user: true
      }
    })

    // Wenn Workshop verifiziert wurde, E-Mail senden
    if (isVerified) {
      try {
        await sendEmail({
          to: workshop.user.email,
          subject: 'Deine Werkstatt wurde freigeschaltet!',
          html: workshopVerifiedEmailTemplate({
            firstName: workshop.user.firstName,
            companyName: workshop.companyName
          })
        })
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // E-Mail-Fehler nicht nach außen weitergeben
      }
    }

    return NextResponse.json(workshop)

  } catch (error) {
    console.error('Workshop update error:', error)
    return NextResponse.json({ error: 'Failed to update workshop' }, { status: 500 })
  }
}

// DELETE - Delete workshop and associated user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Hole die Werkstatt mit User ID
    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
      select: { userId: true, id: true }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Workshop nicht gefunden' }, { status: 404 })
    }

    // Lösche alle abhängigen Daten manuell
    // 1. Lösche alle Offers
    await prisma.offer.deleteMany({
      where: { workshopId: workshop.id }
    })

    // 2. Lösche alle Bookings
    await prisma.booking.deleteMany({
      where: { workshopId: workshop.id }
    })

    // 3. Lösche alle Reviews
    await prisma.review.deleteMany({
      where: { workshopId: workshop.id }
    })

    // 4. Lösche alle Commissions
    await prisma.commission.deleteMany({
      where: { workshopId: workshop.id }
    })

    // 5. Lösche die Werkstatt
    await prisma.workshop.delete({
      where: { id: workshop.id }
    })

    // 7. Lösche den User
    await prisma.user.delete({
      where: { id: workshop.userId }
    })

    return NextResponse.json({ success: true, message: 'Werkstatt erfolgreich gelöscht' })

  } catch (error) {
    console.error('Workshop delete error:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Werkstatt' }, { status: 500 })
  }
}
