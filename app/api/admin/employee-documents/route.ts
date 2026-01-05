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

// Document types that only HR can upload
const HR_ONLY_TYPES = ['contract', 'payslip', 'tax', 'social_security', 'company']

// POST - HR uploads document for an employee
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/HR
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Find admin employee
    const adminEmployee = await prisma.b24Employee.findFirst({
      where: { email: session.user.email },
    })

    if (!adminEmployee) {
      return NextResponse.json({ error: 'Admin employee not found' }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const employeeId = formData.get('employeeId') as string

    if (!file || !type || !title || !employeeId) {
      return NextResponse.json(
        { error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    // Verify employee exists
    const targetEmployee = await prisma.b24Employee.findUnique({
      where: { id: employeeId },
    })

    if (!targetEmployee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      )
    }

    // Check if HR is allowed to upload this type (only HR types)
    if (!HR_ONLY_TYPES.includes(type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Dieser Dokumenttyp ist für HR-Upload nicht erlaubt.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datei zu groß (max 10MB)' },
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
      'image/jpg',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Ungültiger Dateityp. Nur PDF, Word, JPG, PNG erlaubt.' },
        { status: 400 }
      )
    }

    // Create upload directory if it doesn't exist
    const employeeDir = path.join(UPLOAD_DIR, employeeId)
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
        employeeId: employeeId,
        type,
        title,
        description: description || null,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl: encryptedPath,
        uploadedById: adminEmployee.id,
        uploadedByRole: 'HR',
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
        employee: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // TODO: Send email notification to employee that HR uploaded a document

    return NextResponse.json({ 
      document,
      message: 'Dokument erfolgreich hochgeladen' 
    })
  } catch (error) {
    console.error('Error uploading HR document:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen des Dokuments' },
      { status: 500 }
    )
  }
}

// GET - List all documents for a specific employee (HR view)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin/HR
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get employeeId from query params
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId required' }, { status: 400 })
    }

    // Get documents
    const documents = await prisma.employeeDocument.findMany({
      where: {
        employeeId: employeeId,
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

    // Group by uploadedByRole
    const hrDocuments = documents.filter(d => d.uploadedByRole === 'HR')
    const employeeDocuments = documents.filter(d => d.uploadedByRole === 'EMPLOYEE')

    return NextResponse.json({ 
      all: documents,
      hrDocuments,
      employeeDocuments 
    })
  } catch (error) {
    console.error('Error fetching employee documents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
