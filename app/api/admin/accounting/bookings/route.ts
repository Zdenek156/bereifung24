import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { bookingService } from '@/lib/accounting/bookingService'

// POST /api/admin/accounting/bookings - Create manual booking
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      bookingDate, 
      debitAccountId, 
      creditAccountId, 
      amount, 
      description, 
      referenceNumber,
      sourceType 
    } = body

    // Validate required fields
    if (!bookingDate || !debitAccountId || !creditAccountId || !amount || !description) {
      return NextResponse.json(
        { error: 'Alle Pflichtfelder müssen ausgefüllt sein' },
        { status: 400 }
      )
    }

    if (debitAccountId === creditAccountId) {
      return NextResponse.json(
        { error: 'Soll- und Haben-Konto müssen unterschiedlich sein' },
        { status: 400 }
      )
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Betrag muss größer als 0 sein' },
        { status: 400 }
      )
    }

    // Create the booking
    const entry = await bookingService.createBooking({
      bookingDate: new Date(bookingDate),
      debitAccountId,
      creditAccountId,
      amount,
      description,
      referenceNumber: referenceNumber || undefined,
      sourceType: sourceType || 'MANUAL',
      sourceId: null,
      createdByUserId: session.user.id
    })

    console.log(`✅ Manual booking created: ${entry.entryNumber}`)

    return NextResponse.json({ 
      success: true, 
      entry 
    })
  } catch (error: any) {
    console.error('Error creating manual booking:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Erstellen der Buchung' },
      { status: 500 }
    )
  }
}
