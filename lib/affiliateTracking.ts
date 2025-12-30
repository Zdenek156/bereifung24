/**
 * Affiliate Tracking Middleware
 * 
 * Setzt Cookies für Affiliate-Links und trackt Klicks
 * URL-Format: bereifung24.de?ref=INFLUENCER_CODE
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const AFFILIATE_COOKIE_NAME = 'b24_affiliate_ref';
const AFFILIATE_COOKIE_ID = 'b24_affiliate_id';
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 Tage in Sekunden

export async function handleAffiliateTracking(request: NextRequest) {
  const response = NextResponse.next();
  const { searchParams } = new URL(request.url);
  const refCode = searchParams.get('ref');

  // Wenn ein Affiliate-Code in der URL ist
  if (refCode) {
    // Generiere eine eindeutige Cookie-ID für Attribution
    const cookieId = uuidv4();
    
    // Setze Cookies (90 Tage Laufzeit)
    response.cookies.set(AFFILIATE_COOKIE_NAME, refCode, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    response.cookies.set(AFFILIATE_COOKIE_ID, cookieId, {
      maxAge: COOKIE_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    // Tracking-Request an Backend (async, non-blocking)
    // Wir machen das in einem separaten API-Call, damit wir den User nicht aufhalten
    const trackingUrl = new URL('/api/affiliate/track', request.url);
    trackingUrl.searchParams.set('ref', refCode);
    trackingUrl.searchParams.set('cookieId', cookieId);

    // Fire-and-forget Tracking (läuft im Hintergrund)
    fetch(trackingUrl.toString(), {
      method: 'GET',
      headers: {
        'x-forwarded-for': request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        'user-agent': request.headers.get('user-agent') || 'unknown',
        'referer': request.headers.get('referer') || '',
      },
    }).catch(() => {
      // Ignoriere Fehler beim Tracking (sollte User-Experience nicht beeinflussen)
    });
  }

  return response;
}

/**
 * Holt die aktuellen Affiliate-Daten aus den Cookies
 */
export function getAffiliateData(request: NextRequest) {
  const refCode = request.cookies.get(AFFILIATE_COOKIE_NAME)?.value;
  const cookieId = request.cookies.get(AFFILIATE_COOKIE_ID)?.value;

  return {
    refCode,
    cookieId,
    hasAffiliate: !!refCode && !!cookieId,
  };
}

/**
 * Track a conversion for the current affiliate cookie
 * Call this from server-side code when a conversion happens
 */
export async function trackConversion(
  refCode: string | undefined,
  customerId: string,
  type: 'REGISTRATION' | 'ACCEPTED_OFFER',
  metadata?: {
    tireRequestId?: string
    offerId?: string
  }
) {
  if (!refCode) {
    return null; // No affiliate to track
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/affiliate/convert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refCode,
          customerId,
          type,
          ...metadata
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      return data.conversion;
    }
  } catch (error) {
    console.error('[AFFILIATE] Conversion tracking error:', error);
  }

  return null;
}
