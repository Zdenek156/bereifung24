import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { refreshAccessToken } from '@/lib/google-calendar'

/**
 * Cron job endpoint to refresh all Google Calendar tokens before they expire
 * Should be called regularly (e.g., every hour) to ensure tokens never expire
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Starting token refresh check...')
    
    const now = new Date()
    const expiryThreshold = new Date(now.getTime() + 24 * 60 * 60 * 1000) // Refresh if expiring within 24 hours
    
    // Find all workshops with tokens that need refresh
    const workshops = await prisma.workshop.findMany({
      where: {
        googleRefreshToken: { not: null },
        OR: [
          { googleTokenExpiry: null }, // Never expires set
          { googleTokenExpiry: { lt: expiryThreshold } } // Expiring soon
        ]
      },
      select: {
        id: true,
        companyName: true,
        googleRefreshToken: true,
        googleTokenExpiry: true
      }
    })
    
    console.log(`Found ${workshops.length} workshops needing token refresh`)
    
    let workshopSuccessCount = 0
    let workshopFailCount = 0
    
    for (const workshop of workshops) {
      try {
        console.log(`Refreshing token for workshop: ${workshop.companyName} (${workshop.id})`)
        
        const newTokens = await refreshAccessToken(workshop.googleRefreshToken!)
        const expiryDate = newTokens.expiry_date 
          ? new Date(newTokens.expiry_date)
          : new Date(Date.now() + 3600 * 1000)
        
        await prisma.workshop.update({
          where: { id: workshop.id },
          data: {
            googleAccessToken: newTokens.access_token,
            googleTokenExpiry: expiryDate
          }
        })
        
        console.log(`✅ Workshop ${workshop.companyName} token refreshed, expires: ${expiryDate}`)
        workshopSuccessCount++
      } catch (error) {
        console.error(`❌ Failed to refresh token for workshop ${workshop.companyName}:`, error)
        workshopFailCount++
      }
    }
    
    // Find all employees with tokens that need refresh
    const employees = await prisma.employee.findMany({
      where: {
        googleRefreshToken: { not: null },
        OR: [
          { googleTokenExpiry: null },
          { googleTokenExpiry: { lt: expiryThreshold } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
        workshop: {
          select: {
            companyName: true
          }
        }
      }
    })
    
    console.log(`Found ${employees.length} employees needing token refresh`)
    
    let employeeSuccessCount = 0
    let employeeFailCount = 0
    
    for (const employee of employees) {
      try {
        console.log(`Refreshing token for employee: ${employee.name} (${employee.email}) at ${employee.workshop.companyName}`)
        
        const newTokens = await refreshAccessToken(employee.googleRefreshToken!)
        const expiryDate = newTokens.expiry_date 
          ? new Date(newTokens.expiry_date)
          : new Date(Date.now() + 3600 * 1000)
        
        await prisma.employee.update({
          where: { id: employee.id },
          data: {
            googleAccessToken: newTokens.access_token,
            googleTokenExpiry: expiryDate
          }
        })
        
        console.log(`✅ Employee ${employee.name} token refreshed, expires: ${expiryDate}`)
        employeeSuccessCount++
      } catch (error) {
        console.error(`❌ Failed to refresh token for employee ${employee.name}:`, error)
        employeeFailCount++
      }
    }
    
    const summary = {
      timestamp: new Date().toISOString(),
      workshops: {
        total: workshops.length,
        successful: workshopSuccessCount,
        failed: workshopFailCount
      },
      employees: {
        total: employees.length,
        successful: employeeSuccessCount,
        failed: employeeFailCount
      }
    }
    
    console.log('🎉 Token refresh completed:', summary)
    
    return NextResponse.json({
      success: true,
      message: 'Token refresh completed',
      summary
    })
  } catch (error) {
    console.error('❌ Error in token refresh cron:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Token refresh failed',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
