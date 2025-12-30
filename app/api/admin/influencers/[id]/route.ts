import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/influencers/[id]
 * Get single influencer with detailed stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true }
    })
    
    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const influencer = await prisma.influencer.findUnique({
      where: { id: params.id },
      include: {
        clicks: {
          orderBy: { clickedAt: 'desc' },
          take: 50
        },
        conversions: {
          orderBy: { convertedAt: 'desc' },
          take: 50,
          include: {
            customer: {
              select: { id: true }
            },
            tireRequest: {
              select: { id: true, season: true }
            },
            offer: {
              select: { id: true, price: true }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
    
    if (!influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 })
    }
    
    return NextResponse.json(influencer)
    
  } catch (error) {
    console.error('[ADMIN] Get influencer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/influencers/[id]
 * Update influencer
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
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
      name,
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
      isActive,
      paymentMethod,
      accountHolder,
      iban,
      bic,
      paypalEmail,
      taxType,
      companyName,
      taxId,
      street,
      zipCode,
      city,
      country,
      notes
    } = body
    
    const influencer = await prisma.influencer.update({
      where: { id: params.id },
      data: {
        email: email || undefined,
        name: name !== undefined ? name : undefined,
        platform: platform !== undefined ? platform : undefined,
        channelName: channelName !== undefined ? channelName : undefined,
        channelUrl: channelUrl !== undefined ? channelUrl : undefined,
        additionalChannels: additionalChannels !== undefined ? additionalChannels : undefined,
        commissionPer1000Views: commissionPer1000Views !== undefined ? commissionPer1000Views : undefined,
        commissionPerRegistration: commissionPerRegistration !== undefined ? commissionPerRegistration : undefined,
        commissionPerAcceptedOffer: commissionPerAcceptedOffer !== undefined ? commissionPerAcceptedOffer : undefined,
        activeFrom: activeFrom !== undefined ? (activeFrom ? new Date(activeFrom) : new Date()) : undefined,
        activeUntil: activeUntil !== undefined ? (activeUntil ? new Date(activeUntil) : null) : undefined,
        isUnlimited: isUnlimited !== undefined ? isUnlimited : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        paymentMethod: paymentMethod !== undefined ? paymentMethod : undefined,
        accountHolder: accountHolder !== undefined ? accountHolder : undefined,
        iban: iban !== undefined ? iban : undefined,
        bic: bic !== undefined ? bic : undefined,
        paypalEmail: paypalEmail !== undefined ? paypalEmail : undefined,
        taxType: taxType !== undefined ? taxType : undefined,
        companyName: companyName !== undefined ? companyName : undefined,
        taxId: taxId !== undefined ? taxId : undefined,
        street: street !== undefined ? street : undefined,
        zipCode: zipCode !== undefined ? zipCode : undefined,
        city: city !== undefined ? city : undefined,
        country: country !== undefined ? country : undefined,
        notes: notes !== undefined ? notes : undefined,
      }
    })
    
    return NextResponse.json(influencer)
    
  } catch (error) {
    console.error('[ADMIN] Update influencer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/influencers/[id]
 * Delete influencer
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const employee = await prisma.b24Employee.findUnique({
      where: { email: session.user.email },
      select: { id: true, isActive: true }
    })
    
    if (!employee || !employee.isActive) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Check if influencer has unpaid commissions
    const unpaidConversions = await prisma.affiliateConversion.count({
      where: {
        influencerId: params.id,
        isPaid: false
      }
    })
    
    if (unpaidConversions > 0) {
      return NextResponse.json(
        { error: 'Cannot delete influencer with unpaid commissions' },
        { status: 400 }
      )
    }
    
    await prisma.influencer.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('[ADMIN] Delete influencer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
