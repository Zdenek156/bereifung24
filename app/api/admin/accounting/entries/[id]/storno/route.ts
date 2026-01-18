import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { AccountingBookingService } from '@/lib/accounting/bookingService'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { reason } = await request.json()

    if (!reason || reason.trim().length < 3) {
      return NextResponse.json(
        { error: 'Bitte geben Sie einen Grund für die Stornierung an (mindestens 3 Zeichen)' },
        { status: 400 }
      )
    }

    const bookingService = new AccountingBookingService()
    const stornoEntry = await bookingService.createStorno(
      params.id,
      session.user.id,
      reason
    )

    return NextResponse.json({ 
      success: true, 
      stornoEntry,
      message: 'Buchung erfolgreich storniert'
    })
  } catch (error: any) {
    console.error('Error creating storno:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Stornieren der Buchung' },
      { status: 500 }
    )
  }
}
