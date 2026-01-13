import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { handleAffiliateTracking } from './lib/affiliateTracking'

// List of known static routes to avoid checking database
const STATIC_ROUTES = [
  '/api', '/admin', '/dashboard', '/auth', '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/agb', '/datenschutz', '/impressum',
  '/faq', '/support', '/pricing', '/workshop-benefits', '/cookie-settings', '/influencer',
  '/werkstatt', '/mitarbeiter',
  '/_next', '/favicon.ico', '/apple-icon', '/icon', '/uploads', '/Bilder'
]

// Map admin routes to application keys for permission checking
const ROUTE_TO_APPLICATION_MAP: Record<string, string> = {
  '/admin/buchhaltung': 'buchhaltung',
  '/admin/hr': 'hr',
  '/admin/customers': 'customers',
  '/admin/workshops': 'workshops',
  '/admin/analytics': 'analytics',
  '/admin/procurement': 'procurement',
  '/admin/sales': 'sales',
  '/admin/affiliates': 'affiliates',
  '/admin/commissions': 'commissions',
  '/admin/billing': 'billing',
  '/admin/recruitment': 'recruitment',
  '/admin/payroll': 'payroll',
  '/admin/files': 'files',
  '/admin/fleet': 'fleet',
  '/admin/email-templates': 'email-templates',
  '/admin/email-blacklist': 'email-blacklist',
  '/admin/kvp': 'kvp',
  '/admin/knowledge': 'knowledge',
  '/admin/settings': 'settings',
  '/admin/influencer-applications': 'influencers',
  '/admin/influencer-management': 'influencers',
  '/admin/influencer-payments': 'influencers',
}

// API routes to application mapping
const API_ROUTE_TO_APPLICATION_MAP: Record<string, string> = {
  '/api/admin/accounting': 'buchhaltung',
  '/api/admin/hr': 'hr',
  '/api/admin/customers': 'customers',
  '/api/admin/workshops': 'workshops',
  '/api/admin/analytics': 'analytics',
  '/api/admin/procurement': 'procurement',
  '/api/admin/commissions': 'commissions',
  '/api/admin/billing': 'billing',
  '/api/admin/influencer': 'influencers',
}

/**
 * Get application key from route path
 */
function getApplicationKeyFromPath(pathname: string): string | null {
  // Check exact matches first
  if (ROUTE_TO_APPLICATION_MAP[pathname]) {
    return ROUTE_TO_APPLICATION_MAP[pathname]
  }

  // Check if path starts with any mapped route
  for (const [route, appKey] of Object.entries(ROUTE_TO_APPLICATION_MAP)) {
    if (pathname.startsWith(route + '/')) {
      return appKey
    }
  }

  // For API routes
  for (const [route, appKey] of Object.entries(API_ROUTE_TO_APPLICATION_MAP)) {
    if (pathname.startsWith(route)) {
      return appKey
    }
  }

  return null
}

/**
 * Check if user has access to a specific application
 */
async function checkApplicationAccess(
  userId: string,
  applicationKey: string,
  userRole: string
): Promise<boolean> {
  // ADMIN has access to everything
  if (userRole === 'ADMIN') return true

  // For B24_EMPLOYEE, check database
  if (userRole === 'B24_EMPLOYEE') {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://www.bereifung24.de'
      const response = await fetch(`${baseUrl}/api/employee/has-application?key=${applicationKey}`, {
        headers: {
          'x-user-id': userId,
          'x-user-role': userRole,
        },
        signal: AbortSignal.timeout(2000),
      })

      if (response.ok) {
        const { hasAccess } = await response.json()
        return hasAccess
      }
    } catch (error) {
      console.error('[MIDDLEWARE] Error checking application access:', error)
      // On error, allow access to prevent lockout (logged for monitoring)
      return true
    }
  }

  return false
}

