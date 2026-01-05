import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { EmailService } from '@/lib/email/email-service'

// GET /api/email/stats - E-Mail Statistiken abrufen
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const emailService = new EmailService(session.user.id)
    
    // Check if email settings exist
    const hasSettings = await emailService.hasSettings()
    if (!hasSettings) {
      return NextResponse.json({ 
        unreadCount: 0, 
        needsConfiguration: true 
      })
    }

    // Get cached messages from INBOX
    const messages = await emailService.getCachedMessages('INBOX', 100)
    
    // Count unread messages
    const unreadCount = messages.filter(msg => !msg.isRead).length

    return NextResponse.json({ 
      unreadCount,
      totalCount: messages.length,
      needsConfiguration: false 
    })
  } catch (error: any) {
    console.error('Error fetching email stats:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch email stats' },
      { status: 500 }
    )
  }
}
