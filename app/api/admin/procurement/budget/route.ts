import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht authorisiert' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const year = Number(searchParams.get('year')) || new Date().getFullYear()

    const investmentPlan = await prisma.investmentPlan.findFirst({
      where: { year },
      include: {
        budgets: true
      }
    })

    if (!investmentPlan) {
      return NextResponse.json(null)
    }

    // Format für Frontend
    const formatted = {
      year: investmentPlan.year,
      totalBudget: Number(investmentPlan.totalBudget),
      costCenterBudgets: investmentPlan.budgets.map(ccb => ({
        costCenter: ccb.costCenter,
        allocatedBudget: Number(ccb.allocatedBudget),
        spent: Number(ccb.spent)
      }))
    }

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Budgets' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht authorisiert' }, { status: 401 })
    }

    const body = await request.json()
    const { year, totalBudget, costCenterBudgets } = body

    // Validierung
    if (!year || !totalBudget || !costCenterBudgets) {
      return NextResponse.json({ error: 'Ungültige Daten' }, { status: 400 })
    }

    // Prüfen ob schon ein Plan für das Jahr existiert
    const existing = await prisma.investmentPlan.findFirst({
      where: { year }
    })

    let investmentPlan

    if (existing) {
      // Update
      investmentPlan = await prisma.investmentPlan.update({
        where: { id: existing.id },
        data: {
          totalBudget,
          budgets: {
            deleteMany: {},
            create: costCenterBudgets.map((ccb: any) => ({
              costCenter: ccb.costCenter,
              allocatedBudget: ccb.allocatedBudget,
              spent: 0
            }))
          }
        },
        include: {
          budgets: true
        }
      })
    } else {
      // Create
      investmentPlan = await prisma.investmentPlan.create({
        data: {
          year,
          totalBudget,
          createdById: session.user.id,
          budgets: {
            create: costCenterBudgets.map((ccb: any) => ({
              costCenter: ccb.costCenter,
              allocatedBudget: ccb.allocatedBudget,
              spent: 0
            }))
          }
        },
        include: {
          budgets: true
        }
      })
    }

    return NextResponse.json(investmentPlan)
  } catch (error) {
    console.error('Error saving budget:', error)
    return NextResponse.json({ error: 'Fehler beim Speichern des Budgets' }, { status: 500 })
  }
}
