import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// PATCH /api/employee/announcements/[id] - Ankündigung als gelesen markieren
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id
    const announcementId = params.id

    // Prüfen ob Ankündigung existiert
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId }
    })

    if (!announcement) {
      return NextResponse.json(
        { error: 'Ankündigung nicht gefunden' },
        { status: 404 }
      )
    }

    // Als gelesen markieren (upsert - falls schon gelesen, nichts tun)
    await prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: {
          announcementId,
          employeeId
        }
      },
      create: {
        announcementId,
        employeeId
      },
      update: {
        readAt: new Date()
      }
    })

    // View Count erhöhen
    await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        viewCount: {
          increment: 1
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking announcement as read:', error)
    return NextResponse.json(
      { error: 'Fehler beim Markieren der Ankündigung' },
      { status: 500 }
    )
  }
}

// DELETE /api/employee/announcements/[id] - Ankündigung löschen (nur für Admins/HR)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id
    const announcementId = params.id

    // Prüfen ob Berechtigung
    const hasPermission = await prisma.b24EmployeePermission.findFirst({
      where: {
        employeeId,
        resource: 'announcements',
        canDelete: true
      }
    })

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen' },
        { status: 403 }
      )
    }

    // Ankündigung löschen
    await prisma.announcement.delete({
      where: { id: announcementId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Ankündigung' },
      { status: 500 }
    )
  }
}

// PUT /api/employee/announcements/[id] - Ankündigung bearbeiten (nur für Admins/HR)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = session.user.id
    const announcementId = params.id

    // Prüfen ob Berechtigung
    const hasPermission = await prisma.b24EmployeePermission.findFirst({
      where: {
        employeeId,
        resource: 'announcements',
        canWrite: true
      }
    })

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten' },
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
      isActive,
      publishedAt,
      expiresAt,
      attachments
    } = body

    // Ankündigung aktualisieren
    const announcement = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title,
        content,
        type,
        priority,
        isPinned,
        isActive,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        attachments: attachments ? JSON.stringify(attachments) : null
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

    return NextResponse.json(announcement)
  } catch (error) {
    console.error('Error updating announcement:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren der Ankündigung' },
      { status: 500 }
    )
  }
}
