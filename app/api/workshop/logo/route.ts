import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// POST /api/workshop/logo - Upload logo
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user is a workshop
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Nur Werkstätten können ein Logo hochladen' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Nur JPG, PNG und WebP Dateien sind erlaubt' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'Datei ist zu groß. Maximal 5MB erlaubt.' 
      }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'logos')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const ext = path.extname(file.name)
    const filename = `${workshop.id}-${Date.now()}${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Delete old logo if exists
    if (workshop.logoUrl) {
      const oldFilename = workshop.logoUrl.split('/').pop()
      if (oldFilename) {
        const oldFilepath = path.join(uploadsDir, oldFilename)
        try {
          if (existsSync(oldFilepath)) {
            await unlink(oldFilepath)
          }
        } catch (error) {
          console.error('Error deleting old logo:', error)
        }
      }
    }

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Update database
    const logoUrl = `/uploads/logos/${filename}`
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { logoUrl }
    })

    return NextResponse.json({ 
      success: true,
      logoUrl 
    })

  } catch (error) {
    console.error('Logo upload error:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Hochladen des Logos' 
    }, { status: 500 })
  }
}

// DELETE /api/workshop/logo - Delete logo
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Check if user is a workshop
    const workshop = await prisma.workshop.findUnique({
      where: { userId: session.user.id }
    })

    if (!workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    if (!workshop.logoUrl) {
      return NextResponse.json({ error: 'Kein Logo vorhanden' }, { status: 400 })
    }

    // Delete file
    const filename = workshop.logoUrl.split('/').pop()
    if (filename) {
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'logos', filename)
      try {
        if (existsSync(filepath)) {
          await unlink(filepath)
        }
      } catch (error) {
        console.error('Error deleting logo file:', error)
      }
    }

    // Update database
    await prisma.workshop.update({
      where: { id: workshop.id },
      data: { logoUrl: null }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Logo delete error:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Löschen des Logos' 
    }, { status: 500 })
  }
}
