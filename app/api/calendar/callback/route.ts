import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokensFromCode, getPrimaryCalendarId } from '@/lib/google-calendar'

// OAuth callback - handle Google's redirect after authorization
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=scheduling&error=calendar_auth_denied`
      )
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=scheduling&error=invalid_callback`
      )
    }
    
    // Parse state
    const { workshopId, employeeId, type } = JSON.parse(state)
    
    // Exchange code for tokens
    const tokens = await getTokensFromCode(code)
    
    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=scheduling&error=token_exchange_failed`
      )
    }
    
    // Get primary calendar ID
    const calendarId = await getPrimaryCalendarId(
      tokens.access_token,
      tokens.refresh_token
    )
    
    // Calculate token expiry
    const expiryDate = tokens.expiry_date 
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000) // 1 hour default
    
    // Save tokens to database
    if (type === 'workshop') {
      await prisma.workshop.update({
        where: { id: workshopId },
        data: {
          googleCalendarId: calendarId,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleTokenExpiry: expiryDate,
        }
      })
    } else if (type === 'employee' && employeeId) {
      await prisma.employee.update({
        where: { id: employeeId },
        data: {
          googleCalendarId: calendarId,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: tokens.refresh_token,
          googleTokenExpiry: expiryDate,
        }
      })
    }
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=scheduling&success=calendar_connected`
    )
  } catch (error) {
    console.error('Calendar callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/workshop/settings?tab=scheduling&error=callback_failed`
    )
  }
}
