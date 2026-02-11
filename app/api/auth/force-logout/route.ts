import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Force logout by deleting all NextAuth cookies server-side
 * This is more reliable than client-side cookie deletion
 */
export async function POST() {
  try {
    const cookieStore = cookies()
    
    // Delete all possible NextAuth cookie names
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url'
    ]
    
    console.log('[FORCE LOGOUT] Deleting all NextAuth cookies')
    
    // Create response with deleted cookies
    const response = NextResponse.json({ success: true, message: 'Logged out' })
    
    // Set all cookies to expired
    cookieNames.forEach(name => {
      response.cookies.set(name, '', {
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })
    
    console.log('[FORCE LOGOUT] All cookies deleted, returning response')
    
    return response
  } catch (error) {
    console.error('[FORCE LOGOUT] Error:', error)
    return NextResponse.json({ success: false, error: 'Logout failed' }, { status: 500 })
  }
}
