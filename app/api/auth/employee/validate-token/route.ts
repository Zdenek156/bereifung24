import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { setupToken: token },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        position: true,
        department: true,
        setupTokenExpiry: true,
        emailVerified: true
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Ungültiger Token' }, { status: 404 })
    }

    // Check if token is expired
    if (employee.setupTokenExpiry && employee.setupTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Token ist abgelaufen' }, { status: 400 })
    }

    // Check if already verified
    if (employee.emailVerified) {
      return NextResponse.json({ error: 'Passwort wurde bereits gesetzt' }, { status: 400 })
    }

    return NextResponse.json({ 
      valid: true,
      employee: {
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position,
        department: employee.department
      }
    })
  } catch (error) {
    console.error('Error validating token:', error)
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}
