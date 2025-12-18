import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen lang sein' }, { status: 400 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { setupToken: token }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Ungültiger Token' }, { status: 404 })
    }

    // Check if token is expired
    if (employee.setupTokenExpiry && employee.setupTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Token ist abgelaufen' }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update employee
    await prisma.b24Employee.update({
      where: { id: employee.id },
      data: {
        password: hashedPassword,
        emailVerified: true,
        setupToken: null, // Consume token
        setupTokenExpiry: null
      }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Passwort wurde erfolgreich gesetzt'
    })
  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json({ error: 'Failed to set password' }, { status: 500 })
  }
}
