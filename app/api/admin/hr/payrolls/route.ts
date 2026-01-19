import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET - List payrolls grouped by month/year
export async function GET(request: NextRequest) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const status = searchParams.get('status')

    const where: any = {}
    if (year) where.year = parseInt(year)
    if (status && status !== 'ALL') where.status = status

    // Get all payrolls
    const allPayrolls = await prisma.payroll.findMany({
      where,
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    })

    // Group by month/year
    const grouped = allPayrolls.reduce((acc, payroll) => {
      const key = `${payroll.year}-${payroll.month}`
      if (!acc[key]) {
        acc[key] = {
          month: payroll.month,
          year: payroll.year,
          status: payroll.status,
          payrolls: [],
          reviewedById: payroll.reviewedById,
          generatedAt: payroll.generatedAt
        }
      }
      acc[key].payrolls.push(payroll)
      return acc
    }, {} as Record<string, any>)

    // Transform to frontend format
    const transformed = Object.values(grouped).map((group: any) => {
      const totalGross = group.payrolls.reduce((sum: number, p: any) => 
        sum + parseFloat(p.grossTotal.toString()), 0
      )
      const totalNet = group.payrolls.reduce((sum: number, p: any) => 
        sum + parseFloat(p.netSalary.toString()), 0
      )
      const totalEmployer = group.payrolls.reduce((sum: number, p: any) => 
        sum + parseFloat(p.totalEmployerCosts.toString()), 0
      )

      return {
        id: `${group.year}-${group.month}`,
        month: group.month,
        year: group.year,
        status: group.status,
        totalGross,
        totalNet,
        totalEmployer,
        employeeCount: group.payrolls.length,
        approvedBy: group.reviewedById,
        approvedAt: group.status === 'APPROVED' ? group.generatedAt : null,
        paidAt: group.status === 'PAID' ? group.generatedAt : null,
        createdAt: group.generatedAt
      }
    })

    return NextResponse.json(transformed)
  } catch (error) {
    console.error('Error fetching payrolls:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payrolls' },
      { status: 500 }
    )
  }
}

// POST - Create payrolls for all employees for given month
export async function POST(request: NextRequest) {
  try {
    const permissionError = await requireAdminOrEmployee()
    if (permissionError) return permissionError

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email }
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const { month, year } = await request.json()

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      )
    }

    // Check if payroll already exists
    const existing = await prisma.payroll.findFirst({
      where: { month, year }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Payroll for this period already exists' },
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
      }
    })

    const periodStart = new Date(year, month - 1, 1)
    const periodEnd = new Date(year, month, 0, 23, 59, 59)
    const workDaysInMonth = 22
    const calendarDaysInMonth = periodEnd.getDate()

    // Create payroll for each employee
    const created = await Promise.all(employees.map(async emp => {
      const grossSalary = parseFloat(emp.salary?.toString() || '0')
      
      // Simplified calculations
      const healthIns = grossSalary * 0.073
      const nursingIns = grossSalary * 0.017
      const pensionIns = grossSalary * 0.093
      const unemploymentIns = grossSalary * 0.013
      const totalSocSec = healthIns + nursingIns + pensionIns + unemploymentIns
      
      const taxableIncome = grossSalary - totalSocSec
      const incomeTax = taxableIncome * 0.15
      const solidarityTax = incomeTax * 0.055
      const totalTax = incomeTax + solidarityTax
      
      const netSalary = grossSalary - totalSocSec - totalTax
      
      // Employer costs
      const empHealthIns = grossSalary * 0.073
      const empNursingIns = grossSalary * 0.017
      const empPensionIns = grossSalary * 0.093
      const empUnemploymentIns = grossSalary * 0.013
      const u1Levy = grossSalary * 0.015
      const u2Levy = grossSalary * 0.003
      const u3Levy = grossSalary * 0.001
      const bgLevy = grossSalary * 0.01
      
      const totalEmployerCosts = empHealthIns + empNursingIns + empPensionIns + 
                                empUnemploymentIns + u1Levy + u2Levy + u3Levy + bgLevy

      return prisma.payroll.create({
        data: {
          employeeId: emp.id,
          month,
          year,
          periodStart,
          periodEnd,
          workDaysInMonth,
          calendarDaysInMonth,
          baseSalary: grossSalary,
          grossTotal: grossSalary,
          healthInsurance: healthIns,
          healthInsuranceExtra: 0,
          nursingInsurance: nursingIns,
          pensionInsurance: pensionIns,
          unemploymentInsurance: unemploymentIns,
          totalSocialSecurity: totalSocSec,
          employerHealthInsurance: empHealthIns,
          employerHealthInsuranceExtra: 0,
          employerNursingInsurance: empNursingIns,
          employerPensionInsurance: empPensionIns,
          employerUnemploymentInsurance: empUnemploymentIns,
          u1Levy,
          u2Levy,
          u3Levy,
          bgLevy,
          totalEmployerCosts,
          taxableIncome,
          incomeTax,
          solidarityTax,
          churchTax: 0,
          totalTax,
          netSalary,
          status: 'DRAFT'
        }
      })
    }))

    return NextResponse.json({ 
      success: true,
      created: created.length,
      id: `${year}-${month}`
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating payroll:', error)
    return NextResponse.json(
      { error: 'Failed to create payroll' },
      { status: 500 }
    )
  }
}
