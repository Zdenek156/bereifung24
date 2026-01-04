import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { decrypt } from '@/lib/encryption'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get document
    const document = await prisma.employeeDocument.findFirst({
      where: {
        id: params.id,
        employeeId: employee.id, // Ensure employee can only access their own documents
      },
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Decrypt file path
    const filePath = decrypt(document.fileUrl)

    // Read file
    const fileBuffer = await readFile(filePath)

    // Log access
    const accessLog = (document.accessLog as any[]) || []
    accessLog.push({
      userId: employee.id,
      accessedAt: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
    })

    // Update access log
    await prisma.employeeDocument.update({
      where: { id: document.id },
      data: { accessLog },
    })

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
