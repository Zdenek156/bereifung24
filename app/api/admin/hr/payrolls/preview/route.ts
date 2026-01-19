import { NextRequest, NextResponse } from 'next/server'
import { requireAdminOrEmployee } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// POST - Preview payroll before creation
export async function POST(request: NextRequest) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const { month, year } = await request.json()

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    // Get all active employees
    const employees = await prisma.b24Employee.findMany({
      where: {
        isActive: true,
        AND: [
          { email: { not: { contains: 'admin@' } } },
          { email: { not: { contains: 'system@' } } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        salary: true
      }
    })

    // Calculate preview
    let totalGross = 0
    let totalNet = 0
    let totalEmployer = 0

    const employeeData = employees.map(emp => {
      const grossSalary = parseFloat(emp.salary?.toString() || '0')
      const taxRate = 0.20 // Simplified
      const socialSecurityRate = 0.20 // Simplified
      
      const taxes = grossSalary * taxRate
      const socialSecurity = grossSalary * socialSecurityRate
      const netSalary = grossSalary - taxes - socialSecurity
      const employerContribution = grossSalary * 0.20

      totalGross += grossSalary
      totalNet += netSalary
      totalEmployer += employerContribution

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        position: emp.position,
        grossSalary,
        netSalary,
        employerContribution
      }
    })

    return NextResponse.json({
      employeeCount: employees.length,
      totalGross,
      totalNet,
      totalEmployer,
      employees: employeeData
    })
  } catch (error) {
    console.error('Error previewing payroll:', error)
    return NextResponse.json(
      { error: 'Failed to preview payroll' },
      { status: 500 }
    )
  }
}
