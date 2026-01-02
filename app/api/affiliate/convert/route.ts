import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAffiliateData } from '@/lib/affiliateTracking'

/**
 * Track affiliate conversion
 * Called when a tracked user performs a conversion action
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, customerId, workshopId, tireRequestId, offerId } = await request.json()
    
    // Get affiliate data from cookies
    const affiliateData = getAffiliateData(request)
    
    if (!affiliateData.hasAffiliate) {
      // No affiliate tracking, nothing to do
      return NextResponse.json({ status: 'no_affiliate' })
    }
    
    const cookieId = request.cookies.get('b24_cookie_id')?.value
    if (!cookieId) {
      return NextResponse.json({ status: 'no_cookie' })
    }
    
    // Find influencer by code
    const influencer = await prisma.influencer.findUnique({
      where: { code: affiliateData.refCode! },
      select: {
        id: true,
        isActive: true,
        commissionPerRegistration: true,
        commissionPerWorkshopRegistration: true,
      }
    })
    
    if (!influencer || !influencer.isActive) {
      return NextResponse.json({ error: 'Invalid or inactive affiliate' }, { status: 403 })
    }
    
    // Determine conversion type based on what IDs are provided
    let conversionType: string
    let commissionAmount: number
    
    if (customerId) {
      conversionType = 'REGISTRATION'
      commissionAmount = influencer.commissionPerRegistration
      
      // Check for duplicate
      const existingConversion = await prisma.affiliateConversion.findFirst({
        where: {
          influencerId: influencer.id,
          cookieId: cookieId,
          type: 'REGISTRATION',
          customerId: customerId
        }
      })
      
      if (existingConversion) {
        console.log('[AFFILIATE] Duplicate customer registration prevented')
        return NextResponse.json({ status: 'duplicate' })
      }
    } else if (workshopId) {
      conversionType = 'WORKSHOP_REGISTRATION'
      commissionAmount = influencer.commissionPerWorkshopRegistration
      
      // Check for duplicate
      const existingConversion = await prisma.affiliateConversion.findFirst({
        where: {
          influencerId: influencer.id,
          cookieId: cookieId,
          type: 'WORKSHOP_REGISTRATION',
          workshopId: workshopId
        }
      })
      
      if (existingConversion) {
        console.log('[AFFILIATE] Duplicate workshop registration prevented')
        return NextResponse.json({ status: 'duplicate' })
      }
    } else {
      return NextResponse.json({ error: 'Missing customerId or workshopId' }, { status: 400 })
    }
    
    // Create conversion record
    const conversion = await prisma.affiliateConversion.create({
      data: {
        influencerId: influencer.id,
        type: conversionType,
        cookieId: cookieId,
        customerId: customerId || null,
        workshopId: workshopId || null,
        commissionAmount,
        isPaid: false,
      }
    })
    
    console.log(`[AFFILIATE] ✓ Conversion tracked: ${conversionType} - €${commissionAmount / 100}`, conversion.id)
    
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
