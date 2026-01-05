import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

// GET /api/employee/announcements - Liste aller aktiven Ankündigungen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id

    // Query-Parameter
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    // Alle aktiven Ankündigungen abrufen
    const where: any = {
      isActive: true,
      publishedAt: {
        lte: new Date() // Bereits veröffentlicht
      },
      OR: [
        { expiresAt: null }, // Kein Ablaufdatum
        { expiresAt: { gte: new Date() } } // Oder noch nicht abgelaufen
      ]
    }

    if (type) {
      where.type = type
    }

    const announcements = await prisma.announcement.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        readBy: {
          where: {
            employeeId
          },
          select: {
            readAt: true
          }
        }
      },
      orderBy: [
        { isPinned: 'desc' }, // Gepinnte zuerst
        { priority: 'desc' }, // Dann nach Priorität
        { publishedAt: 'desc' } // Neueste zuerst
      ]
    })

    // Formatieren für Frontend
    const formattedAnnouncements = announcements.map(announcement => ({
      ...announcement,
      isRead: announcement.readBy.length > 0,
      readAt: announcement.readBy[0]?.readAt || null,
      readBy: undefined // Entfernen, brauchen wir nicht im Frontend
    }))

    return NextResponse.json(formattedAnnouncements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Ankündigungen' },
      { status: 500 }
    )
  }
}

// POST /api/employee/announcements - Neue Ankündigung erstellen (nur für Admins/HR)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id

    // Prüfen ob Berechtigung zum Erstellen von Ankündigungen
    const hasPermission = await prisma.b24EmployeePermission.findFirst({
      where: {
        employeeId,
        resource: 'announcements',
        canWrite: true
      }
    })

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Erstellen von Ankündigungen' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      content,
      type,
      priority,
      isPinned,
      publishedAt,
      expiresAt,
      attachments
    } = body

    // Validierung
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Titel und Inhalt sind erforderlich' },
        { status: 400 }
      )
    }

    // Ankündigung erstellen
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type || 'GENERAL',
        priority: priority || 'NORMAL',
        isPinned: isPinned || false,
        isActive: true,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
        authorId: employeeId
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Ankündigung' },
      { status: 500 }
    )
  }
}
