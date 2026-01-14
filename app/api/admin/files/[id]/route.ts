import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { createReadStream, existsSync } from 'fs'
import { stat } from 'fs/promises'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'files')

// GET - Download file
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const file = await prisma.fileUpload.findUnique({
      where: { id: params.id }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const filePath = join(UPLOAD_DIR, file.storagePath)

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      )
    }

    // Update download counter
    await prisma.fileUpload.update({
      where: { id: params.id },
      data: {
        downloads: { increment: 1 },
        lastDownloadAt: new Date()
      }
    })

    // Read file and return as stream
    const fileBuffer = await stat(filePath).then(() => {
      return new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = []
        const stream = createReadStream(filePath)
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => resolve(Buffer.concat(chunks)))
        stream.on('error', reject)
      })
    })

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
        'Content-Length': file.size.toString()
      }
    })
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}

// PUT - Update file metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const body = await request.json()
    const { name, description, folderId } = body

    const file = await prisma.fileUpload.findUnique({
      where: { id: params.id }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    const updatedFile = await prisma.fileUpload.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(folderId !== undefined && { folderId })
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json(updatedFile)
  } catch (error) {
    console.error('Error updating file:', error)
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    )
  }
}

// DELETE - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const file = await prisma.fileUpload.findUnique({
      where: { id: params.id }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete from filesystem
    const filePath = join(UPLOAD_DIR, file.storagePath)
    if (existsSync(filePath)) {
      await unlink(filePath)
    }

    // Delete from database
    await prisma.fileUpload.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
