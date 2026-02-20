'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * DEPRECATED: This page redirects to the new bookings system
 * The old TireRequest/Offer workflow has been replaced with DirectBookings
 */
export default function AppointmentsRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new bookings page immediately
    router.replace('/dashboard/customer/bookings')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Weiterleitung zur Buchungsübersicht...</p>
      </div>
    </div>
  )
}
