'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function AffiliateTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get('ref')
    
    if (refCode) {
      // Generate or get existing cookie ID
      let cookieId = document.cookie
        .split('; ')
        .find(row => row.startsWith('b24_cookie_id='))
        ?.split('=')[1]
      
      if (!cookieId) {
        cookieId = Math.random().toString(36).substring(2) + Date.now().toString(36)
        // Set cookie for 30 days
        document.cookie = `b24_cookie_id=${cookieId}; path=/; max-age=${30 * 24 * 60 * 60}`
      }
      
      // Set affiliate ref cookie
      document.cookie = `b24_affiliate_ref=${refCode}; path=/; max-age=${30 * 24 * 60 * 60}`
      
      // Track the click
      fetch(`/api/affiliate/track?ref=${refCode}&cookieId=${cookieId}`)
        .then(res => res.json())
        .then(data => {
          console.log('[AFFILIATE] Click tracked:', data)
        })
        .catch(err => {
          console.error('[AFFILIATE] Tracking failed:', err)
        })
    }
  }, [searchParams])

  return null // This component doesn't render anything
}
