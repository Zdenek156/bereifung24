import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { handleAffiliateTracking } from './lib/affiliateTracking'

// List of known static routes to avoid checking database
const STATIC_ROUTES = [
  '/api', '/admin', '/dashboard', '/auth', '/login', '/register', '/forgot-password',
  '/reset-password', '/verify-email', '/agb', '/datenschutz', '/impressum',
  '/faq', '/support', '/pricing', '/workshop-benefits', '/cookie-settings', '/influencer',
  '/werkstatt', '/werkstatt-werden', '/mitarbeiter', '/karriere', '/ratgeber', '/home', '/suche',
  '/_next', '/favicon.ico', '/apple-icon', '/icon', '/uploads', '/Bilder', '/logos',
  '/robots.txt', '/sitemap', '/sitemap.xml', '/sitemap-blog.xml', '/sitemap-werkstatt.xml', '/sitemap-reifen.xml', '/app-download', '/demo',
  '/smart-tire-advisor', '/invoices', '/workshop', '/services', '/freelancer', '/reifen', '/konto-loeschen',
  '/api/mobile-auth', '/ueber-uns',
  '/reifenwechsel', '/winterreifen', '/sommerreifen', '/reifenmontage', '/raederwechsel',
  '/reifen-einlagern', '/reifenservice', '/achsvermessung', '/ganzjahresreifen', '/reifen-kaufen'
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
  '/admin/tire-catalog': 'reifenkatalog',
  '/admin/email-templates': 'email-templates',
  '/admin/email-blacklist': 'email-blacklist',
  '/admin/kvp': 'kvp',
  '/admin/knowledge': 'knowledge',
  '/admin/settings': 'settings',
  '/admin/influencer-applications': 'influencers',
  '/admin/influencer-management': 'influencers',
  '/admin/influencer-payments': 'influencers',
  '/admin/roadmap': 'roadmap',
  '/admin/blog': 'blog',
  '/admin/eprel': 'eprel',
  '/admin/gdpr': 'gdpr',
  '/admin/payment-methods': 'payment-methods',
  '/admin/support': 'support',
  '/admin/supplier-management': 'lieferanten',
  '/admin/freelancers': 'freelancers',
  '/admin/gutscheine': 'gutscheine',
  '/admin/push-notifications': 'push-benachrichtigungen',
  '/admin/feedback': 'feedback',
  '/admin/social-media': 'social-media',
  '/admin/legal-texts': 'legal-texts',
  '/admin/workshop-recommendations': 'workshop-empfehlungen',
  '/admin/chargebacks': 'chargebacks',
  '/admin/app-versions': 'app-versions',
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
  '/api/admin/roadmap': 'roadmap',
  '/api/mitarbeiter/roadmap': 'roadmap',
  '/api/admin/blog': 'blog',
  '/api/blog': 'public',
  '/api/admin/eprel': 'eprel',
  '/api/admin/gdpr': 'gdpr',
  '/api/admin/payment-methods': 'payment-methods',
  '/api/admin/suppliers': 'reifenkatalog',
  '/api/admin/tire-catalog': 'reifenkatalog',
  '/api/admin/supplier-management': 'lieferanten',
  '/api/admin/support': 'support',
  '/api/admin/freelancers': 'freelancers',
  '/api/admin/coupons': 'gutscheine',
  '/api/admin/push-notifications': 'push-benachrichtigungen',
  '/api/admin/feedback': 'feedback',
  '/api/admin/social-media': 'social-media',
  '/api/admin/legal-texts': 'legal-texts',
  '/api/admin/workshop-recommendations': 'workshop-empfehlungen',
  '/api/admin/chargebacks': 'chargebacks',
  '/api/admin/app-versions': 'app-versions',
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
 * Uses API call with timeout - Prisma cannot run in Edge Runtime (middleware)
 */
async function checkApplicationAccess(
  userId: string,
  applicationKey: string,
  userRole: string
): Promise<boolean> {
  // ADMIN has access to everything
  if (userRole === 'ADMIN') return true

  // For B24_EMPLOYEE, check via API (cannot use Prisma in middleware)
  if (userRole === 'B24_EMPLOYEE') {
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://bereifung24.de'
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5s timeout
      
      const response = await fetch(`${baseUrl}/api/employee/has-application?key=${applicationKey}`, {
        headers: {
          'x-user-id': userId,
          'x-user-role': userRole,
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
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
  
  // === WWW → NON-WWW REDIRECT (SEO: canonical domain is bereifung24.de) ===
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const redirectUrl = new URL(request.url)
    redirectUrl.host = host.replace('www.', '')
    return NextResponse.redirect(redirectUrl, 301)
  }
  
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
  if (!token && (url.pathname.startsWith('/admin') || url.pathname.startsWith('/mitarbeiter') || url.pathname.startsWith('/freelancer'))) {
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
      // If user is B24_EMPLOYEE, redirect to /mitarbeiter/* instead
      if (userRole === 'B24_EMPLOYEE') {
        const mitarbeiterUrl = url.clone()
        mitarbeiterUrl.pathname = url.pathname.replace('/admin', '/mitarbeiter')
        console.log(`[MIDDLEWARE] Redirecting B24_EMPLOYEE from ${url.pathname} to ${mitarbeiterUrl.pathname}`)
        return NextResponse.redirect(mitarbeiterUrl)
      }
      
      // Allow access for ADMIN - permission checking is done on the page level
      console.log(`[MIDDLEWARE] Allowing authenticated access to ${url.pathname}`)
      return NextResponse.next()
    }

    // Check /mitarbeiter/* routes
    if (url.pathname.startsWith('/mitarbeiter/')) {
      // Allow access - next.config.js rewrites handle the /mitarbeiter/* -> /admin/* mapping
      // No need to rewrite here, Next.js handles it automatically
      console.log(`[MIDDLEWARE] Allowing access to ${url.pathname} (next.config.js handles rewrite)`)
      return NextResponse.next()
    }

    // Check /sales route (special case - not under /admin)
    if (url.pathname.startsWith('/sales')) {
      // Allow access - permission checking is done on the page level
      console.log(`[MIDDLEWARE] Allowing authenticated access to /sales`)
      return NextResponse.next()
    }

    // Check /freelancer/* routes
    if (url.pathname.startsWith('/freelancer')) {
      if (userRole !== 'FREELANCER' && userRole !== 'ADMIN') {
        console.log(`[MIDDLEWARE] Access denied to ${url.pathname} for role ${userRole}`)
        const dashboardUrl = url.clone()
        if (userRole === 'CUSTOMER') dashboardUrl.pathname = '/dashboard/customer'
        else if (userRole === 'WORKSHOP') dashboardUrl.pathname = '/dashboard/workshop'
        else dashboardUrl.pathname = '/dashboard'
        return NextResponse.redirect(dashboardUrl)
      }
      console.log(`[MIDDLEWARE] Allowing FREELANCER access to ${url.pathname}`)
      return NextResponse.next()
    }

    // Redirect FREELANCER from generic routes to /freelancer
    if (userRole === 'FREELANCER' && (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/'))) {
      console.log(`[MIDDLEWARE] Redirecting FREELANCER from ${url.pathname} to /freelancer`)
      const freelancerUrl = url.clone()
      freelancerUrl.pathname = '/freelancer'
      return NextResponse.redirect(freelancerUrl)
    }

    // Check /api/freelancer/* routes
    if (url.pathname.startsWith('/api/freelancer/')) {
      if (userRole !== 'FREELANCER' && userRole !== 'ADMIN') {
        console.log(`[MIDDLEWARE] API access denied to ${url.pathname} for role ${userRole}`)
        return NextResponse.json(
          { error: 'Keine Berechtigung', message: 'Nur für Freelancer zugänglich' },
          { status: 403 }
        )
      }
      return NextResponse.next()
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
        
        console.log(`[MIDDLEWARE] API access granted to ${url.pathname} for user ${userId}`)
        return NextResponse.next()
      }
      
      // No application key found for API route, allow access
      console.log(`[MIDDLEWARE] No app key for API ${url.pathname}, allowing access`)
      return NextResponse.next()
    }
  }
  
  // === END PERMISSION CHECKING ===
  
  // Check if this could be a landing page (not a static route)
  const isStaticRoute = STATIC_ROUTES.some(route => url.pathname.startsWith(route))
  const isRootPath = url.pathname === '/'
  
  // If it's a static route, pass through immediately
  if (isStaticRoute) {
    console.log('[MIDDLEWARE] Static route, passing through:', url.pathname)
    return NextResponse.next()
  }
  
  // Skip landing page logic for /ratgeber routes (blog pages)
  if (url.pathname.startsWith('/ratgeber')) {
    console.log('[MIDDLEWARE] Blog route, passing through:', url.pathname)
    return NextResponse.next()
  }
  
  // Skip landing page rewrite for static file extensions (public folder assets)
  const hasFileExtension = /\.(png|jpg|jpeg|svg|gif|webp|ico|css|js|woff2?|ttf|eot|map|json|txt|xml|pdf|mp4|webm)$/i.test(url.pathname)
  if (hasFileExtension) {
    console.log('[MIDDLEWARE] Static file, passing through:', url.pathname)
    return NextResponse.next()
  }

  if (!isRootPath && !url.pathname.startsWith('/lp/')) {
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
