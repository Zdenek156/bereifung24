import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || session.user.role !== 'B24_EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validierung
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Nur Bilddateien erlaubt' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu groß (max 5MB)' }, { status: 400 })
    }

    // Erstelle uploads/profiles Ordner falls nicht vorhanden
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profiles')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generiere eindeutigen Dateinamen
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${session.user.b24EmployeeId}-${timestamp}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Speichere Datei
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update Datenbankli
    const imageUrl = `/uploads/profiles/${fileName}`
    
    await prisma.b24Employee.update({
      where: { id: session.user.b24EmployeeId },
      data: { profileImage: imageUrl }
    })

    return NextResponse.json({
      success: true,
      imageUrl
    })
  } catch (error) {
    console.error('Error uploading profile image:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen des Bildes' },
      { status: 500 }
    )
  }
}
