import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'files')
const MAX_TOTAL_SIZE = 2 * 1024 * 1024 * 1024 // 2GB
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB per file

// Ensure upload directory exists
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true })
  }
}

// GET - List files and folders
export async function GET(request: NextRequest) {
  try {
    const permissionError = await requirePermission('files', 'read')
    if (permissionError) return permissionError

    const { searchParams } = new URL(request.url)
    const folderId = searchParams.get('folderId') || null
    const search = searchParams.get('search') || ''

    // Get current folder info (if in a subfolder)
    let currentFolder = null
    if (folderId) {
      currentFolder = await prisma.fileFolder.findUnique({
        where: { id: folderId },
        include: {
          createdBy: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          parent: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })
    }

    // Get subfolders in current folder
    const folders = await prisma.fileFolder.findMany({
      where: {
        parentId: folderId,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        })
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
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get files in current folder
    const files = await prisma.fileUpload.findMany({
      where: {
        folderId: folderId,
        ...(search && {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        })
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get total storage used
    const totalSize = await prisma.fileUpload.aggregate({
      _sum: {
        size: true
      }
    })

    return NextResponse.json({
      currentFolder,
      folders,
      files,
      storageUsed: totalSize._sum.size || 0,
      storageLimit: MAX_TOTAL_SIZE
    })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    const permissionError = await requirePermission('files', 'write')
    if (permissionError) return permissionError

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get or find employee ID
    let employeeId = session.user.b24EmployeeId
    if (!employeeId && session.user.role === 'ADMIN') {
      const employee = await prisma.b24Employee.findUnique({
        where: { email: session.user.email! }
      })
      if (employee) {
        employeeId = employee.id
      } else {
        return NextResponse.json(
          { error: 'Admin employee profile not found. Please re-login.' },
          { status: 401 }
        )
      }
    }

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee profile required' },
        { status: 401 }
      )
    }

    // Check total storage limit
    const totalSize = await prisma.fileUpload.aggregate({
      _sum: {
        size: true
      }
    })

    const currentSize = totalSize._sum.size || 0

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Check if upload would exceed total storage limit
    if (currentSize + file.size > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: 'Storage limit exceeded. Please delete some files first.' },
        { status: 400 }
      )
    }

    // Ensure upload directory exists
    await ensureUploadDir()

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(7)
    const extension = file.name.split('.').pop()
    const storageName = `${timestamp}-${randomString}.${extension}`
    const storagePath = join(UPLOAD_DIR, storageName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(storagePath, buffer)

    // Create database record
    const fileRecord = await prisma.fileUpload.create({
      data: {
        name: file.name,
        storagePath: storageName, // Store relative path
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        folderId: folderId || null,
        uploadedById: employeeId,
        description: description || null
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

    return NextResponse.json(fileRecord, { status: 201 })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