// This middleware runs before NextAuth can intercept calendar callbacks
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  console.log('[MIDDLEWARE] Path:', url.pathname, 'Search:', url.search)
  
  // Handle Affiliate Tracking (if ?ref= parameter exists)
  if (url.searchParams.has('ref')) {
    console.log('[MIDDLEWARE] Affiliate tracking detected')
    return await handleAffiliateTracking(request)
  }
  
  // If this is a calendar callback, let it through to our handler
  if (url.pathname === '/api/gcal/callback') {
    console.log('[MIDDLEWARE] Detected gcal callback - passing through')
    return NextResponse.next()
  }

  // === PERMISSION CHECKING FOR ADMIN/MITARBEITER ROUTES ===
  
  // Get user session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Check if user is authenticated for protected routes
  if (!token && (url.pathname.startsWith('/admin') || url.pathname.startsWith('/mitarbeiter'))) {
    const loginUrl = url.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('callbackUrl', url.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is authenticated, check permissions
  if (token) {
    const userRole = token.role as string
    const userId = token.sub as string

    // Check /admin/* routes (except /admin dashboard itself)
    if (url.pathname.startsWith('/admin/')) {
      const applicationKey = getApplicationKeyFromPath(url.pathname)

      if (applicationKey) {
        const hasAccess = await checkApplicationAccess(userId, applicationKey, userRole)

        if (!hasAccess) {
          console.log(`[MIDDLEWARE] Access denied to ${url.pathname} for user ${userId}`)
          const dashboardUrl = url.clone()
          dashboardUrl.pathname = userRole === 'B24_EMPLOYEE' ? '/mitarbeiter' : '/admin'
          dashboardUrl.searchParams.set('error', 'no-permission')
          dashboardUrl.searchParams.set('module', applicationKey)
          return NextResponse.redirect(dashboardUrl)
        }
      }
    }

    // Check /mitarbeiter/* routes that map to admin modules
    if (url.pathname.startsWith('/mitarbeiter/')) {
      // Personal employee pages don't need permission checks (profil, urlaub, etc.)
      const personalPages = [
        '/mitarbeiter/profil',
        '/mitarbeiter/dokumente',
        '/mitarbeiter/urlaub',
        '/mitarbeiter/spesen',
        '/mitarbeiter/reisekosten',
        '/mitarbeiter/krankmeldung',
        '/mitarbeiter/zeit',
        '/mitarbeiter/fahrtenbuch',
        '/mitarbeiter/news',
        '/mitarbeiter/aufgaben',
        '/mitarbeiter/wiki',
        '/mitarbeiter/files',
        '/mitarbeiter/email',
      ]

      const isPersonalPage = personalPages.some(page => url.pathname.startsWith(page))

      if (!isPersonalPage && url.pathname !== '/mitarbeiter') {
        // This is an admin module accessed via /mitarbeiter/* - check permissions
        const adminPath = url.pathname.replace('/mitarbeiter/', '/admin/')
        const applicationKey = getApplicationKeyFromPath(adminPath)

        if (applicationKey) {
          const hasAccess = await checkApplicationAccess(userId, applicationKey, userRole)

          if (!hasAccess) {
            console.log(`[MIDDLEWARE] Access denied to ${url.pathname} for user ${userId}`)
            const dashboardUrl = url.clone()
            dashboardUrl.pathname = '/mitarbeiter'
            dashboardUrl.searchParams.set('error', 'no-permission')
            dashboardUrl.searchParams.set('module', applicationKey)
            return NextResponse.redirect(dashboardUrl)
          }
        }
      }
    }

    // Check /sales route (special case - not under /admin)
    if (url.pathname.startsWith('/sales')) {
      const hasAccess = await checkApplicationAccess(userId, 'sales', userRole)

      if (!hasAccess) {
        console.log(`[MIDDLEWARE] Access denied to /sales for user ${userId}`)
        const dashboardUrl = url.clone()
        dashboardUrl.pathname = userRole === 'B24_EMPLOYEE' ? '/mitarbeiter' : '/admin'
        dashboardUrl.searchParams.set('error', 'no-permission')
        dashboardUrl.searchParams.set('module', 'sales')
        return NextResponse.redirect(dashboardUrl)
      }
    }

    // Check API routes
    if (url.pathname.startsWith('/api/admin/')) {
      const applicationKey = getApplicationKeyFromPath(url.pathname)

      if (applicationKey) {
        const hasAccess = await checkApplicationAccess(userId, applicationKey, userRole)

        if (!hasAccess) {
          console.log(`[MIDDLEWARE] API access denied to ${url.pathname} for user ${userId}`)
          return NextResponse.json(
            {
              error: 'Keine Berechtigung',
              message: `Sie haben keinen Zugriff auf das Modul "${applicationKey}"`,
            },
            { status: 403 }
          )
        }
      }
    }
  }

  // === END PERMISSION CHECKING ===
  
  // Check if this could be a landing page (not a static route)
  const isStaticRoute = STATIC_ROUTES.some(route => url.pathname.startsWith(route))
  const isRootPath = url.pathname === '/'
  
  if (!isStaticRoute && !isRootPath && !url.pathname.startsWith('/lp/')) {
    // This could be a landing page slug, rewrite to /lp/[slug]
    const slug = url.pathname.slice(1) // Remove leading /
    console.log('[MIDDLEWARE] Potential landing page slug:', slug)
    url.pathname = `/lp/${slug}`
    return NextResponse.rewrite(url)
  }
  
  // For all other requests, continue normally
  console.log('[MIDDLEWARE] Non-gcal request')
  return NextResponse.next()
}

// Configure which routes this middleware applies to
export const config = {
  matcher: [
    // Match calendar callback specifically
    '/api/gcal/callback',
    // Match auth routes (but calendar callback will be handled first)
    '/api/auth/:path*',
    // Match all routes except _next/static, _next/image, favicon.ico, uploads
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
}
