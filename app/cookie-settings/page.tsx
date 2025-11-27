'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

interface CookieConsent {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export default function CookieSettingsPage() {
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Always required
    functional: false,
    analytics: false,
    marketing: false
  })

  const [showBanner, setShowBanner] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load existing consent from localStorage
    const storedConsent = localStorage.getItem('bereifung24_cookie_consent')
    if (storedConsent) {
      setConsent(JSON.parse(storedConsent))
    } else {
      setShowBanner(true)
    }
  }, [])

  const savePreferences = () => {
    localStorage.setItem('bereifung24_cookie_consent', JSON.stringify(consent))
    localStorage.setItem('bereifung24_cookie_consent_date', new Date().toISOString())
    setSaved(true)
    setShowBanner(false)
    
    // Apply cookie settings
    if (!consent.analytics) {
      // Remove analytics cookies
      document.cookie.split(";").forEach(function(c) { 
        if (c.trim().startsWith('_ga') || c.trim().startsWith('_gid')) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        }
      });
    }
    
    setTimeout(() => setSaved(false), 3000)
  }

  const acceptAll = () => {
    setConsent({
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true
    })
    setTimeout(() => {
      localStorage.setItem('bereifung24_cookie_consent', JSON.stringify({
        necessary: true,
        functional: true,
        analytics: true,
        marketing: true
      }))
      localStorage.setItem('bereifung24_cookie_consent_date', new Date().toISOString())
      setSaved(true)
      setShowBanner(false)
      setTimeout(() => setSaved(false), 3000)
    }, 100)
  }

  const acceptNecessaryOnly = () => {
    setConsent({
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false
    })
    setTimeout(() => {
      localStorage.setItem('bereifung24_cookie_consent', JSON.stringify({
        necessary: true,
        functional: false,
        analytics: false,
        marketing: false
      }))
      localStorage.setItem('bereifung24_cookie_consent_date', new Date().toISOString())
      setSaved(true)
      setShowBanner(false)
      setTimeout(() => setSaved(false), 3000)
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-primary-600 shadow-2xl z-50 animate-slideUp">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">🍪 Cookie-Einstellungen</h3>
                  <p className="text-gray-600">
                    Wir verwenden Cookies, um Ihnen das beste Erlebnis auf unserer Website zu bieten. 
                    Einige sind notwendig, während andere uns helfen, die Website zu verbessern.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={acceptNecessaryOnly}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Nur notwendige
                  </button>
                  <button
                    onClick={() => setShowBanner(false)}
                    className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                  >
                    Anpassen
                  </button>
                  <button
                    onClick={acceptAll}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg"
                  >
                    Alle akzeptieren
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Cookie-Einstellungen</h1>
          <p className="text-gray-600 mt-2">Verwalten Sie Ihre Cookie-Präferenzen gemäß DSGVO</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          {saved && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="font-semibold">Ihre Einstellungen wurden gespeichert!</span>
            </div>
          )}

          {/* Introduction */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Was sind Cookies?</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie unsere Website besuchen. 
              Sie helfen uns, Ihre Präferenzen zu speichern und die Website-Leistung zu verbessern.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Gemäß der EU-Datenschutz-Grundverordnung (DSGVO) können Sie selbst entscheiden, welche Cookies Sie zulassen möchten.
            </p>
          </div>

          {/* Cookie Categories */}
          <div className="space-y-6">
            {/* Necessary Cookies */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Notwendige Cookies
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Beispiele:</strong> Sitzungs-ID, Login-Status, Spracheinstellungen</p>
                    <p><strong>Speicherdauer:</strong> Sitzung bis 1 Jahr</p>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-7 bg-gray-300 rounded-full relative cursor-not-allowed">
                    <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full shadow-md"></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">Immer aktiv</p>
                </div>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Funktionale Cookies
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Diese Cookies ermöglichen erweiterte Funktionen und Personalisierung wie Video-Wiedergabe und Live-Chat.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Beispiele:</strong> Video-Player-Einstellungen, Chat-Widget-Präferenzen</p>
                    <p><strong>Speicherdauer:</strong> 1 Monat bis 1 Jahr</p>
                  </div>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, functional: !prev.functional }))}
                    className={`w-12 h-7 rounded-full relative transition-colors ${
                      consent.functional ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      consent.functional ? 'right-1' : 'left-1'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Analyse-Cookies
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Diese Cookies helfen uns zu verstehen, wie Besucher mit der Website interagieren, indem Informationen anonym gesammelt werden.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Beispiele:</strong> Google Analytics, Besucherzähler, Heatmaps</p>
                    <p><strong>Speicherdauer:</strong> 2 Jahre</p>
                    <p><strong>Drittanbieter:</strong> Google LLC (USA)</p>
                  </div>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, analytics: !prev.analytics }))}
                    className={`w-12 h-7 rounded-full relative transition-colors ${
                      consent.analytics ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      consent.analytics ? 'right-1' : 'left-1'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Marketing-Cookies
                  </h3>
                  <p className="text-gray-600 mb-3">
                    Diese Cookies werden verwendet, um Besuchern auf Webseiten zu folgen und relevante Werbung anzuzeigen.
                  </p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Beispiele:</strong> Facebook Pixel, Google Ads, Retargeting</p>
                    <p><strong>Speicherdauer:</strong> 3 Monate bis 2 Jahre</p>
                    <p><strong>Drittanbieter:</strong> Meta Platforms, Google LLC</p>
                  </div>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, marketing: !prev.marketing }))}
                    className={`w-12 h-7 rounded-full relative transition-colors ${
                      consent.marketing ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      consent.marketing ? 'right-1' : 'left-1'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* DSGVO Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-3">🛡️ Ihre Rechte nach DSGVO</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Widerruf:</strong> Sie können Ihre Einwilligung jederzeit widerrufen</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Auskunft:</strong> Sie haben ein Recht auf Auskunft über gespeicherte Daten</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span><strong>Beschwerde:</strong> Sie können sich bei einer Aufsichtsbehörde beschweren</span>
              </li>
            </ul>
            <p className="text-sm text-gray-600 mt-4">
              Weitere Informationen finden Sie in unserer{' '}
              <Link href="/datenschutz" className="text-primary-600 hover:text-primary-700 font-semibold">
                Datenschutzerklärung
              </Link>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              onClick={acceptNecessaryOnly}
              className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg font-bold text-lg hover:bg-gray-50 transition-colors"
            >
              Nur notwendige Cookies
            </button>
            <button
              onClick={acceptAll}
              className="flex-1 px-8 py-4 bg-primary-600 text-white rounded-lg font-bold text-lg hover:bg-primary-700 transition-colors shadow-lg"
            >
              Alle Cookies akzeptieren
            </button>
          </div>
          
          <button
            onClick={savePreferences}
            className="w-full mt-4 px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            Ausgewählte Einstellungen speichern
          </button>
        </div>
      </main>
    </div>
  )
}
