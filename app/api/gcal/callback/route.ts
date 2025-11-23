import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokensFromCode, getPrimaryCalendarId } from '@/lib/google-calendar'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// OAuth callback - handle Google's redirect after authorization
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    console.log('Calendar callback received:', { 
      hasCode: !!code, 
      hasState: !!state, 
      error 
    })
    
    if (error) {
      console.error('Calendar auth error:', error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=terminplanung&error=calendar_auth_denied`
      )
    }
    
    if (!code) {
      console.error('No code in callback')
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=terminplanung&error=no_code`
      )
    }
    
    if (!state) {
      console.error('No state in callback')
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=scheduling&error=no_state`
      )
    }
    
    // Parse state
    let workshopId, employeeId, type
    try {
      const parsed = JSON.parse(state)
      workshopId = parsed.workshopId
      employeeId = parsed.employeeId
      type = parsed.type
      console.log('Parsed state:', { workshopId, employeeId, type })
    } catch (parseError) {
      console.error('Failed to parse state:', parseError)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=terminplanung&error=invalid_state`
      )
    }
    
    // Exchange code for tokens
    console.log('Exchanging code for tokens...')
    const tokens = await getTokensFromCode(code)
    console.log('Tokens received:', { 
      hasAccessToken: !!tokens.access_token, 
      hasRefreshToken: !!tokens.refresh_token 
    })
    
    if (!tokens.access_token || !tokens.refresh_token) {
      console.error('Missing tokens:', tokens)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=terminplanung&error=token_exchange_failed`
      )
    }
    
    // Get primary calendar ID
    console.log('Getting calendar ID...')
    const calendarId = await getPrimaryCalendarId(
      tokens.access_token,
      tokens.refresh_token
    )
    console.log('Calendar ID:', calendarId)
    
    // Calculate token expiry
    const expiryDate = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000) // 1 hour default
    
    // Save tokens to database
    console.log('Saving to database...', { 
      type, 
      workshopId, 
      employeeId,
      calendarId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate 
    })
    
    if (type === 'workshop') {
      console.log('Updating workshop with data:', {
        workshopId,
        calendarId,
        accessTokenLength: tokens.access_token?.length,
        refreshTokenLength: tokens.refresh_token?.length
      })
      
      const updated = await prisma.workshop.update({
        where: { id: workshopId },
        data: {
          googleCalendarId: calendarId,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleTokenExpiry: expiryDate,
        }
      })
      
      console.log('Workshop updated successfully:', { 
        id: updated.id,
        companyName: updated.companyName,
        hasCalendarId: !!updated.googleCalendarId,
        hasAccessToken: !!updated.googleAccessToken,
        hasRefreshToken: !!updated.googleRefreshToken,
        tokenExpiry: updated.googleTokenExpiry
      })
    } else if (type === 'employee' && employeeId) {
      console.log('Updating employee with data:', {
        employeeId,
        calendarId,
        accessTokenLength: tokens.access_token?.length,
        refreshTokenLength: tokens.refresh_token?.length
      })
      
      const updated = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          googleCalendarId: calendarId,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleTokenExpiry: expiryDate,
        }
      })
      
      console.log('Employee updated successfully:', { 
        id: updated.id,
        name: updated.name,
        hasCalendarId: !!updated.googleCalendarId,
        hasAccessToken: !!updated.googleAccessToken,
        hasRefreshToken: !!updated.googleRefreshToken,
        tokenExpiry: updated.googleTokenExpiry
      })
    } else {
      console.error('Invalid type or missing employee ID:', { type, employeeId })
      throw new Error('Invalid calendar connection type')
    }
    
    console.log('Calendar connection successful, redirecting...')
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=terminplanung&success=calendar_connected`
    )
  } catch (error) {
    console.error('Calendar callback error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=terminplanung&error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    )
  }
}
