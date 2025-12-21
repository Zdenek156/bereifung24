import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

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
    console.log('Request body parsed, userId:', session.user.id)

    // Aktuellen User aus DB holen
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    console.log('User found:', { hasUser: !!user, hasPassword: !!user?.password })

    if (!user) {
      console.log('User not found, returning 404')
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Wenn User ein Passwort hat, verifizieren
    if (user.password) {
      console.log('User has password, verifying...')
      const isValid = await bcrypt.compare(currentPassword, user.password)
      console.log('Password verification result:', isValid)
      if (!isValid) {
        return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 400 })
      }
    } else {
      console.log('User has no password (OAuth user)')
      // Kein aktuelles Passwort nötig für OAuth-User, die erstmalig ein Passwort setzen
      if (currentPassword && currentPassword.trim() !== '') {
        return NextResponse.json({ error: 'Sie haben noch kein Passwort gesetzt' }, { status: 400 })
      }
    }

    console.log('About to hash new password...')
    // Neues Passwort hashen
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    console.log('Password hashed, updating database...')

    // Passwort aktualisieren
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })
    console.log('Password updated successfully')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
