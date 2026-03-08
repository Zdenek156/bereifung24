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

  const seoScore = landingPage?.metaTitle && landingPage?.metaDescription ? 85 : 40
  const seoColor = seoScore >= 80 ? 'text-green-600' : seoScore >= 50 ? 'text-yellow-600' : 'text-red-600'
  const seoBarColor = seoScore >= 80 ? 'bg-green-500' : seoScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'

  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    copyUrl()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-500">Lade Landing Page...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Landing Page</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ihre eigene Webseite für bessere Sichtbarkeit</p>
            </div>
            {landingPage && (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/workshop/landing-page/editor"
                  className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1.5"
                >
                  ✏️ Bearbeiten
                </Link>
                <a
                  href={`/${landingPage.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex items-center gap-1.5"
                >
                  👁️ Vorschau
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-4">

      {!landingPage ? (
        /* ── No Landing Page Yet ── */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center max-w-md mx-auto">
            <div className="text-4xl mb-3">🌐</div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1">Landing Page erstellen</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Mehr Sichtbarkeit bei Google. Kunden finden Sie leichter und buchen direkt.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">🔍 SEO</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Besser bei Google</p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">🎨 Individuell</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Frei gestaltbar</p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">⚡ Direkt</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sofort buchbar</p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              + Jetzt erstellen
            </button>
          </div>
        </div>
      ) : (
        /* ── Landing Page Exists ── */
        <>
          {/* Status + URL + Stats Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Top Row: Status + Toggle */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  landingPage.isActive 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                  {landingPage.isActive ? '● Aktiv' : '○ Inaktiv'}
                </span>
                {landingPage.lastPublishedAt && (
                  <span className="text-xs text-gray-400">
                    Seit {new Date(landingPage.lastPublishedAt).toLocaleDateString('de-DE')}
                  </span>
                )}
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400 capitalize">Template: {landingPage.template}</span>
              </div>
              <button
                onClick={toggleStatus}
                disabled={toggling}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  landingPage.isActive
                    ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                } ${toggling ? 'opacity-50' : ''}`}
              >
                {toggling ? '...' : (landingPage.isActive ? 'Deaktivieren' : 'Aktivieren')}
              </button>
            </div>

            {/* URL Row */}
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm text-gray-400">🔗</span>
              <code className="flex-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                {typeof window !== 'undefined' && `${window.location.origin}/${landingPage.slug}`}
              </code>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
              >
                {copied ? '✓ Kopiert' : '📋 Kopieren'}
              </button>
              <a
                href={`/${landingPage.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
              >
                ↗ Öffnen
              </a>
            </div>

            {/* Inactive Warning */}
            {!landingPage.isActive && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800/30 flex items-center gap-2">
                <span className="text-xs">⚠️</span>
                <p className="text-xs text-amber-700 dark:text-amber-400">Seite ist nicht öffentlich. Aktivieren Sie sie, um sie erreichbar zu machen.</p>
              </div>
            )}

            {/* Stats Row */}
            <div className="px-4 py-3 flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm">👁️</span>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{landingPage.viewCount}</span>
                  <span className="text-xs text-gray-400 ml-1">Aufrufe</span>
                </div>
              </div>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className="text-sm">📐</span>
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">{landingPage.template}</span>
                  <span className="text-xs text-gray-400 ml-1">Template</span>
                </div>
              </div>
              <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
              <div className="flex items-center gap-2">
                <span className="text-sm">📊</span>
                <div>
                  <span className={`text-sm font-bold ${seoColor}`}>{seoScore}%</span>
                  <div className="inline-flex ml-1.5 w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden align-middle">
                    <div className={`h-full rounded-full ${seoBarColor}`} style={{ width: `${seoScore}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 ml-1">SEO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
              💡 Mehr Umsatz durch Ihren persönlichen Link
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-3">
              Kunden sehen <strong>nur Ihr Angebot</strong> — keine Konkurrenz, keine Vergleichssuche. Buchung läuft vollautomatisch.
            </p>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2 bg-white/70 dark:bg-emerald-900/30 rounded-md p-2">
                <span className="text-sm">✅</span>
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight">Keine Angebote</p>
                  <p className="text-[11px] text-gray-500 leading-tight">Preise automatisch</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-emerald-900/30 rounded-md p-2">
                <span className="text-sm">📅</span>
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight">Kein Telefonieren</p>
                  <p className="text-[11px] text-gray-500 leading-tight">Kunden buchen selbst</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/70 dark:bg-emerald-900/30 rounded-md p-2">
                <span className="text-sm">📦</span>
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight">Auto-Bestellung</p>
                  <p className="text-[11px] text-gray-500 leading-tight">Reifen automatisch</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
              → Teilen auf WhatsApp, per E-Mail oder auf Ihrer Website
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/dashboard/workshop/landing-page/editor"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">✏️</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">Inhalte bearbeiten</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Texte, Bilder & Design</p>
              </div>
            </Link>
            <a
              href={`/${landingPage.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👁️</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">Vorschau ansehen</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">In neuem Tab öffnen</p>
              </div>
            </a>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-5 shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Landing Page erstellen</h3>
              <button onClick={() => { setShowCreateModal(false); setSlug(''); setSlugAvailable(null) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">URL-Slug</label>
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 text-xs">
                  bereifung24.de/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="meine-werkstatt"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-r-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              {slug && slugAvailable !== null && (
                <p className={`mt-1 text-xs ${slugAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {slugAvailable ? '✓ Verfügbar' : '✗ Bereits vergeben'}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">Nur Kleinbuchstaben, Zahlen, Bindestriche</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setShowCreateModal(false); setSlug(''); setSlugAvailable(null) }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={createLandingPage}
                disabled={!slug || !slugAvailable || creating}
                className="flex-1 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {creating ? 'Erstelle...' : '+ Erstellen'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
