import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdminOrCEO } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import fs from 'fs'

/**
 * POST /api/admin/invoices/settings/upload-logo
 * Upload company logo for invoices
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: PNG, JPG, SVG' },
        { status: 400 }
      )
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Max 2MB' },
        { status: 400 }
      )
    }

    // Create upload directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'invoices')
    if (!fs.existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Generate filename
    const extension = path.extname(file.name)
    const filename = `logo-${Date.now()}${extension}`
    const filepath = path.join(uploadDir, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Get relative URL path
    const logoUrl = `/uploads/invoices/${filename}`

    // Update settings with logo URL
    await prisma.invoiceSettings.update({
      where: { id: 'default-settings' },
      data: { logoUrl }
    })

    console.log(`✅ Logo hochgeladen: ${logoUrl}`)

    return NextResponse.json({
      success: true,
      data: { logoUrl }
    })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload logo' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/invoices/settings/upload-logo
 * Delete company logo
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    const hasAccess = await isAdminOrCEO(session)
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current logo URL
    const settings = await prisma.invoiceSettings.findUnique({
      where: { id: 'default-settings' },
      select: { logoUrl: true }
    })

    if (settings?.logoUrl) {
      // Delete file
      const filepath = path.join(process.cwd(), 'public', settings.logoUrl)
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
      }

      // Remove from settings
      await prisma.invoiceSettings.update({
        where: { id: 'default-settings' },
        data: { logoUrl: null }
      })

      console.log(`✅ Logo gelöscht: ${settings.logoUrl}`)
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error deleting logo:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete logo' },
      { status: 500 }
    )
  }
}
