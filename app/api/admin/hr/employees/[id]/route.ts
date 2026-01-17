import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasApplication } from '@/lib/applications'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has access to HR application or is ADMIN
    if (session.user.role !== 'ADMIN') {
      const hasAccess = await hasApplication(session.user.id, 'hr')
      if (!hasAccess) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const employeeId = params.id
    const body = await request.json()

    // Update employee HR data
    const employee = await prisma.b24Employee.update({
      where: { id: employeeId },
      data: {
        // Hierarchy
        managerId: body.managerId || null,
        hierarchyLevel: body.hierarchyLevel || 0,
        
        // Contract
        employmentType: body.employmentType,
        workTimeModel: body.workTimeModel,
        weeklyHours: body.weeklyHours,
        monthlyHours: body.monthlyHours,
        dailyHours: body.dailyHours,
        workDaysPerWeek: body.workDaysPerWeek,
        workStartTime: body.workStartTime,
        workEndTime: body.workEndTime,
        coreTimeStart: body.coreTimeStart,
        coreTimeEnd: body.coreTimeEnd,
        flexTimeStart: body.flexTimeStart,
        flexTimeEnd: body.flexTimeEnd,
        contractStart: body.contractStart ? new Date(body.contractStart) : null,
        contractEnd: body.contractEnd ? new Date(body.contractEnd) : null,
        probationEndDate: body.probationEndDate ? new Date(body.probationEndDate) : null,
        noticePeriod: body.noticePeriod,
        
        // Salary
        salaryType: body.salaryType,
        monthlySalary: body.monthlySalary,
        annualSalary: body.annualSalary,
        hourlyRate: body.hourlyRate,
        isMinijob: body.isMinijob || false,
        miniJobExempt: body.miniJobExempt || false,
        
        // Tax & SV
        taxId: body.taxId,
        taxClass: body.taxClass,
        childAllowance: body.childAllowance,
        religion: body.religion || 'NONE',
        socialSecurityNumber: body.socialSecurityNumber,
        healthInsurance: body.healthInsurance,
        healthInsuranceRate: body.healthInsuranceRate,
        isChildless: body.isChildless || false,
        
        // Bank
        bankName: body.bankName,
        iban: body.iban,
        bic: body.bic,
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
