import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const group = searchParams.get('group')

    let recipients: { email: string; name: string }[] = []

    switch (group) {
      case 'workshops_no_revenue':
        const allWorkshops = await prisma.workshop.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            commissions: true
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = allWorkshops
          .filter(w => w.commissions.length === 0)
          .map(w => ({
            email: w.user.email,
            name: w.companyName
          }))
        break

      case 'workshops_with_revenue':
        const workshopsWithRevenue = await prisma.workshop.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            commissions: true
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = workshopsWithRevenue
          .filter(w => w.commissions.length > 0)
          .map(w => ({
            email: w.user.email,
            name: w.companyName
          }))
        break

      case 'all_customers':
        const customers = await prisma.customer.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = customers.map(c => ({
          email: c.user.email,
          name: `${c.user.firstName} ${c.user.lastName}`
        }))
        break

      case 'customers_with_pending_offers':
        const customersWithOffers = await prisma.customer.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            tireRequests: {
              include: {
                offers: {
                  where: {
                    status: 'PENDING'
                  }
                }
              }
            }
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = customersWithOffers
          .filter(c => c.tireRequests.some(tr => tr.offers.length > 0))
          .map(c => ({
            email: c.user.email,
            name: `${c.user.firstName} ${c.user.lastName}`
          }))
        break

      case 'all_employees':
        const employees = await prisma.b24Employee.findMany({
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        })
        recipients = employees.map(e => ({
          email: e.email,
          name: `${e.firstName} ${e.lastName}`
        }))
        break

      case 'customers_no_requests':
        const customersNoRequests = await prisma.customer.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            tireRequests: true
          },
          where: {
            user: {
              isActive: true
            }
          }
        })
        recipients = customersNoRequests
          .filter(c => c.tireRequests.length === 0)
          .map(c => ({
            email: c.user.email,
            name: `${c.user.firstName} ${c.user.lastName}`
          }))
        break

      default:
        return NextResponse.json(
          { error: 'Invalid recipient group' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      recipientCount: recipients.length,
      recipientList: recipients.map(r => r.email)
    })

  } catch (error) {
    console.error('Error fetching recipients:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
