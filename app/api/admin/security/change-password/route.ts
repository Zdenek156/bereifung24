import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    console.log('Session in change-password:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      role: session?.user?.role
    })

    if (!session || !session.user || !session.user.id || session.user.role !== 'ADMIN') {
      console.log('Unauthorized - returning 401')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    // Aktuellen User aus DB holen
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Wenn User ein Passwort hat, verifizieren
    if (user.password) {
      const isValid = await bcrypt.compare(currentPassword, user.password)
      if (!isValid) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
      }
    } else {
      // Kein aktuelles Passwort nötig für OAuth-User, die erstmalig ein Passwort setzen
      if (currentPassword && currentPassword.trim() !== '') {
        return NextResponse.json({ error: 'Sie haben noch kein Passwort gesetzt' }, { status: 400 })
      }
    }

    // Neues Passwort hashen
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Passwort aktualisieren
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
