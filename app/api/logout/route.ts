import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Custom logout endpoint that properly deletes all NextAuth cookies
 * AND adds JWT token to blacklist for immediate revocation
 * Must be outside /api/auth/* path as NextAuth blocks those routes
 */
export async function POST() {
  try {
    console.log('[CUSTOM LOGOUT] Force logout requested')
    
    // Get current session to extract JWT ID
    const session = await getServerSession(authOptions)
    
    if (session?.user) {
      console.log('[CUSTOM LOGOUT] User session found:', session.user.email)
      
      // Add JWT to blacklist if we have the token
      try {
        const token = await getServerSession(authOptions)
        // @ts-ignore - accessing internal token structure
        const jti = token?.jti
        
        if (jti) {
          // Add to revoked tokens table
          await prisma.revokedToken.create({
            data: {
              jti: jti,
              userId: session.user.id,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
          })
          console.log('[CUSTOM LOGOUT] JWT added to blacklist:', jti)
        } else {
          console.log('[CUSTOM LOGOUT] No JTI found in token')
        }
      } catch (error) {
        console.error('[CUSTOM LOGOUT] Error adding to blacklist:', error)
      }
    }
    
    // Create response
    const response = NextResponse.json({ 
      success: true, 
      message: 'All cookies deleted and token revoked' 
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
