import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

// GET - Get single employee
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const isAdmin = session.user.role === 'ADMIN'
    const isEmployee = session.user.role === 'B24_EMPLOYEE'
    const isSelf = isEmployee && session.user.b24EmployeeId === params.id

    // ADMIN or B24_EMPLOYEE with hr read permission can view anyone
    // Or B24_EMPLOYEE can view themselves
    let hasHrAccess = false
    if (isEmployee && !isSelf) {
      const permission = await prisma.b24EmployeePermission.findUnique({
        where: {
          employeeId_resource: {
            employeeId: session.user.b24EmployeeId!,
            resource: 'hr'
          }
        }
      })
      hasHrAccess = permission?.canRead ?? false
    }

    if (!isAdmin && !isSelf && !hasHrAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        assignedWorkshops: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                city: true,
              }
            }
          }
        },
        activityLogs: {
          take: 50,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json(employee)
  } catch (error) {
    console.error('Error fetching employee:', error)
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 })
  }
}

// PUT - Update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission - requires 'hr' write access or ADMIN
    const permissionError = await requirePermission('hr', 'write')
    if (permissionError) return permissionError

    const body = await request.json()
    const { 
      email, firstName, lastName, phone, position, department, isActive, permissions,
      // HR fields
      managerId, hierarchyLevel,
      employmentType, workTimeModel, weeklyHours, monthlyHours, dailyHours,
      workDaysPerWeek, workStartTime, workEndTime,
      coreTimeStart, coreTimeEnd, flexTimeStart, flexTimeEnd,
      contractStart, contractEnd, probationEndDate, noticePeriod,
      salaryType, monthlySalary, annualSalary, hourlyRate, isMinijob, miniJobExempt,
      taxId, taxClass, childAllowance, religion,
      socialSecurityNumber, healthInsurance, healthInsuranceRate, isChildless,
      bankName, iban, bic
    } = body

    // Prepare update data
    const updateData: any = {
      email,
      firstName,
      lastName,
      phone,
      position,
      department,
      isActive
    }

    // Add HR fields if provided
    if (managerId !== undefined) updateData.managerId = managerId
    if (hierarchyLevel !== undefined) updateData.hierarchyLevel = hierarchyLevel
    if (employmentType !== undefined) updateData.employmentType = employmentType
    if (workTimeModel !== undefined) updateData.workTimeModel = workTimeModel
    if (weeklyHours !== undefined) updateData.weeklyHours = weeklyHours
    if (monthlyHours !== undefined) updateData.monthlyHours = monthlyHours
    if (dailyHours !== undefined) updateData.dailyHours = dailyHours
    if (workDaysPerWeek !== undefined) updateData.workDaysPerWeek = workDaysPerWeek
    if (workStartTime !== undefined) updateData.workStartTime = workStartTime
    if (workEndTime !== undefined) updateData.workEndTime = workEndTime
    if (coreTimeStart !== undefined) updateData.coreTimeStart = coreTimeStart
    if (coreTimeEnd !== undefined) updateData.coreTimeEnd = coreTimeEnd
    if (flexTimeStart !== undefined) updateData.flexTimeStart = flexTimeStart
    if (flexTimeEnd !== undefined) updateData.flexTimeEnd = flexTimeEnd
    if (contractStart !== undefined) updateData.contractStart = contractStart ? new Date(contractStart) : null
    if (contractEnd !== undefined) updateData.contractEnd = contractEnd ? new Date(contractEnd) : null
    if (probationEndDate !== undefined) updateData.probationEndDate = probationEndDate ? new Date(probationEndDate) : null
    if (noticePeriod !== undefined) updateData.noticePeriod = noticePeriod
    if (salaryType !== undefined) updateData.salaryType = salaryType
    if (monthlySalary !== undefined) updateData.monthlySalary = monthlySalary
    if (annualSalary !== undefined) updateData.annualSalary = annualSalary
    if (hourlyRate !== undefined) updateData.hourlyRate = hourlyRate
    if (isMinijob !== undefined) updateData.isMinijob = isMinijob
    if (miniJobExempt !== undefined) updateData.miniJobExempt = miniJobExempt
    if (taxId !== undefined) updateData.taxId = taxId
    if (taxClass !== undefined) updateData.taxClass = taxClass
    if (childAllowance !== undefined) updateData.childAllowance = childAllowance
    if (religion !== undefined) updateData.religion = religion
    if (socialSecurityNumber !== undefined) updateData.socialSecurityNumber = socialSecurityNumber
    if (healthInsurance !== undefined) updateData.healthInsurance = healthInsurance
    if (healthInsuranceRate !== undefined) updateData.healthInsuranceRate = healthInsuranceRate
    if (isChildless !== undefined) updateData.isChildless = isChildless
    if (bankName !== undefined) updateData.bankName = bankName
    if (iban !== undefined) updateData.iban = iban
    if (bic !== undefined) updateData.bic = bic

    // Update employee
    const employee = await prisma.b24Employee.update({
      where: { id: params.id },
      data: updateData
    })

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Delete existing permissions
      await prisma.b24EmployeePermission.deleteMany({
        where: { employeeId: params.id }
      })

      // Create new permissions
      if (permissions.length > 0) {
        await prisma.b24EmployeePermission.createMany({
          data: permissions.map((perm: any) => ({
            employeeId: params.id,
            resource: perm.resource,
            canRead: perm.canRead || false,
            canWrite: perm.canWrite || false,
            canDelete: perm.canDelete || false
          }))
        })
      }
    }

    // Fetch updated employee with permissions
    const updatedEmployee = await prisma.b24Employee.findUnique({
      where: { id: params.id },
      include: {
        permissions: true,
        assignedWorkshops: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                city: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(updatedEmployee)
  } catch (error) {
    console.error('Error updating employee:', error)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}

// DELETE - Delete employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check permission - requires 'hr' delete access or ADMIN
    const permissionError = await requirePermission('hr', 'delete')
    if (permissionError) return permissionError

    // Delete employee (cascades to permissions and activity logs)
    await prisma.b24Employee.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting employee:', error)
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 })
  }
}
