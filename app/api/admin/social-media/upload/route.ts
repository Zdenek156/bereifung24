import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

// POST /api/admin/social-media/upload - Upload image for social media post
export async function POST(req: NextRequest) {
  const authError = await requireAdminOrEmployee()
  if (authError) return authError

  try {
    const formData = await req.formData()
    const file = formData.get('image') as File

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei hochgeladen' }, { status: 400 })
    }

    // Validate file type - Instagram/FB accept only JPG/PNG
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Nur JPG und PNG Dateien sind erlaubt (Instagram/Facebook akzeptieren kein WebP)'
      }, { status: 400 })
    }

    // Validate file size (max 8MB - Instagram limit)
    const maxSize = 8 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Datei ist zu groß. Maximal 8MB erlaubt.'
      }, { status: 400 })
    }

    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'social-media')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate filename
    const ext = file.type === 'image/png' ? '.png' : '.jpg'
    const filename = `social-${Date.now()}${ext}`
    const filepath = path.join(uploadsDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const imageUrl = `/uploads/social-media/${filename}`

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Error uploading social media image:', error)
    return NextResponse.json({ error: 'Upload fehlgeschlagen' }, { status: 500 })
  }
}
