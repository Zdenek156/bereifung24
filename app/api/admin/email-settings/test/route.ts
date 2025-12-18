import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { testEmail } = body

    if (!testEmail) {
      return NextResponse.json(
        { error: 'Test-Email-Adresse erforderlich' },
        { status: 400 }
      )
    }

    // Sende Test-Email
    await sendEmail({
      to: testEmail,
      subject: '✅ Test-Email von Bereifung24',
      html: `
        <h2>Email-Konfiguration erfolgreich!</h2>
        <p>Diese Test-Email bestätigt, dass Ihre SMTP-Einstellungen korrekt konfiguriert sind.</p>
        <p><strong>Gesendet am:</strong> ${new Date().toLocaleString('de-DE')}</p>
        <p><strong>Von:</strong> Bereifung24 Admin-Panel</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Wenn Sie diese Email erhalten haben, funktioniert der Email-Versand einwandfrei.
        </p>
      `
    })

    console.log(`✅ Test-Email gesendet an ${testEmail}`)

    return NextResponse.json({
      success: true,
      message: `Test-Email erfolgreich an ${testEmail} gesendet`
    })
  } catch (error: any) {
    console.error('Fehler beim Senden der Test-Email:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Senden der Test-Email',
        details: error.message || String(error)
      },
      { status: 500 }
    )
  }
}
