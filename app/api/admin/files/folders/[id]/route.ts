import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'files')

// PUT - Rename folder
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const body = await request.json()
    const { name } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      )
    }

    const folder = await prisma.fileFolder.findUnique({
      where: { id: params.id }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Check if folder with same name exists in same parent
    const existingFolder = await prisma.fileFolder.findFirst({
      where: {
        name: name.trim(),
        parentId: folder.parentId,
        id: { not: params.id }
      }
    })

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 400 }
      )
    }

    const updatedFolder = await prisma.fileFolder.update({
      where: { id: params.id },
      data: {
        name: name.trim()
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            files: true,
            subfolders: true
          }
        }
      }
    })

    return NextResponse.json(updatedFolder)
  } catch (error) {
    console.error('Error renaming folder:', error)
    return NextResponse.json(
      { error: 'Failed to rename folder' },
      { status: 500 }
    )
  }
}

// DELETE - Delete folder (and all contents)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const folder = await prisma.fileFolder.findUnique({
      where: { id: params.id },
      include: {
        files: true,
        subfolders: true
      }
    })

    if (!folder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }

    // Recursively delete all files in folder and subfolders
    async function deleteFilesInFolder(folderId: string) {
      const filesInFolder = await prisma.fileUpload.findMany({
        where: { folderId }
      })

      // Delete files from filesystem
      for (const file of filesInFolder) {
        const filePath = join(UPLOAD_DIR, file.storagePath)
        if (existsSync(filePath)) {
          await unlink(filePath).catch(err => 
            console.error(`Failed to delete file ${file.storagePath}:`, err)
          )
        }
      }

      // Get subfolders and delete their contents
      const subfolders = await prisma.fileFolder.findMany({
        where: { parentId: folderId }
      })

      for (const subfolder of subfolders) {
        await deleteFilesInFolder(subfolder.id)
      }
    }

    await deleteFilesInFolder(params.id)

    // Delete folder (cascade will delete files and subfolders from DB)
    await prisma.fileFolder.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting folder:', error)
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    )
  }
}
