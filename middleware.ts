import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { handleAffiliateTracking } from './lib/affiliateTracking'

// List of known static routes to avoid checking database
const STATIC_ROUTES = [
  '/api', '/admin', '/dashboard', '/sales', '/auth', '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/agb', '/datenschutz', '/impressum',
  '/faq', '/support', '/pricing', '/workshop-benefits', '/cookie-settings', '/influencer',
  '/werkstatt', '/mitarbeiter',
  '/_next', '/favicon.ico', '/apple-icon', '/icon', '/uploads', '/Bilder'
]

// This middleware runs before NextAuth can intercept calendar callbacks
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  console.log('[MIDDLEWARE] Path:', url.pathname, 'Search:', url.search)
  
  // Handle Affiliate Tracking (if ?ref= parameter exists)
  if (url.searchParams.has('ref')) {
    console.log('[MIDDLEWARE] Affiliate tracking detected')
    return await handleAffiliateTracking(request)
  }
  
  // If this is a calendar callback, let it through to our handler
  if (url.pathname === '/api/gcal/callback') {
    console.log('[MIDDLEWARE] Detected gcal callback - passing through')
    return NextResponse.next()
  }
  
  // Check if this could be a landing page (not a static route)
  const isStaticRoute = STATIC_ROUTES.some(route => url.pathname.startsWith(route))
  const isRootPath = url.pathname === '/'
  
  if (!isStaticRoute && !isRootPath && !url.pathname.startsWith('/lp/')) {
    // This could be a landing page slug, rewrite to /lp/[slug]
    const slug = url.pathname.slice(1) // Remove leading /
    console.log('[MIDDLEWARE] Potential landing page slug:', slug)
    url.pathname = `/lp/${slug}`
    return NextResponse.rewrite(url)
  }
  
  // For all other requests, continue normally
  console.log('[MIDDLEWARE] Non-gcal request')
  return NextResponse.next()
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    // Match calendar callback specifically
    '/api/gcal/callback',
    // Match auth routes (but calendar callback will be handled first)
    '/api/auth/:path*',
    // Match all routes except _next/static, _next/image, favicon.ico, uploads
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}
