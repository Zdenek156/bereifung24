'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('bereifung24_cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    localStorage.setItem('bereifung24_cookie_consent', JSON.stringify({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    }))
    localStorage.setItem('bereifung24_cookie_consent_date', new Date().toISOString())
    setShowBanner(false)
  }

  const acceptNecessaryOnly = () => {
    localStorage.setItem('bereifung24_cookie_consent', JSON.stringify({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    }))
    localStorage.setItem('bereifung24_cookie_consent_date', new Date().toISOString())
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-primary-600 shadow-2xl z-50 animate-slideUp">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">🍪 Cookie-Einstellungen</h3>
              <p className="text-gray-600">
                Wir verwenden Cookies, um Ihnen das beste Erlebnis auf unserer Website zu bieten. 
                Einige sind notwendig, während andere uns helfen, die Website zu verbessern.{' '}
                <Link href="/cookie-settings" className="text-primary-600 hover:text-primary-700 font-semibold underline">
                  Mehr erfahren
                </Link>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={acceptNecessaryOnly}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                Nur notwendige
              </button>
              <Link
                href="/cookie-settings"
                className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-center whitespace-nowrap"
              >
                Anpassen
              </Link>
              <button
                onClick={acceptAll}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg whitespace-nowrap"
              >
                Alle akzeptieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
