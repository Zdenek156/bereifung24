import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Fetch all notification settings
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.adminNotificationSetting.findMany({
      orderBy: {
        email: 'asc'
      }
    })

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Notification settings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Create new notification setting
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { email, name } = body

    if (!email) {
      return NextResponse.json({ error: 'Email ist erforderlich' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.adminNotificationSetting.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json({ error: 'Diese E-Mail-Adresse ist bereits registriert' }, { status: 400 })
    }

    const setting = await prisma.adminNotificationSetting.create({
      data: {
        email,
        name: name || null,
        notifyCustomerRegistration: true,
        notifyWorkshopRegistration: true,
        notifyInfluencerApplication: false
      }
    })

    return NextResponse.json(setting)

  } catch (error) {
    console.error('Notification setting creation error:', error)
    return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 })
  }
}

// PATCH - Update notification setting
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, notifyCustomerRegistration, notifyWorkshopRegistration, notifyInfluencerApplication } = body

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 })
    }

    const updateData: any = {}
    if (typeof notifyCustomerRegistration === 'boolean') {
      updateData.notifyCustomerRegistration = notifyCustomerRegistration
    }
    if (typeof notifyWorkshopRegistration === 'boolean') {
      updateData.notifyWorkshopRegistration = notifyWorkshopRegistration
    }
    if (typeof notifyInfluencerApplication === 'boolean') {
      updateData.notifyInfluencerApplication = notifyInfluencerApplication
    }

    const setting = await prisma.adminNotificationSetting.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json(setting)

  } catch (error) {
    console.error('Notification setting update error:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}

// DELETE - Delete notification setting
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID ist erforderlich' }, { status: 400 })
    }

    await prisma.adminNotificationSetting.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Notification setting deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
  }
}
