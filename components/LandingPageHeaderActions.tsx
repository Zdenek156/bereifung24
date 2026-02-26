'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { User, ChevronDown, Loader2, LayoutDashboard, BookOpen, Car, SlidersHorizontal } from 'lucide-react'
import LoginModal from '@/components/LoginModal'

export default function LandingPageHeaderActions() {
  const { data: session, status } = useSession()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [mounted, setMounted] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCurrentUrl(window.location.href)
    setMounted(true)
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = async () => {
    setShowUserMenu(false)
    try {
      await signOut({ redirect: false })
      await fetch('/api/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    window.location.reload()
  }

  if (status === 'loading') {
    return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
  }

  if (session?.user) {
    const role = session.user.role as string | undefined

    return (
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">{session.user?.name || 'Mein Konto'}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-semibold text-gray-900">{session.user?.name}</p>
              <p className="text-xs text-gray-500">{session.user?.email}</p>
            </div>

            {(!role || role === 'CUSTOMER') && (
              <>
                <Link href="/dashboard/customer" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setShowUserMenu(false)}>
                  <LayoutDashboard className="w-4 h-4" />Dashboard
                </Link>
                <Link href="/dashboard/customer/bookings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setShowUserMenu(false)}>
                  <BookOpen className="w-4 h-4" />Buchungen
                </Link>
                <Link href="/dashboard/customer/vehicles" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setShowUserMenu(false)}>
                  <Car className="w-4 h-4" />Fahrzeuge
                </Link>
                <Link href="/dashboard/customer/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setShowUserMenu(false)}>
                  <SlidersHorizontal className="w-4 h-4" />Einstellungen
                </Link>
              </>
            )}
            {role === 'WORKSHOP' && (
              <Link href="/dashboard/workshop" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setShowUserMenu(false)}>
                <LayoutDashboard className="w-4 h-4" />Werkstatt-Dashboard
              </Link>
            )}
            {role === 'ADMIN' && (
              <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setShowUserMenu(false)}>
                <LayoutDashboard className="w-4 h-4" />Admin
              </Link>
            )}

            <div className="border-t border-gray-200 my-2" />
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left">
              Abmelden
            </button>
          </div>
        )}
      </div>
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
          href={`/register/customer${currentUrl ? '?returnUrl=' + encodeURIComponent(currentUrl) : ''}`}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
        >
          Registrieren
        </Link>
      </div>
      {mounted && createPortal(
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} returnUrl={currentUrl} />,
        document.body
      )}
    </>
  )
}
