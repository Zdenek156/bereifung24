import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Track affiliate click
 * Called from middleware when ?ref= parameter is detected
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refCode = searchParams.get('ref')
    const cookieId = searchParams.get('cookieId')
    
    if (!refCode || !cookieId) {
      return NextResponse.json({ error: 'Missing ref or cookieId' }, { status: 400 })
    }
    
    // Find influencer by code
    const influencer = await prisma.influencer.findUnique({
      where: { code: refCode },
      select: { 
        id: true, 
        isActive: true,
        activeFrom: true,
        activeUntil: true,
        isUnlimited: true,
        commissionPer1000Views: true
      }
    })
    
    if (!influencer) {
      return NextResponse.json({ error: 'Invalid affiliate code' }, { status: 404 })
    }
    
    // Check if influencer is active
    const now = new Date()
    if (!influencer.isActive) {
      return NextResponse.json({ error: 'Affiliate code inactive' }, { status: 403 })
    }
    
    // Check time limits
    if (!influencer.isUnlimited) {
      if (influencer.activeFrom && influencer.activeFrom > now) {
        return NextResponse.json({ error: 'Affiliate code not yet active' }, { status: 403 })
      }
      if (influencer.activeUntil && influencer.activeUntil < now) {
        return NextResponse.json({ error: 'Affiliate code expired' }, { status: 403 })
      }
    }
    
    // Extract tracking data
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     request.ip || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || null
    const landingPage = searchParams.get('landingPage') || '/'
    
    // Detect device type
    const ua = userAgent.toLowerCase()
    let deviceType: 'MOBILE' | 'TABLET' | 'DESKTOP' = 'DESKTOP'
    if (ua.includes('mobile')) deviceType = 'MOBILE'
    else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'TABLET'
    
    // Check if click already exists (prevent duplicates within 24h)
    const existingClick = await prisma.affiliateClick.findFirst({
      where: {
        influencerId: influencer.id,
        ipAddress: ipAddress.split(',')[0].trim(), // First IP in forwarded chain
        clickedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
    
    if (existingClick) {
      console.log('[AFFILIATE] Duplicate click prevented for IP:', ipAddress)
      return NextResponse.json({ status: 'duplicate' })
    }
    
    // Create click record
    await prisma.affiliateClick.create({
      data: {
        influencerId: influencer.id,
        cookieId,
        ipAddress: ipAddress.split(',')[0].trim(),
        userAgent,
        referrer,
        landingPage,
        deviceType,
      }
    })
    
    // Create PAGE_VIEW conversion
    await prisma.affiliateConversion.create({
      data: {
        influencerId: influencer.id,
        cookieId,
        type: 'PAGE_VIEW',
        commissionAmount: Math.round(influencer.commissionPer1000Views / 1000), // Commission per single view
        isPaid: false,
      }
    })
    
    console.log('[AFFILIATE] Click and PAGE_VIEW conversion tracked:', refCode, cookieId)
    
    return NextResponse.json({ status: 'tracked' })
    
  } catch (error) {
    console.error('[AFFILIATE] Track error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
