import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { requireAdminOrEmployee } from '@/lib/permissions'

// GET - Fetch CRM data for a workshop
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const workshopId = params.id

    // Get or create CRM record
    let crmData = await prisma.workshopCRM.findUnique({
      where: { workshopId },
      include: {
        workshop: {
          select: {
            id: true,
            companyName: true,
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
              }
            }
          }
        },
        interactions: {
          orderBy: { date: 'desc' },
          take: 20
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    // Create default CRM record if not exists
    if (!crmData) {
      crmData = await prisma.workshopCRM.create({
        data: {
          workshopId,
          leadStatus: 'NEUKONTAKT'
        },
        include: {
          workshop: {
            select: {
              id: true,
              companyName: true,
              user: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                }
              }
            }
          },
          interactions: true,
          notes: true
        }
      })
    }

    return NextResponse.json(crmData)

  } catch (error) {
    console.error('CRM fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch CRM data' }, { status: 500 })
  }
}

// PUT - Update CRM data
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requireAdminOrEmployee()
    if (authError) return authError

    const workshopId = params.id
    const body = await req.json()

    const {
      leadStatus,
      potential,
      estimatedMonthlyRevenue,
      mainContactName,
      mainContactPosition,
      mainContactPhone,
      mainContactEmail,
      decisionMaker,
      otherPlatforms,
      nextContactDate,
      nextContactType,
      followUpNotes,
      contractStatus,
      contractStartDate
    } = body

    // Update or create CRM data
    const crmData = await prisma.workshopCRM.upsert({
      where: { workshopId },
      update: {
        leadStatus,
        potential,
        estimatedMonthlyRevenue,
        mainContactName,
        mainContactPosition,
        mainContactPhone,
        mainContactEmail,
        decisionMaker,
        otherPlatforms,
        nextContactDate: nextContactDate ? new Date(nextContactDate) : null,
        nextContactType,
        followUpNotes,
        contractStatus,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
      },
      create: {
        workshopId,
        leadStatus: leadStatus || 'NEUKONTAKT',
        potential,
        estimatedMonthlyRevenue,
        mainContactName,
        mainContactPosition,
        mainContactPhone,
        mainContactEmail,
        decisionMaker,
        otherPlatforms,
        nextContactDate: nextContactDate ? new Date(nextContactDate) : null,
        nextContactType,
        followUpNotes,
        contractStatus,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
      },
      include: {
        workshop: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        interactions: {
          orderBy: { date: 'desc' },
          take: 20
        },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 20
        }
      }
    })

    return NextResponse.json(crmData)

  } catch (error) {
    console.error('CRM update error:', error)
    return NextResponse.json({ error: 'Failed to update CRM data' }, { status: 500 })
  }
}
