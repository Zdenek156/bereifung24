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
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    heroHeadline: '',
    heroSubline: '',
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

  const handleHeroImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Bitte nur Bilddateien hochladen')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Bild zu groß (max. 5MB)')
      return
    }

    setUploadingHeroImage(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/workshop/landing-page/upload-hero', {
        method: 'POST',
        body: formData
      })

      if (res.ok) {
        const data = await res.json()
        // Update landing page state with new image
        setLandingPage(prev => prev ? { ...prev, heroImage: data.imageUrl } : null)
        alert('Bild erfolgreich hochgeladen!')
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Hochladen')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Fehler beim Hochladen des Bildes')
    } finally {
      setUploadingHeroImage(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleHeroImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-500">Lade Editor...</p>
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/workshop/landing-page"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            ←
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Landing Page bearbeiten</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">bereifung24.de/{landingPage.slug}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${landingPage.slug}`}
            target="_blank"
            className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            Vorschau
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Speichert...' : '💾 Speichern'}
          </button>
        </div>
      </div>

      {/* Tab Pills */}
      <div className="flex flex-wrap gap-1.5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">SEO-Einstellungen</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Hilft Suchmaschinen wie Google, Ihre Seite besser zu verstehen.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta-Titel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                placeholder="z.B. Autowerkstatt München - Reifenwechsel & KFZ-Service"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                maxLength={60}
              />
              <p className="mt-0.5 text-[11px] text-gray-400">
                {formData.metaTitle.length}/60 Zeichen – Wird in Google-Suchergebnissen angezeigt
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meta-Beschreibung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                placeholder="z.B. Professioneller Reifenwechsel, KFZ-Service und Reparaturen. Jetzt online Termin buchen!"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
                maxLength={160}
              />
              <p className="mt-0.5 text-[11px] text-gray-400">
                {formData.metaDescription.length}/160 Zeichen – Beschreibung unter dem Titel in Google
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Keywords (mit Komma trennen)
              </label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => handleInputChange('keywords', e.target.value)}
                placeholder="z.B. Reifenwechsel München, Autowerkstatt, KFZ-Service, Reifenmontage"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-0.5 text-[11px] text-gray-400">
                Wichtige Suchbegriffe, für die Sie gefunden werden möchten
              </p>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1.5">💡 SEO-Tipps</h3>
              <ul className="text-[11px] text-blue-800 dark:text-blue-300 space-y-0.5">
                <li>• Standort im Titel verwenden (z.B. „München", „Berlin")</li>
                <li>• Konkrete Dienstleistungen beschreiben</li>
                <li>• Natürliche Sprache nutzen, keine Keyword-Aneinanderreihung</li>
                <li>• Inhalte regelmäßig aktualisieren</li>
              </ul>
            </div>
          </div>
        )}

        {/* Hero Tab */}
        {activeTab === 'hero' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Hero-Bereich</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Der erste Bereich, den Besucher sehen. Starker erster Eindruck!
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Haupt-Überschrift <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.heroHeadline}
                onChange={(e) => handleInputChange('heroHeadline', e.target.value)}
                placeholder="z.B. Willkommen bei Ihrer Werkstatt des Vertrauens"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Unter-Überschrift
              </label>
              <textarea
                value={formData.heroSubline}
                onChange={(e) => handleInputChange('heroSubline', e.target.value)}
                placeholder="z.B. Professioneller Reifenservice und KFZ-Reparaturen seit 1995. Faire Preise, schnelle Termine."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hero-Bild
              </label>
              
              {landingPage?.heroImage ? (
                <div className="relative group w-1/2">
                  <img 
                    src={landingPage.heroImage} 
                    alt="Hero" 
                    className="w-full aspect-[21/9] object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-100">
                      Bild ersetzen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleHeroImageUpload(e.target.files[0])
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
                    dragActive 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {uploadingHeroImage ? (
                    <div className="flex flex-col items-center py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                      <p className="mt-2 text-xs text-gray-500">Bild wird hochgeladen...</p>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="mt-2">
                        <label className="cursor-pointer">
                          <span className="text-xs text-primary-600 hover:text-primary-500 font-medium">
                            Bild hochladen
                          </span>
                          <span className="text-xs text-gray-500"> oder per Drag & Drop</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleHeroImageUpload(e.target.files[0])
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400">PNG, JPG, WebP bis zu 5MB</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* About Tab */}
        {activeTab === 'about' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Über Uns</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Erzählen Sie Ihre Geschichte und was Sie besonders macht.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Beschreibungstext
              </label>
              <textarea
                value={formData.aboutText}
                onChange={(e) => handleInputChange('aboutText', e.target.value)}
                placeholder="Erzählen Sie von Ihrer Werkstatt: Geschichte, Werte, Team, Expertise..."
                className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                rows={6}
              />
            </div>

            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="text-xs font-semibold text-green-900 dark:text-green-200 mb-1.5">✍️ Schreib-Tipps</h3>
              <ul className="text-[11px] text-green-800 dark:text-green-300 space-y-0.5">
                <li>• Authentisch und persönlich schreiben</li>
                <li>• Erfahrung erwähnen (z.B. „Seit 1995")</li>
                <li>• Spezialisierungen hervorheben</li>
                <li>• Was unterscheidet Sie von anderen?</li>
              </ul>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Sichtbare Bereiche</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Wählen Sie, welche Bereiche auf Ihrer Landing Page angezeigt werden.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'showLogo', label: 'Werkstatt-Logo', desc: 'Logo im Header' },
                { key: 'showReviews', label: 'Kundenbewertungen', desc: 'Google-Bewertungen anzeigen' },
                { key: 'showMap', label: 'Standort-Karte', desc: 'Google Maps einbinden' },
                { key: 'showOpeningHours', label: 'Öffnungszeiten', desc: 'Aktuelle Öffnungszeiten' }
              ].map(feature => (
                <label
                  key={feature.key}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    formData[feature.key as keyof typeof formData]
                      ? 'border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData[feature.key as keyof typeof formData] as boolean}
                    onChange={(e) => handleInputChange(feature.key, e.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div>
                    <div className="text-xs font-medium text-gray-900 dark:text-white">{feature.label}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{feature.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Design Tab */}
        {activeTab === 'design' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Design & Farben</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Passen Sie das Aussehen Ihrer Landing Page an Ihre Marke an.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Template wählen
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'modern', name: 'Modern', desc: 'Klares, minimalistisches Design' },
                  { id: 'classic', name: 'Klassisch', desc: 'Zeitloses, professionelles Design' },
                  { id: 'minimal', name: 'Minimal', desc: 'Reduziert auf das Wesentliche' },
                  { id: 'professional', name: 'Professionell', desc: 'Business-orientiertes Design' }
                ].map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleInputChange('template', template.id)}
                    className={`p-2.5 border-2 rounded-lg text-left transition-all ${
                      formData.template === template.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-900 dark:text-white">{template.name}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{template.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primärfarbe
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="h-8 w-12 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500"
                    placeholder="#7C3AED"
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-gray-400">Hauptfarbe für Buttons und Akzente</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Akzentfarbe
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    className="h-8 w-12 rounded border border-gray-200 dark:border-gray-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.accentColor}
                    onChange={(e) => handleInputChange('accentColor', e.target.value)}
                    className="flex-1 px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:ring-1 focus:ring-primary-500"
                    placeholder="#EC4899"
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-gray-400">Zweite Farbe für Highlights</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Farbvorschau</h3>
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="h-10 w-full rounded-lg shadow-sm"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <span className="text-[10px] text-gray-400">Primär</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="h-10 w-full rounded-lg shadow-sm"
                    style={{ backgroundColor: formData.accentColor }}
                  />
                  <span className="text-[10px] text-gray-400">Akzent</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all text-xs font-semibold disabled:opacity-50"
        >
          {saving ? 'Speichert...' : '💾 Speichern'}
        </button>
      </div>
    </div>
  )
}
