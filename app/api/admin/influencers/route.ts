import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * GET /api/admin/influencers
 * Get all influencers with stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is B24 employee with admin access
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    })
    
    if (!employee || employee.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get all influencers with aggregated stats
    const influencers = await prisma.influencer.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    // Calculate earnings for each influencer
    const influencersWithStats = await Promise.all(
      influencers.map(async (influencer) => {
        const totalClicks = await prisma.affiliateClick.count({
          where: { influencerId: influencer.id }
        })
        
        const totalConversions = await prisma.affiliateConversion.count({
          where: { influencerId: influencer.id }
        })
        
        const totalEarnings = await prisma.affiliateConversion.aggregate({
          where: {
            influencerId: influencer.id,
            isPaid: false
          },
          _sum: {
            commissionAmount: true
          }
        })
        
        const paidEarnings = await prisma.affiliatePayment.aggregate({
          where: {
            influencerId: influencer.id,
            status: 'PAID'
          },
          _sum: {
            totalAmount: true
          }
        })
        
        return {
          ...influencer,
          unpaidEarnings: totalEarnings._sum.commissionAmount || 0,
          paidEarnings: paidEarnings._sum.totalAmount || 0,
          totalClicks,
          totalConversions
        }
      })
    )
    
    return NextResponse.json(influencersWithStats)
    
  } catch (error) {
    console.error('[ADMIN] Get influencers error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/influencers
 * Create new influencer
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is B24 employee
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true }
    })
    
    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    const {
      email,
      code,
      platform,
      channelName,
      channelUrl,
      additionalChannels,
      commissionPer1000Views,
      commissionPerRegistration,
      commissionPerAcceptedOffer,
      activeFrom,
      activeUntil,
      isUnlimited,
      paymentMethod,
      accountHolder,
      iban,
      bic,
      paypalEmail,
      taxType,
      companyName,
      taxId,
      notes
    } = body
    
    // Validate required fields
    if (!email || !code) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 })
    }
    
    // Check if code already exists
    const existingInfluencer = await prisma.influencer.findUnique({
      where: { code }
    })
    
    if (existingInfluencer) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 400 })
    }
    
    // Generate registration token
    const registrationToken = crypto.randomBytes(32).toString('hex')
    
    // Create influencer
    const influencer = await prisma.influencer.create({
      data: {
        email,
        code: code.toUpperCase(),
        platform: platform || null,
        channelName: channelName || null,
        channelUrl: channelUrl || null,
        additionalChannels: additionalChannels || null,
        commissionPer1000Views: commissionPer1000Views || 300,
        commissionPerRegistration: commissionPerRegistration || 1500,
        commissionPerAcceptedOffer: commissionPerAcceptedOffer || 2500,
        activeFrom: activeFrom ? new Date(activeFrom) : null,
        activeUntil: activeUntil ? new Date(activeUntil) : null,
        isUnlimited: isUnlimited ?? true,
        isActive: true,
        isRegistered: false,
        registrationToken,
        paymentMethod: paymentMethod || null,
        accountHolder: accountHolder || null,
        iban: iban || null,
        bic: bic || null,
        paypalEmail: paypalEmail || null,
        taxType: taxType || null,
        companyName: companyName || null,
        taxId: taxId || null,
        notes: notes || null
      }
    })
    
    // TODO: Send registration email to influencer
    console.log('[ADMIN] Created influencer:', influencer.id, 'Token:', registrationToken)
    
    return NextResponse.json({
      ...influencer,
      registrationLink: `${process.env.NEXT_PUBLIC_APP_URL}/influencer/register?token=${registrationToken}`
    })
    
  } catch (error) {
    console.error('[ADMIN] Create influencer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
