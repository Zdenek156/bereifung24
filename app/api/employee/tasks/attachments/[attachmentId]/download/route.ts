import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'

// GET /api/employee/tasks/attachments/[attachmentId]/download - Datei herunterladen
export async function GET(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = params.attachmentId

    // Find attachment
    const attachment = await prisma.employeeTaskAttachment.findUnique({
      where: { id: attachmentId }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anhang nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if file exists
    if (!existsSync(attachment.filePath)) {
      return NextResponse.json(
        { error: 'Datei nicht gefunden' },
        { status: 404 }
      )
    }

    // Read file
    const fileBuffer = await readFile(attachment.filePath)

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.fileType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
        'Content-Length': attachment.fileSize.toString()
      }
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Herunterladen der Datei' },
      { status: 500 }
    )
  }
}

// DELETE /api/employee/tasks/attachments/[attachmentId]/download - Anhang löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = params.attachmentId
    const employeeId = session.user.id

    // Find attachment
    const attachment = await prisma.employeeTaskAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: true
      }
    })

    if (!attachment) {
      return NextResponse.json(
        { error: 'Anhang nicht gefunden' },
        { status: 404 }
      )
    }

    // Only uploader or task creator can delete
    if (attachment.uploadedById !== employeeId && attachment.task.createdById !== employeeId) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Delete from database
    await prisma.employeeTaskAttachment.delete({
      where: { id: attachmentId }
    })

    // Optionally delete file from disk (commented out for safety)
    // if (existsSync(attachment.filePath)) {
    //   await unlink(attachment.filePath)
    // }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Anhangs' },
      { status: 500 }
    )
  }
}
