'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LandingPage {
  id: string
  slug: string
  isActive: boolean
  viewCount: number
  lastPublishedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  heroHeadline: string | null
  template: string
}

export default function LandingPageOverview() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [slug, setSlug] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [creating, setCreating] = useState(false)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }

    fetchLandingPage()
  }, [session, status, router])

  const fetchLandingPage = async () => {
    try {
      const res = await fetch('/api/workshop/landing-page')
      if (res.ok) {
        const data = await res.json()
        setLandingPage(data.landingPage)
      }
    } catch (error) {
      console.error('Error fetching landing page:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkSlugAvailability = async (slugValue: string) => {
    if (!slugValue || !/^[a-z0-9-]+$/.test(slugValue)) {
      setSlugAvailable(null)
      return
    }

    try {
      const res = await fetch(`/api/workshop/landing-page/check-slug?slug=${slugValue}`)
      const data = await res.json()
      setSlugAvailable(data.available)
    } catch (error) {
      console.error('Error checking slug:', error)
    }
  }

  const handleSlugChange = (value: string) => {
    const normalized = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSlug(normalized)
    checkSlugAvailability(normalized)
  }

  const createLandingPage = async () => {
    if (!slug || !slugAvailable) return

    setCreating(true)
    try {
      const res = await fetch('/api/workshop/landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      })

      if (res.ok) {
        const data = await res.json()
        setLandingPage(data.landingPage)
        setShowCreateModal(false)
        setSlug('')
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Erstellen')
      }
    } catch (error) {
      console.error('Error creating landing page:', error)
      alert('Fehler beim Erstellen der Landing Page')
    } finally {
      setCreating(false)
    }
  }

  const toggleStatus = async () => {
    if (!landingPage) return

    setToggling(true)
    try {
      const res = await fetch('/api/workshop/landing-page/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !landingPage.isActive })
      })

      if (res.ok) {
        const data = await res.json()
        setLandingPage(data.landingPage)
      }
    } catch (error) {
      console.error('Error toggling status:', error)
    } finally {
      setToggling(false)
    }
  }

  const copyUrl = () => {
    if (!landingPage) return
    const url = `${window.location.origin}/${landingPage.slug}`
    navigator.clipboard.writeText(url)
    alert('URL in Zwischenablage kopiert!')
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/workshop" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Zurück zum Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Landing Page</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Erstellen Sie Ihre eigene Webseite für bessere Sichtbarkeit in Suchmaschinen
          </p>
        </div>

        {!landingPage ? (
          /* No Landing Page Yet */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Erstellen Sie Ihre Landing Page
              </h2>
              
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                Mit einer eigenen Landing Page erhöhen Sie Ihre Sichtbarkeit in Suchmaschinen wie Google. 
                Kunden finden Sie leichter und können direkt Anfragen über Ihre Seite stellen.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">SEO-Optimiert</h3>
                  <p className="text-sm text-gray-600">Besser bei Google gefunden werden</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Individuell</h3>
                  <p className="text-sm text-gray-600">Frei gestaltbar nach Ihren Wünschen</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Direkt-Anfragen</h3>
                  <p className="text-sm text-gray-600">Kunden können sofort anfragen</p>
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 font-semibold"
              >
                Jetzt Landing Page erstellen
              </button>
            </div>
          </div>
        ) : (
          /* Landing Page Exists */
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Status</h2>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      landingPage.isActive 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {landingPage.isActive ? '✓ Aktiv' : '○ Inaktiv'}
                    </span>
                    {landingPage.lastPublishedAt && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Seit {new Date(landingPage.lastPublishedAt).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={toggleStatus}
                  disabled={toggling}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    landingPage.isActive
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } ${toggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {toggling ? 'Lädt...' : (landingPage.isActive ? 'Deaktivieren' : 'Aktivieren')}
                </button>
              </div>
            </div>

            {/* URL Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Ihre Landing Page URL</h2>
              {!landingPage.isActive && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start space-x-2">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    <strong>Hinweis:</strong> Die Landing Page muss aktiviert werden, damit sie öffentlich unter dieser URL erreichbar ist.
                  </p>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
                  <code className="text-sm text-gray-700 whitespace-nowrap">
                    {typeof window !== 'undefined' && `${window.location.origin}/${landingPage.slug}`}
                  </code>
                </div>
                <button
                  onClick={copyUrl}
                  className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  title="URL kopieren"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <a
                  href={`/${landingPage.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  title="Seite öffnen"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Statistiken</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seitenaufrufe</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-2">{landingPage.viewCount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Template</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2 capitalize">{landingPage.template}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">SEO Score</p>
                  <div className="flex items-center mt-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: landingPage.metaTitle && landingPage.metaDescription ? '85%' : '40%' }}
                      />
                    </div>
                    <span className="ml-3 text-sm font-medium text-gray-700">
                      {landingPage.metaTitle && landingPage.metaDescription ? '85%' : '40%'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid md:grid-cols-2 gap-6">
              <Link
                href="/dashboard/workshop/landing-page/editor"
                className="block p-6 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 text-center"
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="font-bold text-lg">Inhalte bearbeiten</h3>
                <p className="text-sm opacity-90 mt-1">Texte, Bilder und Design anpassen</p>
              </Link>

              <Link
                href={`/${landingPage.slug}`}
                target="_blank"
                className="block p-6 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-center"
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <h3 className="font-bold text-lg">Vorschau ansehen</h3>
                <p className="text-sm mt-1">Seite in neuem Tab öffnen</p>
              </Link>
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Landing Page erstellen</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL-Slug (nur Kleinbuchstaben, Zahlen, Bindestriche)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <span className="inline-flex items-center px-3 py-2 rounded-lg sm:rounded-r-none border border-gray-300 bg-gray-50 text-gray-500 text-sm whitespace-nowrap">
                    bereifung24.de/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="meine-werkstatt"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg sm:rounded-l-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                {slug && slugAvailable !== null && (
                  <p className={`mt-2 text-sm ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {slugAvailable ? '✓ Slug verfügbar' : '✗ Slug bereits vergeben'}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Beispiel: autoservice-mueller-berlin
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setSlug('')
                    setSlugAvailable(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={createLandingPage}
                  disabled={!slug || !slugAvailable || creating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Erstelle...' : 'Erstellen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
