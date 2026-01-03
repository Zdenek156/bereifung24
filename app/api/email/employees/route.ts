import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/email/employees - Liste aller Mitarbeiter mit E-Mail-Adressen
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Nur Mitarbeiter mit Email-Einstellungen (haben E-Mail-Zugang)
    const employees = await prisma.user.findMany({
      where: {
        emailSettings: {
          isNot: null,
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        emailSettings: {
          select: {
            imapUser: true, // Ihre offizielle E-Mail-Adresse
          },
        },
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })

    // Format für EmployeePicker
    const formattedEmployees = employees.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.emailSettings?.imapUser || emp.email,
      displayName: `${emp.firstName} ${emp.lastName} <${emp.emailSettings?.imapUser || emp.email}>`,
    }))

    return NextResponse.json(formattedEmployees)
  } catch (error: any) {
    console.error('Error fetching employees:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch employees' },
      { status: 500 }
    )
  }
}
