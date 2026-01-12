import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import bcrypt from 'bcryptjs'
import { randomBytes } from 'crypto'

// GET - List all B24 employees
export async function GET(request: NextRequest) {
  try {
    // Check permission - requires 'hr' read access or ADMIN
    const permissionError = await requirePermission('hr', 'read')
    if (permissionError) return permissionError

    const employees = await prisma.b24Employee.findMany({
      include: {
        permissions: true,
        _count: {
          select: {
            assignedProspects: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Error fetching employees:', error)
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 })
  }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
  try {
    // Check permission - requires 'hr' write access or ADMIN
    const permissionError = await requirePermission('hr', 'write')
    if (permissionError) return permissionError

    const body = await request.json()
    const { 
      email, 
      firstName, 
      lastName, 
      phone, 
      position, 
      department, 
      permissions,
      // Hierarchy
      managerId,
      hierarchyLevel,
      // Contract
      employmentType,
      workTimeModel,
      weeklyHours,
      monthlyHours,
      dailyHours,
      workDaysPerWeek,
      workStartTime,
      workEndTime,
      coreTimeStart,
      coreTimeEnd,
      flexTimeStart,
      flexTimeEnd,
      contractStart,
      contractEnd,
      probationEndDate,
      noticePeriod,
      // Salary
      salaryType,
      monthlySalary,
      annualSalary,
      hourlyRate,
      isMinijob,
      miniJobExempt,
      // Tax & SV
      taxId,
      taxClass,
      childAllowance,
      religion,
      socialSecurityNumber,
      healthInsurance,
      healthInsuranceRate,
      isChildless,
      // Bank
      bankName,
      iban,
      bic
    } = body

    // Check if email already exists (in B24Employee OR User table)
    const existingEmployee = await prisma.b24Employee.findUnique({
      where: { email }
    })

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingEmployee || existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }

    // Generate setup token for password creation
    const setupToken = randomBytes(32).toString('hex')
    const setupTokenExpiry = new Date()
    setupTokenExpiry.setHours(setupTokenExpiry.getHours() + 24) // Token valid for 24 hours

    // Create employee with all HR data
    const employee = await prisma.b24Employee.create({
      data: {
        // Basic info
        email,
        firstName,
        lastName,
        phone,
        position,
        department,
        setupToken,
        setupTokenExpiry,
        password: null, // Will be set when they use the setup link
        isActive: true,
        emailVerified: false,
        // Hierarchy
        managerId,
        hierarchyLevel: hierarchyLevel || 0,
        // Contract
        employmentType,
        workTimeModel,
        weeklyHours,
        monthlyHours,
        dailyHours,
        workDaysPerWeek,
        workStartTime,
        workEndTime,
        coreTimeStart,
        coreTimeEnd,
        flexTimeStart,
        flexTimeEnd,
        contractStart: contractStart ? new Date(contractStart) : undefined,
        contractEnd: contractEnd ? new Date(contractEnd) : undefined,
        probationEndDate: probationEndDate ? new Date(probationEndDate) : undefined,
        noticePeriod,
        // Salary
        salaryType,
        monthlySalary,
        annualSalary,
        hourlyRate,
        isMinijob: isMinijob || false,
        miniJobExempt: miniJobExempt || false,
        // Tax & SV
        taxId,
        taxClass,
        childAllowance,
        religion: religion || 'NONE',
        socialSecurityNumber,
        healthInsurance,
        healthInsuranceRate,
        isChildless: isChildless || false,
        // Bank
        bankName,
        iban,
        bic
      }
    })

    // Create permissions if provided
    if (permissions && Array.isArray(permissions)) {
      await prisma.b24EmployeePermission.createMany({
        data: permissions.map((perm: any) => ({
          employeeId: employee.id,
          resource: perm.resource,
          canRead: perm.canRead || false,
          canWrite: perm.canWrite || false,
          canDelete: perm.canDelete || false
        }))
      })
    }

    // Send setup email
    const setupLink = `${process.env.NEXTAUTH_URL}/auth/employee/setup-password?token=${setupToken}`
    
    try {
      const { sendEmail } = await import('@/lib/email')
      await sendEmail({
        to: employee.email,
        subject: 'Bereifung24 - Passwort festlegen',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">Bereifung24</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Willkommen im Team!</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hallo ${employee.firstName},
              </p>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Sie wurden als Mitarbeiter bei Bereifung24 angelegt. Um Zugang zum Admin-Bereich zu erhalten, 
                müssen Sie zunächst Ihr Passwort festlegen.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${setupLink}" 
                   style="background-color: #2563eb; color: white; padding: 14px 28px; 
                          text-decoration: none; border-radius: 6px; font-weight: bold; 
                          display: inline-block;">
                  Passwort festlegen
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px;">
                Dieser Link ist 24 Stunden gültig.
              </p>
            </div>
            
            <div style="background-color: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Bereifung24
              </p>
            </div>
          </div>
        `
      })
    } catch (emailError) {
      console.error('Error sending setup email:', emailError)
      // Continue even if email fails
    }

    return NextResponse.json(employee, { status: 201 })
  } catch (error) {
    console.error('Error creating employee:', error)
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 })
  }
}
