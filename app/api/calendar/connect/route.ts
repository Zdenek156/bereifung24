import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAuthUrl } from '@/lib/google-calendar'

// Initiate OAuth flow for workshop or employee
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
    
    // type: 'workshop' or 'employee'
    // employeeId: required if type is 'employee'
    
    if (type === 'employee' && !employeeId) {
      return NextResponse.json(
        { error: 'Employee ID erforderlich' },
        { status: 400 }
      )
    }
    
    // State contains workshopId and optionally employeeId
    const state = JSON.stringify({
      workshopId: session.user.workshopId,
      employeeId: type === 'employee' ? employeeId : null,
      type: type
    })
    
    const authUrl = getAuthUrl(state)
    
    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Calendar connect error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Verbinden' },
      { status: 500 }
    )
  }
}
