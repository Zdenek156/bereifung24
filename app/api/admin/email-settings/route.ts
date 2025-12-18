import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Hole Email-Einstellungen
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole alle Email-Settings aus der Datenbank
    const settings = await prisma.adminApiSetting.findMany({
      where: {
        key: {
          in: ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM']
        }
      }
    })

    // Konvertiere zu Object
    const settingsObj: any = {
      host: '',
      port: '587',
      user: '',
      password: '',
      from: ''
    }

    settings.forEach(setting => {
      switch (setting.key) {
        case 'EMAIL_HOST':
          settingsObj.host = setting.value || ''
          break
        case 'EMAIL_PORT':
          settingsObj.port = setting.value || '587'
          break
        case 'EMAIL_USER':
          settingsObj.user = setting.value || ''
          break
        case 'EMAIL_PASSWORD':
          settingsObj.password = setting.value || ''
          break
        case 'EMAIL_FROM':
          settingsObj.from = setting.value || ''
          break
      }
    })

    return NextResponse.json({ settings: settingsObj })
  } catch (error) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einstellungen' },
      { status: 500 }
    )
  }
}

// POST - Speichere Email-Einstellungen
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { host, port, user, password, from } = body

    if (!host || !port || !user || !password || !from) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      )
    }

    // Speichere/Update jedes Setting
    const settings = [
      { key: 'EMAIL_HOST', value: host, description: 'SMTP Host für Email-Versand' },
      { key: 'EMAIL_PORT', value: port, description: 'SMTP Port' },
      { key: 'EMAIL_USER', value: user, description: 'SMTP Benutzername' },
      { key: 'EMAIL_PASSWORD', value: password, description: 'SMTP Passwort (verschlüsselt)' },
      { key: 'EMAIL_FROM', value: from, description: 'Absender-Email-Adresse' },
    ]

    for (const setting of settings) {
      await prisma.adminApiSetting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting
      })
    }

    console.log('✅ Email-Einstellungen gespeichert von Admin:', session.user.email)

    return NextResponse.json({ 
      success: true,
      message: 'Email-Einstellungen erfolgreich gespeichert'
    })
  } catch (error) {
    console.error('Error saving email settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    )
  }
}
