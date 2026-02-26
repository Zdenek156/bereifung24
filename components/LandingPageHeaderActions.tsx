'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import LoginModal from '@/components/LoginModal'

export default function LandingPageHeaderActions() {
  const { data: session } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)

  if (session?.user) {
    const role = session.user.role as string | undefined
    let dashboardHref = '/dashboard'
    if (role === 'ADMIN') dashboardHref = '/admin'
    else if (role === 'WORKSHOP') dashboardHref = '/werkstatt'
    else if (role === 'CUSTOMER') dashboardHref = '/dashboard'

    return (
      <Link
        href={dashboardHref}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
      >
        Mein Konto
      </Link>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowLoginModal(true)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
        >
          Anmelden
        </button>
        <Link
          href="/registrieren"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Registrieren
        </Link>
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  )
}
