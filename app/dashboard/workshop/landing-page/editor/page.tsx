'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LandingPage {
  id: string
  slug: string
  isActive: boolean
  
  // SEO
  metaTitle: string | null
  metaDescription: string | null
  keywords: string | null
  
  // Hero
  heroHeadline: string | null
  heroSubline: string | null
  heroImage: string | null
  
  // About
  aboutTitle: string | null
  aboutText: string | null
  
  // Gallery
  galleryImages: string[]
  
  // Features
  showLogo: boolean
  showReviews: boolean
  showMap: boolean
  showOpeningHours: boolean
  showTeam: boolean
  showFaq: boolean
  showPartnerLogos: boolean
  
  // Design
  template: string
  primaryColor: string | null
  accentColor: string | null
  
  // Custom Data
  teamMembers: any
  customServices: any
  faqItems: any
  socialLinks: any
  partnerLogos: any
}

export default function LandingPageEditor() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [landingPage, setLandingPage] = useState<LandingPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'seo' | 'hero' | 'about' | 'features' | 'design'>('seo')
  
  // Form state
  const [formData, setFormData] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    heroHeadline: '',
    heroSubline: '',
    aboutTitle: '',
    aboutText: '',
    showLogo: true,
    showReviews: true,
    showMap: true,
    showOpeningHours: true,
    showTeam: false,
    showFaq: false,
    showPartnerLogos: false,
    template: 'modern',
    primaryColor: '#7C3AED',
    accentColor: '#EC4899'
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'WORKSHOP') {
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
        if (data.landingPage) {
          setLandingPage(data.landingPage)
          setFormData({
            metaTitle: data.landingPage.metaTitle || '',
            metaDescription: data.landingPage.metaDescription || '',
            keywords: data.landingPage.keywords || '',
            heroHeadline: data.landingPage.heroHeadline || '',
            heroSubline: data.landingPage.heroSubline || '',
            aboutTitle: data.landingPage.aboutTitle || '',
            aboutText: data.landingPage.aboutText || '',
            showLogo: data.landingPage.showLogo,
            showReviews: data.landingPage.showReviews,
            showMap: data.landingPage.showMap,
            showOpeningHours: data.landingPage.showOpeningHours,
            showTeam: data.landingPage.showTeam,
            showFaq: data.landingPage.showFaq,
            showPartnerLogos: data.landingPage.showPartnerLogos,
            template: data.landingPage.template,
            primaryColor: data.landingPage.primaryColor || '#7C3AED',
            accentColor: data.landingPage.accentColor || '#EC4899'
          })
        } else {
          router.push('/dashboard/workshop/landing-page')
        }
      } else {
        router.push('/dashboard/workshop/landing-page')
      }
    } catch (error) {
      console.error('Error fetching landing page:', error)
      router.push('/dashboard/workshop/landing-page')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/workshop/landing-page', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        const data = await res.json()
        setLandingPage(data.landingPage)
        alert('Änderungen erfolgreich gespeichert!')
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving:', error)
      alert('Fehler beim Speichern der Änderungen')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!landingPage) {
    return null
  }

  const tabs = [
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'hero', label: 'Hero-Bereich', icon: '🎯' },
    { id: 'about', label: 'Über Uns', icon: '📝' },
    { id: 'features', label: 'Features', icon: '⚙️' },
    { id: 'design', label: 'Design', icon: '🎨' }
  ] as const

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/workshop/landing-page" className="text-primary-600 hover:text-primary-700 mb-4 inline-block">
            ← Zurück zur Übersicht
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Landing Page bearbeiten</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">bereifung24.de/{landingPage.slug}</p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/${landingPage.slug}`}
                target="_blank"
                className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Vorschau
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-8 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          {/* SEO Tab */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">SEO-Einstellungen</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Diese Informationen helfen Suchmaschinen wie Google, Ihre Seite besser zu verstehen und anzuzeigen.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta-Titel <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                  placeholder="z.B. Autowerkstatt München - Reifenwechsel & KFZ-Service"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={60}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.metaTitle.length}/60 Zeichen - Wird in Google-Suchergebnissen angezeigt
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta-Beschreibung <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                  placeholder="z.B. Professioneller Reifenwechsel, KFZ-Service und Reparaturen in München. Faire Preise, schnelle Termine. Jetzt online Termin buchen!"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  maxLength={160}
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.metaDescription.length}/160 Zeichen - Beschreibung unter dem Titel in Google
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (mit Komma trennen)
                </label>
                <input
                  type="text"
                  value={formData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  placeholder="z.B. Reifenwechsel München, Autowerkstatt, KFZ-Service, Reifenmontage"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Wichtige Suchbegriffe, für die Sie gefunden werden möchten
                </p>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">💡 SEO-Tipps</h3>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                  <li>• Verwenden Sie Ihren Standort im Titel (z.B. "München", "Berlin")</li>
                  <li>• Beschreiben Sie konkrete Dienstleistungen</li>
                  <li>• Nutzen Sie natürliche Sprache, keine Keyword-Aneinanderreihung</li>
                  <li>• Aktualisieren Sie die Inhalte regelmäßig</li>
                </ul>
              </div>
            </div>
          )}

          {/* Hero Tab */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Hero-Bereich</h2>
                <p className="text-gray-600 mb-6">
                  Der erste Bereich, den Besucher sehen. Machen Sie einen starken ersten Eindruck!
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Haupt-Überschrift <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.heroHeadline}
                  onChange={(e) => handleInputChange('heroHeadline', e.target.value)}
                  placeholder="z.B. Willkommen bei Ihrer Werkstatt des Vertrauens"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unter-Überschrift
                </label>
                <textarea
                  value={formData.heroSubline}
                  onChange={(e) => handleInputChange('heroSubline', e.target.value)}
                  placeholder="z.B. Professioneller Reifenservice und KFZ-Reparaturen seit 1995. Faire Preise, schnelle Termine."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hero-Bild
                </label>
                <div className="mt-2 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Bild-Upload folgt in Kürze</p>
                </div>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Über Uns Bereich</h2>
                <p className="text-gray-600 mb-6">
                  Erzählen Sie Ihre Geschichte und was Sie besonders macht.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Abschnitts-Titel
                </label>
                <input
                  type="text"
                  value={formData.aboutTitle}
                  onChange={(e) => handleInputChange('aboutTitle', e.target.value)}
                  placeholder="z.B. Über unsere Werkstatt"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibungstext
                </label>
                <textarea
                  value={formData.aboutText}
                  onChange={(e) => handleInputChange('aboutText', e.target.value)}
                  placeholder="Erzählen Sie von Ihrer Werkstatt: Geschichte, Werte, Team, Expertise..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={8}
                />
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">✍️ Schreib-Tipps</h3>
                <ul className="text-sm text-green-800 dark:text-green-300 space-y-1">
                  <li>• Seien Sie authentisch und persönlich</li>
                  <li>• Erwähnen Sie Ihre Erfahrung (z.B. "Seit 1995")</li>
                  <li>• Heben Sie Ihre Spezialisierungen hervor</li>
                  <li>• Erzählen Sie, was Sie von anderen unterscheidet</li>
                </ul>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Sichtbare Bereiche</h2>
                <p className="text-gray-600 mb-6">
                  Wählen Sie aus, welche Bereiche auf Ihrer Landing Page angezeigt werden sollen.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { key: 'showLogo', label: 'Werkstatt-Logo', desc: 'Ihr Logo im Header anzeigen' },
                  { key: 'showReviews', label: 'Kundenbewertungen', desc: 'Bewertungen von Google anzeigen' },
                  { key: 'showMap', label: 'Standort-Karte', desc: 'Google Maps Karte einbinden' },
                  { key: 'showOpeningHours', label: 'Öffnungszeiten', desc: 'Ihre aktuellen Öffnungszeiten' },
                  { key: 'showTeam', label: 'Team-Bereich', desc: 'Stellen Sie Ihr Team vor' },
                  { key: 'showFaq', label: 'FAQ-Bereich', desc: 'Häufige Fragen & Antworten' },
                  { key: 'showPartnerLogos', label: 'Partner-Logos', desc: 'Logos Ihrer Partner (z.B. Reifenmarken)' }
                ].map(feature => (
                  <div key={feature.key} className="flex items-start p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData[feature.key as keyof typeof formData] as boolean}
                      onChange={(e) => handleInputChange(feature.key, e.target.checked)}
                      className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <div className="ml-3">
                      <label className="font-medium text-gray-900 dark:text-white cursor-pointer">
                        {feature.label}
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Design Tab */}
          {activeTab === 'design' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Design & Farben</h2>
                <p className="text-gray-600 mb-6">
                  Passen Sie das Aussehen Ihrer Landing Page an Ihre Marke an.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Template wählen
                </label>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { id: 'modern', name: 'Modern', desc: 'Klares, minimalistisches Design' },
                    { id: 'classic', name: 'Klassisch', desc: 'Zeitloses, professionelles Design' },
                    { id: 'minimal', name: 'Minimal', desc: 'Reduziert auf das Wesentliche' },
                    { id: 'professional', name: 'Professionell', desc: 'Business-orientiertes Design' }
                  ].map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleInputChange('template', template.id)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        formData.template === template.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">{template.name}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{template.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primärfarbe
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="#7C3AED"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Hauptfarbe für Buttons und Akzente</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Akzentfarbe
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => handleInputChange('accentColor', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="#EC4899"
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Zweite Farbe für Highlights</p>
                </div>
              </div>

              <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Farbvorschau</h3>
                <div className="flex gap-4">
                  <div 
                    className="h-20 w-full rounded-lg shadow-md"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <div 
                    className="h-20 w-full rounded-lg shadow-md"
                    style={{ backgroundColor: formData.accentColor }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floating Save Button */}
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full shadow-2xl hover:from-pink-600 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {saving ? 'Speichert...' : '💾 Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
