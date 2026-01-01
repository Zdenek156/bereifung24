import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Only track for customers
    if (!session.user.customerId) {
      return NextResponse.json({ success: false, reason: 'Not a customer' })
    }

    // Get cookies from request
    const affiliateRef = request.cookies.get('b24_affiliate_ref')?.value
    const cookieId = request.cookies.get('b24_cookie_id')?.value

    console.log('[AFFILIATE LOGIN] Track endpoint called:', {
      customerId: session.user.customerId,
      affiliateRef,
      cookieId,
      email: session.user.email
    })

    if (!affiliateRef || !cookieId) {
      console.log('[AFFILIATE LOGIN] Missing cookies')
      return NextResponse.json({ 
        success: false, 
        reason: 'No affiliate cookies',
        debug: { affiliateRef: !!affiliateRef, cookieId: !!cookieId }
      })
    }

    // Check if conversion already exists
    const existingConversion = await prisma.affiliateConversion.findFirst({
      where: {
        cookieId: cookieId,
        type: 'REGISTRATION',
        customerId: session.user.customerId
      }
    })

    if (existingConversion) {
      console.log('[AFFILIATE LOGIN] Conversion already exists')
      return NextResponse.json({ success: false, reason: 'Already tracked' })
    }

    // Find the influencer
    const influencer = await prisma.influencer.findUnique({
      where: { code: affiliateRef },
      select: {
        id: true,
        isActive: true,
        commissionPerCustomerRegistration: true
      }
    })

    if (!influencer || !influencer.isActive) {
      console.log('[AFFILIATE LOGIN] Influencer not found or inactive:', affiliateRef)
      return NextResponse.json({ 
        success: false, 
        reason: 'Influencer not found or inactive',
        debug: { found: !!influencer, active: influencer?.isActive }
      })
    }

    console.log(`[AFFILIATE LOGIN] Influencer found: ${affiliateRef}, active: ${influencer.isActive}`)

    // Find the click record
    const click = await prisma.affiliateClick.findFirst({
      where: {
        influencerId: influencer.id,
        cookieId: cookieId
      },
      orderBy: {
        clickedAt: 'desc'
      }
    })

    if (!click) {
      console.log('[AFFILIATE] No click found for cookieId:', cookieId)
      return NextResponse.json({ 
        success: false, 
        reason: 'No click record found',
        debug: { cookieId }
      })
    }

    // Create conversion
    const conversion = await prisma.affiliateConversion.create({
      data: {
        influencerId: influencer.id,
        cookieId: cookieId,
        customerId: session.user.customerId,
        type: 'REGISTRATION',
        commissionAmount: influencer.commissionPerCustomerRegistration,
        isPaid: false
      }
    })

    console.log(`[AFFILIATE] ✓ First login conversion tracked: ${affiliateRef} - Customer ${session.user.email} - €${influencer.commissionPerCustomerRegistration / 100}`)

    return NextResponse.json({ 
      success: true,
      conversion: {
        id: conversion.id,
        amount: influencer.commissionPerCustomerRegistration / 100,
        influencerCode: affiliateRef
      }
    })

  } catch (error) {
    console.error('[AFFILIATE] Error tracking login conversion:', error)
    return NextResponse.json(
      { error: 'Tracking failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
