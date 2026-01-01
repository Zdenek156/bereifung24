import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET - Liste aller gesperrten E-Mails
export async function GET(request: NextRequest) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const blacklistedEmails = await prisma.deletedUserEmail.findMany({
      orderBy: { deletedAt: 'desc' }
    })

    return NextResponse.json(blacklistedEmails)

  } catch (error) {
    console.error('Error fetching email blacklist:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Blacklist' },
      { status: 500 }
    )
  }
}
