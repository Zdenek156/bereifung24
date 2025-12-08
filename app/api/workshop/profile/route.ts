import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/profile - Get workshop profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: true,
      },
    })

    if (!user || !user.workshop) {
      return NextResponse.json(
        { error: 'Werkstatt nicht gefunden' },
        { status: 404 }
      )
    }

    // Combine user and workshop data
    const profile = {
      // User data
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      street: user.street,
      zipCode: user.zipCode,
      city: user.city,
      
      // Workshop data
      companyName: user.workshop.companyName,
      taxId: user.workshop.taxId,
      taxMode: user.workshop.taxMode,
      website: user.workshop.website,
      description: user.workshop.description,
      logoUrl: user.workshop.logoUrl,
      openingHours: user.workshop.openingHours,
      isVerified: user.workshop.isVerified,
      verifiedAt: user.workshop.verifiedAt,
      
      // Banking
      iban: user.workshop.iban,
      accountHolder: user.workshop.accountHolder,
      sepaMandateRef: user.workshop.sepaMandateRef,
      sepaMandateDate: user.workshop.sepaMandateDate,
      
      // Payment Methods
      paymentMethods: user.workshop.paymentMethods,
      
      // Notifications
      emailNotifyRequests: user.workshop.emailNotifyRequests,
      emailNotifyOfferAccepted: user.workshop.emailNotifyOfferAccepted,
      emailNotifyBookings: user.workshop.emailNotifyBookings,
      emailNotifyReviews: user.workshop.emailNotifyReviews,
      emailNotifyReminders: user.workshop.emailNotifyReminders,
      emailNotifyCommissions: user.workshop.emailNotifyCommissions,
      
      // Calendar Settings
      calendarMode: user.workshop.calendarMode,
      googleRefreshToken: user.workshop.googleRefreshToken,
      googleCalendarId: user.workshop.googleCalendarId,
      
      // Timestamps
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden des Profils' },
      { status: 500 }
    )
  }
}

// PATCH /api/workshop/profile - Update workshop profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      // User fields
      firstName,
      lastName,
      phone,
      street,
      zipCode,
      city,
      
      // Workshop fields
      companyName,
      taxId,
      taxMode,
      website,
      description,
      openingHours,
      
      // Banking fields
      iban,
      accountHolder,
      
      // Payment Methods
      paymentMethods,
      
      // Notifications
      emailNotifyRequests,
      emailNotifyOfferAccepted,
      emailNotifyBookings,
      emailNotifyReviews,
      emailNotifyReminders,
      emailNotifyCommissions,
    } = body

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        phone,
        street,
        zipCode,
        city,
      },
    })

    // Update workshop data
    const updatedWorkshop = await prisma.workshop.update({
      where: { userId: session.user.id },
      data: {
        companyName,
        taxId,
        taxMode,
        website,
        description,
        openingHours,
        iban,
        accountHolder,
        paymentMethods,
        emailNotifyRequests,
        emailNotifyOfferAccepted,
        emailNotifyBookings,
        emailNotifyReviews,
        emailNotifyReminders,
        emailNotifyCommissions,
        // Update SEPA mandate date if IBAN changed
        ...(iban && iban !== body.oldIban ? { sepaMandateDate: new Date() } : {}),
      },
    })

    return NextResponse.json({
      message: 'Profil erfolgreich aktualisiert',
      user: updatedUser,
      workshop: updatedWorkshop,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Profils' },
      { status: 500 }
    )
  }
}
