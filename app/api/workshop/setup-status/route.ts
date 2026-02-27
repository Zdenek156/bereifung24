import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/workshop/setup-status
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'WORKSHOP') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        workshop: {
          include: {
            workshopServices: { where: { isActive: true }, select: { id: true } },
            landingPage: { select: { isActive: true } },
            tirePricingBySizes: { select: { id: true }, take: 1 },
            employees: {
              select: { googleCalendarId: true, googleAccessToken: true },
            },
            suppliers: {
              where: { isActive: true },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    })

    if (!user?.workshop) {
      return NextResponse.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 })
    }

    const w = user.workshop

    // 1. Calendar: workshop calendar OR at least one employee with calendar
    const workshopCalendarConnected =
      !!(w.googleCalendarId && w.googleAccessToken)
    const employeeCalendarConnected =
      w.calendarMode === 'employees' &&
      w.employees.some((e) => e.googleCalendarId && e.googleAccessToken)
    const calendarConnected = workshopCalendarConnected || employeeCalendarConnected

    // 2. Stripe
    const stripeConnected = !!(w.stripeAccountId && w.stripeEnabled)

    // 3. Services
    const hasServices = w.workshopServices.length > 0

    // 4. Tire pricing
    const hasPricing = w.tirePricingBySizes.length > 0

    // 5. Supplier connected
    const hasSupplier = w.suppliers.length > 0

    // 6. Landing page (active)
    const hasLandingPage = !!(w.landingPage?.isActive)

    const steps = [
      {
        id: 'calendar',
        label: 'Google Kalender verbinden',
        description: 'Verbinden Sie Ihren Google Kalender, damit Termine automatisch eingetragen werden.',
        done: calendarConnected,
        href: '/dashboard/workshop/settings#calendar',
      },
      {
        id: 'stripe',
        label: 'Stripe Konto verbinden',
        description: 'Verbinden Sie Stripe, um Online-Zahlungen von Kunden zu empfangen.',
        done: stripeConnected,
        href: '/dashboard/workshop/settings#stripe',
      },
      {
        id: 'services',
        label: 'Mindestens 1 Service hinzufügen',
        description: 'Legen Sie Ihre angebotenen Services und Preise an.',
        done: hasServices,
        href: '/dashboard/workshop/services',
      },
      {
        id: 'pricing',
        label: 'Reifenpreiskalkulation einrichten',
        description: 'Definieren Sie Ihre Aufschläge und Preise für Reifen.',
        done: hasPricing,
        href: '/dashboard/workshop/pricing',
      },
      {
        id: 'supplier',
        label: 'Lieferant verbinden',
        description: 'Verbinden Sie mindestens einen Reifenlieferanten (API oder CSV).',
        done: hasSupplier,
        href: '/dashboard/workshop/suppliers',
      },
      {
        id: 'landingPage',
        label: 'Landing Page aktivieren',
        description: 'Erstellen Sie Ihre persönliche Buchungsseite für Kunden.',
        done: hasLandingPage,
        href: '/dashboard/workshop/landing-page',
      },
    ]

    const completedCount = steps.filter((s) => s.done).length
    const allDone = completedCount === steps.length

    return NextResponse.json({ steps, completedCount, total: steps.length, allDone })
  } catch (error) {
    console.error('Setup status error:', error)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
