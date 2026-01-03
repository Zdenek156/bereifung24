import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { saveEmailSettings } from '@/lib/email/email-service'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/email/settings - E-Mail-Einstellungen abrufen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.emailSettings.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        imapHost: true,
        imapPort: true,
        imapUser: true,
        imapTls: true,
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpSecure: true,
        syncEnabled: true,
        syncInterval: true,
        lastSyncedAt: true,
        // Passwörter NICHT zurückgeben
      },
    })

    if (!settings) {
      return NextResponse.json(
        { error: 'Email settings not configured' },
        { status: 404 }
      )
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching email settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email settings' },
      { status: 500 }
    )
  }
}

// PUT /api/email/settings - E-Mail-Einstellungen aktualisieren
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      imapHost,
      imapPort,
      imapUser,
      imapPassword,
      imapTls,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      syncEnabled,
      syncInterval,
    } = body

    // Validierung
    if (!imapHost || !imapUser || !imapPassword || !smtpHost || !smtpUser) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const settings = await saveEmailSettings(session.user.id, {
      imapHost,
      imapPort: imapPort || 993,
      imapUser,
      imapPassword,
      imapTls: imapTls !== undefined ? imapTls : true,
      smtpHost,
      smtpPort: smtpPort || 465,
      smtpUser,
      smtpPassword: smtpPassword || imapPassword, // Normalerweise gleiches Passwort
      smtpSecure: smtpSecure !== undefined ? smtpSecure : true,
      syncEnabled: syncEnabled !== undefined ? syncEnabled : true,
      syncInterval: syncInterval || 300000, // 5 Minuten
    })

    // Passwörter nicht zurückgeben
    const { imapPassword: _, smtpPassword: __, ...safeSettings } = settings

    return NextResponse.json(safeSettings)
  } catch (error: any) {
    console.error('Error updating email settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update email settings' },
      { status: 500 }
    )
  }
}
