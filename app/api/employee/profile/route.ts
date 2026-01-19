import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/encryption'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find employee
    const employee = await prisma.b24Employee.findFirst({
      where: {
        email: session.user.email,
      },
      include: {
        profile: true,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 403 }
      )
    }

    // Decrypt sensitive fields if profile exists
    let profile = null
    if (employee.profile) {
      profile = {
        ...employee.profile,
        taxId: employee.profile.taxId ? decrypt(employee.profile.taxId) : null,
        socialSecurityId: employee.profile.socialSecurityId
          ? decrypt(employee.profile.socialSecurityId)
          : null,
        bankAccount: employee.profile.bankAccount
          ? decrypt(employee.profile.bankAccount)
          : null,
      }
    }

    return NextResponse.json({
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        position: employee.position,
        department: employee.department,
        profileImage: employee.profileImage,
      },
      profile,
    })
  } catch (error) {
    console.error('Error fetching employee profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find employee
    const employee = await prisma.b24Employee.findFirst({
      where: {
        email: session.user.email,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Encrypt sensitive fields
    const dataToSave: any = {
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      birthPlace: body.birthPlace || null,
      nationality: body.nationality || null,
      address: body.address || null,
      city: body.city || null,
      postalCode: body.postalCode || null,
      taxClass: body.taxClass || null,
      bankName: body.bankName || null,
      bic: body.bic || null,
      emergencyContactName: body.emergencyContactName || null,
      emergencyContactPhone: body.emergencyContactPhone || null,
      emergencyContactRelation: body.emergencyContactRelation || null,
    }

    // Encrypt sensitive fields only if provided
    if (body.taxId) {
      dataToSave.taxId = encrypt(body.taxId)
    }
    if (body.socialSecurityId) {
      dataToSave.socialSecurityId = encrypt(body.socialSecurityId)
    }
    if (body.bankAccount) {
      dataToSave.bankAccount = encrypt(body.bankAccount)
    }

    // Upsert profile
    const profile = await prisma.employeeProfile.upsert({
      where: {
        employeeId: employee.id,
      },
      create: {
        employeeId: employee.id,
        ...dataToSave,
      },
      update: dataToSave,
    })

    // No sync to B24Employee needed - EmployeeProfile is single source of truth for bank data

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error('Error updating employee profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
