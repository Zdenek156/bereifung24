import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Disconnect Google Calendar for workshop or employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const { type, employeeId } = await request.json()
    
    if (type === 'workshop') {
      // Disconnect workshop calendar
      await prisma.workshop.update({
        where: { id: session.user.workshopId },
        data: {
          googleCalendarId: null,
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiry: null,
        }
      })
      
      return NextResponse.json({ success: true })
    } else if (type === 'employee' && employeeId) {
      // Disconnect employee calendar
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          googleCalendarId: null,
          googleAccessToken: null,
          googleRefreshToken: null,
          googleTokenExpiry: null,
        }
      })
      
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Ungültige Parameter' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Calendar disconnect error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Trennen' },
      { status: 500 }
    )
  }
}
