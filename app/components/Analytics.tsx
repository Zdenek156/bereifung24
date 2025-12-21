'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function Analytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Track page view on mount and when route changes
    const trackPageView = async () => {
      try {
        // Build full URL
        const fullUrl = window.location.href
        const pageTitle = document.title

        // Get referrer
        const referrer = document.referrer || null

        // Check if it's a workshop landing page
        const workshopSlugMatch = pathname.match(/^\/lp\/([^\/]+)/)
        const workshopSlug = workshopSlugMatch ? workshopSlugMatch[1] : null

        // Send tracking request
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
            fullUrl,
            pageTitle,
            referrer,
            workshopSlug,
          }),
        })
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Analytics tracking failed:', error)
      }
    }

    trackPageView()
  }, [pathname, searchParams])

  // This component doesn't render anything
  return null
}
