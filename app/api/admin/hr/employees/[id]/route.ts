import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasApplication } from '@/lib/applications'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to HR application or is ADMIN/B24_EMPLOYEE
    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      const hasAccess = await hasApplication(session.user.id, 'hr')
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const employeeId = params.id

    // Get employee with full data
    const employee = await prisma.b24Employee.findUnique({
      where: { id: employeeId },
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: employee 
    })
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch employee' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = params.id
    
    console.log('[PUT /api/admin/hr/employees/[id]] Session user:', {
      email: session.user.email,
      role: session.user.role,
      id: session.user.id
    })
    
    // Get the current user's employee record to check permissions
    const currentEmployee = await prisma.b24Employee.findFirst({
      where: { email: session.user.email }
    })
    
    console.log('[PUT /api/admin/hr/employees/[id]] Current employee:', currentEmployee ? { id: currentEmployee.id, email: currentEmployee.email } : 'null')

    // Permission logic:
    // 1. ADMIN can edit anyone
    // 2. B24_EMPLOYEE with HR application AND (editing themselves OR they are manager/Geschäftsführer)
    if (session.user.role !== 'ADMIN') {
      // Must be B24_EMPLOYEE with HR access
      if (session.user.role !== 'B24_EMPLOYEE') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      
      const hasAccess = await hasApplication(session.user.id, 'hr')
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden - No HR access' }, { status: 403 })
      }

      // Check if editing themselves (allowed) or others (requires manager/Geschäftsführer role)
      const isSelf = currentEmployee?.id === employeeId
      
      if (!isSelf) {
        // Check if user is Geschäftsführer or Manager (hierarchyLevel <= 1)
        // 0 = Geschäftsführung, 1 = Manager (can edit all)
        // 2 = Teamleiter, 3+ = Mitarbeiter (can only edit self)
        const isManager = currentEmployee && (
          currentEmployee.position?.toLowerCase().includes('geschäftsführer') ||
          currentEmployee.position?.toLowerCase().includes('ceo') ||
          currentEmployee.position?.toLowerCase().includes('cco') ||
          currentEmployee.position?.toLowerCase().includes('head of') ||
          currentEmployee.position?.toLowerCase().includes('director') ||
          currentEmployee.position?.toLowerCase().includes('manager') ||
          (currentEmployee.hierarchyLevel !== null && currentEmployee.hierarchyLevel <= 1)
        )
        
        if (!isManager) {
          return NextResponse.json(
            { error: 'Forbidden - You can only edit your own data. Requires manager role or higher.' },
            { status: 403 }
          )
        }
      }
    }

    const body = await request.json()

    // Check if email is being changed and if it's unique
    if (body.email) {
      const existingEmployee = await prisma.b24Employee.findFirst({
        where: {
          email: body.email,
          id: { not: employeeId }
        }
      })

      if (existingEmployee) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another employee' },
          { status: 400 }
        )
      }
    }

    // Update employee with all provided data
    const updateData: any = {}
    
    // Basic data
    if (body.firstName !== undefined) updateData.firstName = body.firstName
    if (body.lastName !== undefined) updateData.lastName = body.lastName
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.position !== undefined) updateData.position = body.position
    if (body.department !== undefined) updateData.department = body.department
    
    // Hierarchy
    if (body.managerId !== undefined) updateData.managerId = body.managerId || null
    if (body.hierarchyLevel !== undefined) updateData.hierarchyLevel = body.hierarchyLevel ?? 3
    
    // Contract
    if (body.employmentType !== undefined) updateData.employmentType = body.employmentType
    if (body.workTimeModel !== undefined) updateData.workTimeModel = body.workTimeModel
    if (body.weeklyHours !== undefined) updateData.weeklyHours = body.weeklyHours
    if (body.monthlyHours !== undefined) updateData.monthlyHours = body.monthlyHours
    if (body.dailyHours !== undefined) updateData.dailyHours = body.dailyHours
    if (body.workDaysPerWeek !== undefined) updateData.workDaysPerWeek = body.workDaysPerWeek
    if (body.workStartTime !== undefined) updateData.workStartTime = body.workStartTime
    if (body.workEndTime !== undefined) updateData.workEndTime = body.workEndTime
    if (body.coreTimeStart !== undefined) updateData.coreTimeStart = body.coreTimeStart
    if (body.coreTimeEnd !== undefined) updateData.coreTimeEnd = body.coreTimeEnd
    if (body.flexTimeStart !== undefined) updateData.flexTimeStart = body.flexTimeStart
    if (body.flexTimeEnd !== undefined) updateData.flexTimeEnd = body.flexTimeEnd
    if (body.contractStart !== undefined) updateData.contractStart = body.contractStart ? new Date(body.contractStart) : null
    if (body.contractEnd !== undefined) updateData.contractEnd = body.contractEnd ? new Date(body.contractEnd) : null
    if (body.probationEndDate !== undefined) updateData.probationEndDate = body.probationEndDate ? new Date(body.probationEndDate) : null
    if (body.noticePeriod !== undefined) updateData.noticePeriod = body.noticePeriod
    
    // Salary
    if (body.salaryType !== undefined) updateData.salaryType = body.salaryType
    if (body.monthlySalary !== undefined) updateData.monthlySalary = body.monthlySalary
    if (body.annualSalary !== undefined) updateData.annualSalary = body.annualSalary
    if (body.hourlyRate !== undefined) updateData.hourlyRate = body.hourlyRate
    if (body.isMinijob !== undefined) updateData.isMinijob = body.isMinijob || false
    if (body.miniJobExempt !== undefined) updateData.miniJobExempt = body.miniJobExempt || false
    
    // Tax & SV
    if (body.taxId !== undefined) updateData.taxId = body.taxId
    if (body.taxClass !== undefined) updateData.taxClass = body.taxClass
    if (body.childAllowance !== undefined) updateData.childAllowance = body.childAllowance
    if (body.religion !== undefined) updateData.religion = body.religion || 'NONE'
    if (body.socialSecurityNumber !== undefined) updateData.socialSecurityNumber = body.socialSecurityNumber
    if (body.healthInsurance !== undefined) updateData.healthInsurance = body.healthInsurance
    if (body.healthInsuranceRate !== undefined) updateData.healthInsuranceRate = body.healthInsuranceRate
    if (body.isChildless !== undefined) updateData.isChildless = body.isChildless || false
    
    // Bank
    if (body.bankName !== undefined) updateData.bankName = body.bankName
    if (body.iban !== undefined) updateData.iban = body.iban
    if (body.bic !== undefined) updateData.bic = body.bic

    const employee = await prisma.b24Employee.update({
      where: { id: employeeId },
      data: updateData,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: employee 
    })
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update employee' },
      { status: 500 }
    )
  }
}
