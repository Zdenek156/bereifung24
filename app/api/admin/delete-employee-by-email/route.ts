import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Delete employee by email
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    // Find and delete employee by email
    const employee = await prisma.b24Employee.findUnique({
      where: { email }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    await prisma.b24Employee.delete({
      where: { email }
    })

    return NextResponse.json({ 
      success: true, 
      message: `Employee ${email} deleted successfully`,
      deletedEmployee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName
      }
    })
  } catch (error) {
    console.error('Error deleting employee by email:', error)
    return NextResponse.json({ 
      error: 'Failed to delete employee',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
