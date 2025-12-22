import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, workshopVerifiedEmailTemplate } from '@/lib/email'
import { requireAdminOrEmployee } from '@/lib/permissions'

// PUT - Update workshop data including assigned employee
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const body = await req.json()
    const { assignedEmployeeId, ...otherData } = body

    // Filter out undefined/null values
    const updateData: any = {}
    if (assignedEmployeeId !== undefined) {
      updateData.assignedEmployeeId = assignedEmployeeId || null
    }
    
    // Add other fields that might be updated
    if (otherData.companyName) updateData.companyName = otherData.companyName
    if (otherData.street) updateData.street = otherData.street
    if (otherData.zip) updateData.zip = otherData.zip
    if (otherData.city) updateData.city = otherData.city
    if (otherData.phone) updateData.phone = otherData.phone
    if (otherData.email) updateData.email = otherData.email
    if (otherData.website) updateData.website = otherData.website

    const workshop = await prisma.workshop.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignedEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true
          }
        }
      }
    })

    return NextResponse.json(workshop)

  } catch (error) {
    console.error('Workshop update error:', error)
    return NextResponse.json({ error: 'Failed to update workshop' }, { status: 500 })
  }
}

// PATCH - Update workshop verification status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

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
            lastName: workshop.user.lastName,
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
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

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
