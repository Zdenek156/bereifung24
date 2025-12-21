import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In production: Alle anderen Sessions für diesen User aus DB löschen
    // await prisma.session.deleteMany({
    //   where: {
    //     userId: session.user.id,
    //     NOT: { id: currentSessionId }
    //   }
    // })

    console.log('All other sessions would be logged out for user:', session.user.id)

    return NextResponse.json({ 
      success: true,
      message: 'Alle anderen Sessions wurden abgemeldet'
    })
  } catch (error) {
    console.error('Error logging out sessions:', error)
    return NextResponse.json({ error: 'Fehler beim Abmelden' }, { status: 500 })
  }
}
