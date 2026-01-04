import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { encrypt } from '@/lib/encryption'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'documents')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// GET - List documents for current employee
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find employee
    const employee = await prisma.b24Employee.findFirst({
      where: { email: session.user.email },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 403 })
    }

    // Get documents
    const documents = await prisma.employeeDocument.findMany({
      where: {
        employeeId: employee.id,
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Upload new document
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find employee
    const employee = await prisma.b24Employee.findFirst({
      where: { email: session.user.email },
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    if (!file || !type || !title) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 10MB)' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const employeeDir = path.join(UPLOAD_DIR, employee.id)
    if (!existsSync(employeeDir)) {
      await mkdir(employeeDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = path.extname(file.name)
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const uniqueFileName = `${timestamp}_${safeFileName}`
    const filePath = path.join(employeeDir, uniqueFileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Encrypt file path for storage
    const encryptedPath = encrypt(filePath)

    // Create document record
    const document = await prisma.employeeDocument.create({
      data: {
        employeeId: employee.id,
        type,
        title,
        description: description || null,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: encryptedPath,
        uploadedById: employee.id,
        category: category || null,
        tags: [],
        accessLog: [],
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, document })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
