import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// POST /api/email/sync - E-Mails mit IMAP-Server synchronisieren
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { folder, limit } = body

    // Check if user is B24_EMPLOYEE
    const isB24Employee = session.user?.role === 'B24_EMPLOYEE'
    const emailService = new EmailService(session.user.id, isB24Employee)
    
    // Prüfen ob Einstellungen existieren
    const hasSettings = await emailService.hasSettings()
    if (!hasSettings) {
      return NextResponse.json(
        { error: 'Email-Einstellungen nicht konfiguriert. Bitte speichern Sie zuerst Ihre E-Mail-Zugangsdaten.' },
        { status: 400 }
      )
    }
    
    await emailService.syncMessages(folder || 'INBOX', limit)

    return NextResponse.json({ success: true, message: 'Sync completed' })
  } catch (error: any) {
    console.error('Error syncing messages:', error)
    
    // Detaillierte Fehlermeldung für Verbindungsfehler
    let errorMessage = error.message || 'Failed to sync messages'
    if (errorMessage.includes('EAUTH') || errorMessage.includes('auth')) {
      errorMessage = 'Authentifizierung fehlgeschlagen. Bitte überprüfen Sie E-Mail-Adresse und Passwort.'
    } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ETIMEDOUT')) {
      errorMessage = 'Verbindung zum E-Mail-Server fehlgeschlagen. Bitte überprüfen Sie Server-Adresse und Port.'
    } else if (errorMessage.includes('encryption key')) {
      errorMessage = 'Verschlüsselungsfehler. Bitte speichern Sie die Einstellungen erneut.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
