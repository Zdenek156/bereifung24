'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Diese Seite leitet zur Service-Auswahl weiter
export default function CreateRequestRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/customer/select-service')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Weiterleitung...</p>
      </div>
    </div>
  )
}
