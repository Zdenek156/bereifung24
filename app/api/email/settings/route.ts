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

    console.log('📧 GET /api/email/settings called')
    console.log('   User ID:', session.user.id)
    console.log('   User Role:', session.user.role)
    console.log('   User Email:', session.user.email)

    const isB24Employee = session.user.role === 'B24_EMPLOYEE'
    const whereClause = isB24Employee
      ? { b24EmployeeId: session.user.id }
      : { userId: session.user.id }

    console.log('   isB24Employee:', isB24Employee)
    console.log('   whereClause:', whereClause)

    const settings = await prisma.emailSettings.findUnique({
      where: whereClause,
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

    console.log('   Settings found:', settings ? 'YES' : 'NO')
    if (settings) {
      console.log('   IMAP User:', settings.imapUser)
      console.log('   IMAP Host:', settings.imapHost)
    }

    if (!settings) {
      console.log('   ❌ Returning needsConfiguration: true')
      return NextResponse.json({ settings: null, needsConfiguration: true })
    }

    console.log('   ✅ Returning needsConfiguration: false')
    return NextResponse.json({ settings, needsConfiguration: false })
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

    console.log('📧 PUT /api/email/settings called')
    console.log('   User ID:', session.user.id)
    console.log('   User Role:', session.user.role)
    console.log('   User Email:', session.user.email)

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

    console.log('   Received data:')
    console.log('     imapHost:', imapHost)
    console.log('     imapUser:', imapUser)
    console.log('     imapPassword:', imapPassword ? 'SET' : 'NOT SET')

    // Validierung
    if (!imapHost || !imapUser || !imapPassword || !smtpHost || !smtpUser) {
      console.log('   ❌ Validation failed - missing fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const isB24Employee = session.user.role === 'B24_EMPLOYEE'
    console.log('   isB24Employee:', isB24Employee)

    const settings = await saveEmailSettings(
      session.user.id,
      {
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
      },
      isB24Employee
    )

    console.log('   ✅ Settings saved successfully')
    console.log('     Settings ID:', settings.id)
    console.log('     User ID field:', settings.userId)
    console.log('     B24Employee ID field:', settings.b24EmployeeId)

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
