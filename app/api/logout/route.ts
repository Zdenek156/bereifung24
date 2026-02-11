import { NextResponse } from 'next/server'

/**
 * Custom logout endpoint that properly deletes all NextAuth cookies
 * Must be outside /api/auth/* path as NextAuth blocks those routes
 */
export async function POST() {
  try {
    console.log('[CUSTOM LOGOUT] Force logout requested')
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'All cookies deleted' 
    })
    
    // Delete all possible NextAuth cookie variations
    const cookieNames = [
      'next-auth.session-token',
      '__Secure-next-auth.session-token',
      'next-auth.csrf-token',
      '__Host-next-auth.csrf-token',
      'next-auth.callback-url',
      '__Secure-next-auth.callback-url',
      '__Secure-next-auth.session-token.0',
      '__Secure-next-auth.session-token.1'
    ]
    
    // Set all cookies to expired (delete them)
    cookieNames.forEach(name => {
      // Try multiple domain configurations
      const domains = [undefined, 'bereifung24.de', '.bereifung24.de']
      
      domains.forEach(domain => {
        response.cookies.set(name, '', {
          expires: new Date(0),
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          ...(domain && { domain })
        })
      })
      
      console.log(`[CUSTOM LOGOUT] Deleted cookie: ${name}`)
    })
    
    console.log('[CUSTOM LOGOUT] All cookies marked for deletion')
    
    return response
  } catch (error) {
    console.error('[CUSTOM LOGOUT] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' }, 
      { status: 500 }
    )
  }
}
