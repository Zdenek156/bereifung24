import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This middleware runs before NextAuth can intercept calendar callbacks
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  // If this is a calendar callback, let it through to our handler
  if (url.pathname === '/api/calendar/callback') {
    // Don't intercept, let our route handler process it
    return NextResponse.next()
  }
  
  // For all other requests, continue normally
  return NextResponse.next()
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    // Match calendar callback specifically
    '/api/calendar/callback',
    // Match auth routes (but calendar callback will be handled first)
    '/api/auth/:path*',
  ],
}
