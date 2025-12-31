import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Debug notification settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await prisma.adminNotificationSetting.findMany()
    
    return NextResponse.json({
      count: settings.length,
      settings: settings.map(s => ({
        id: s.id,
        email: s.email,
        name: s.name,
        notifyCustomerRegistration: s.notifyCustomerRegistration,
        notifyWorkshopRegistration: s.notifyWorkshopRegistration,
        notifyInfluencerApplication: s.notifyInfluencerApplication
      }))
    })

  } catch (error) {
    console.error('Debug fetch error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
