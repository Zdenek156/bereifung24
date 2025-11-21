import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
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
      case 'all_workshops':
        const workshops = await prisma.workshop.findMany({
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
        recipients = workshops.map(w => ({
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

      case 'workshops_no_revenue':
        const workshopsNoRevenue = await prisma.workshop.findMany({
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true
              }
            },
            bookings: {
              where: {
                status: {
                  in: ['CONFIRMED', 'COMPLETED']
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
        recipients = workshopsNoRevenue
          .filter(w => w.bookings.length === 0)
          .map(w => ({
            email: w.user.email,
            name: w.companyName
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
