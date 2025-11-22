import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware runs before NextAuth can intercept calendar callbacks
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  console.log('[MIDDLEWARE] Path:', url.pathname, 'Search:', url.search)
  
  // If this is a calendar callback, let it through to our handler
  if (url.pathname === '/api/gcal/callback') {
    console.log('[MIDDLEWARE] Detected gcal callback - passing through')
    // Don't intercept, let our route handler process it
    return NextResponse.next()
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
  ],
}
