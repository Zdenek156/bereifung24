import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { decode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

/**
 * Custom logout endpoint that properly deletes all NextAuth cookies
 * AND adds JWT token to blacklist for immediate revocation
 * Must be outside /api/auth/* path as NextAuth blocks those routes
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CUSTOM LOGOUT] Force logout requested')
    
    // Try to decode JWT token directly from cookie
    const cookieStore = cookies()
    const sessionToken = cookieStore.get('__Secure-next-auth.session-token')?.value || 
                        cookieStore.get('next-auth.session-token')?.value
    
    if (sessionToken) {
      console.log('[CUSTOM LOGOUT] Session token found, decoding...')
      
      try {
        // Decode JWT to extract JTI
        const decoded = await decode({
          token: sessionToken,
          secret: process.env.NEXTAUTH_SECRET!
        })
        
        if (decoded) {
          console.log('[CUSTOM LOGOUT] Token decoded:', {
            hasJTI: !!decoded.jti,
            userId: decoded.id,
            email: decoded.email
          })
          
          // @ts-ignore
          const jti = decoded.jti
          // @ts-ignore
          const userId = decoded.id
          
          if (jti && userId) {
            // Add to revoked tokens table
            await prisma.revokedToken.create({
              data: {
                jti: jti,
                userId: userId,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
              }
            })
            console.log('[CUSTOM LOGOUT] JWT added to blacklist:', jti)
          } else {
            console.log('[CUSTOM LOGOUT] No JTI or userId in decoded token')
          }
        } else {
          console.log('[CUSTOM LOGOUT] Could not decode token')
        }
      } catch (error) {
        console.error('[CUSTOM LOGOUT] Error decoding/blacklisting token:', error)
      }
    } else {
      console.log('[CUSTOM LOGOUT] No session token found in cookies')
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
      // Delete without domain
      response.cookies.set(name, '', {
        expires: new Date(0),
        maxAge: -1,
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      })
      
      // Delete with explicit domain for production
      if (process.env.NODE_ENV === 'production') {
        response.cookies.set(name, '', {
          expires: new Date(0),
          maxAge: -1,
          path: '/',
          domain: 'bereifung24.de',
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        })
      }
      
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
