import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const workshopId = url.searchParams.get('id')
  
  if (!workshopId) {
    return NextResponse.json({ error: 'Workshop ID required' }, { status: 400 })
  }
  
  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
    select: {
      id: true,
      companyName: true,
      calendarMode: true,
      googleCalendarId: true,
      googleRefreshToken: true,
      googleAccessToken: true,
      googleTokenExpiry: true,
      openingHours: true,
      employees: {
        select: {
          id: true,
          name: true,
          googleCalendarId: true,
          googleRefreshToken: true,
          googleAccessToken: true,
          googleTokenExpiry: true,
          workingHours: true
        }
      }
    }
  })
  
  if (!workshop) {
    return NextResponse.json({ error: 'Workshop not found' }, { status: 404 })
  }
  
  return NextResponse.json({
    ...workshop,
    hasWorkshopCalendar: !!workshop.googleCalendarId,
    hasWorkshopToken: !!workshop.googleRefreshToken,
    tokenExpired: workshop.googleTokenExpiry ? new Date() > workshop.googleTokenExpiry : null,
    employees: workshop.employees.map(emp => ({
      ...emp,
      hasCalendar: !!emp.googleCalendarId,
      hasToken: !!emp.googleRefreshToken,
      tokenExpired: emp.googleTokenExpiry ? new Date() > emp.googleTokenExpiry : null,
      googleRefreshToken: emp.googleRefreshToken ? '***' : null,
      googleAccessToken: emp.googleAccessToken ? '***' : null
    })),
    googleRefreshToken: workshop.googleRefreshToken ? '***' : null,
    googleAccessToken: workshop.googleAccessToken ? '***' : null
  })
}
