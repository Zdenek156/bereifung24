import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/sales/stats
 * 
 * Get sales CRM statistics
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email }
    });

    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Date ranges
    const now = new Date();
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all-time stats
    const [
      totalProspects,
      newProspects,
      contactedThisWeek,
      wonThisMonth,
      myProspects,
      myTasks
    ] = await Promise.all([
      prisma.prospectWorkshop.count(),
      
      prisma.prospectWorkshop.count({
        where: { status: 'NEW' }
      }),
      
      prisma.prospectWorkshop.count({
        where: {
          lastContactDate: {
            gte: thisWeekStart
          }
        }
      }),
      
      prisma.prospectWorkshop.count({
        where: {
          status: 'WON',
          convertedAt: {
            gte: thisMonthStart
          }
        }
      }),
      
      prisma.prospectWorkshop.count({
        where: {
          assignedToId: employee.id,
          status: { not: 'WON' }
        }
      }),
      
      prisma.prospectTask.count({
        where: {
          assignedToId: employee.id,
          completed: false,
          dueDate: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }
      })
    ]);

    // Pipeline stats by status
    const pipelineStats = await prisma.prospectWorkshop.groupBy({
      by: ['status'],
      _count: true,
      _sum: {
        estimatedRevenue: true
      }
    });

    // Conversion rate
    const totalNonNew = await prisma.prospectWorkshop.count({
      where: { status: { not: 'NEW' } }
    });
    const totalWon = await prisma.prospectWorkshop.count({
      where: { status: 'WON' }
    });
    const conversionRate = totalNonNew > 0 ? (totalWon / totalNonNew) * 100 : 0;

    // Recent activity
    const recentInteractions = await prisma.prospectInteraction.findMany({
      where: {
        createdById: employee.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        prospect: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    // Upcoming tasks
    const upcomingTasks = await prisma.prospectTask.findMany({
      where: {
        assignedToId: employee.id,
        completed: false,
        dueDate: {
          gte: new Date()
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        prospect: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json({
      summary: {
        totalProspects,
        newProspects,
        contactedThisWeek,
        wonThisMonth,
        myProspects,
        myTasks,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      },
      pipeline: pipelineStats.map(stat => ({
        status: stat.status,
        count: stat._count,
        totalValue: stat._sum.estimatedRevenue || 0
      })),
      recentActivity: recentInteractions,
      upcomingTasks
    });

  } catch (error: any) {
    console.error('Error fetching sales stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    }, { status: 500 });
  }
}
