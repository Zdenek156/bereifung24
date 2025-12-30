import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAffiliateData } from '@/lib/affiliateTracking'

/**
 * Track affiliate conversion
 * Called when a tracked user performs a conversion action
 */
export async function POST(request: NextRequest) {
  try {
    const { type, customerId, tireRequestId, offerId } = await request.json()
    
    if (!type) {
      return NextResponse.json({ error: 'Missing conversion type' }, { status: 400 })
    }
    
    // Get affiliate data from cookies
    const affiliateData = getAffiliateData(request)
    
    if (!affiliateData.hasAffiliate) {
      // No affiliate tracking, nothing to do
      return NextResponse.json({ status: 'no_affiliate' })
    }
    
    // Find influencer by code
    const influencer = await prisma.influencer.findUnique({
      where: { code: affiliateData.refCode! },
      select: {
        id: true,
        isActive: true,
        commissionPer1000Views: true,
        commissionPerRegistration: true,
        commissionPerAcceptedOffer: true,
      }
    })
    
    if (!influencer || !influencer.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive affiliate' }, { status: 403 })
    }
    
    // Check if conversion already exists (prevent duplicates)
    const existingConversion = await prisma.affiliateConversion.findFirst({
      where: {
        influencerId: influencer.id,
        cookieId: affiliateData.cookieId!,
        type,
        ...(customerId && { customerId }),
        ...(tireRequestId && { tireRequestId }),
        ...(offerId && { offerId }),
      }
    })
    
    if (existingConversion) {
      console.log('[AFFILIATE] Duplicate conversion prevented:', type)
      return NextResponse.json({ status: 'duplicate' })
    }
    
    // Calculate commission based on type
    let commissionAmount = 0
    switch (type) {
      case 'PAGE_VIEW':
        commissionAmount = Math.round(influencer.commissionPer1000Views / 1000)
        break
      case 'REGISTRATION':
        commissionAmount = influencer.commissionPerRegistration
        break
      case 'ACCEPTED_OFFER':
        commissionAmount = influencer.commissionPerAcceptedOffer
        break
      default:
        return NextResponse.json({ error: 'Invalid conversion type' }, { status: 400 })
    }
    
    // Create conversion record
    const conversion = await prisma.affiliateConversion.create({
      data: {
        influencerId: influencer.id,
        type,
        cookieId: affiliateData.cookieId!,
        customerId: customerId || null,
        tireRequestId: tireRequestId || null,
        offerId: offerId || null,
        commissionAmount,
        isPaid: false,
      }
    })
    
    console.log('[AFFILIATE] Conversion tracked:', type, conversion.id, 'Commission:', commissionAmount)
    
    return NextResponse.json({ 
      status: 'tracked', 
      conversionId: conversion.id,
      commission: commissionAmount 
    })
    
  } catch (error) {
    console.error('[AFFILIATE] Convert error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
