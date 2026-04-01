'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'

type WidgetVariant = 'badge' | 'button' | 'card' | 'booking' | 'floating'

interface WidgetConfig {
  variant: WidgetVariant
  theme: 'light' | 'dark'
  position: 'right' | 'left'
  color: string
}

interface WorkshopData {
  id: string
  name: string
  logo: string | null
  verified: boolean
  city: string
  rating: number
  reviewCount: number
  services: { type: string; label: string; price: number; detail?: string }[]
  profileUrl: string
  bookingUrl: string
}

const VARIANTS: { id: WidgetVariant; label: string; description: string; icon: string }[] = [
  {
    id: 'badge',
    label: 'Bewertungs-Badge',
    description: 'Kompaktes Badge mit Bewertung und Verifizierung. Ideal für Header, Footer oder Sidebar.',
    icon: '⭐',
  },
  {
    id: 'button',
    label: 'Buchungs-Button',
    description: 'Auffälliger Call-to-Action Button. Verlinkt direkt zur Online-Buchung.',
    icon: '🔘',
  },
  {
    id: 'card',
    label: 'Service-Karte',
    description: 'Karte mit Services und Preisen. Zeigt alles Wichtige auf einen Blick.',
    icon: '🃏',
  },
  {
    id: 'booking',
    label: 'Buchungsformular',
    description: 'Eingebettetes Buchungsformular per iframe. Direkte Service-Auswahl möglich.',
    icon: '📋',
  },
  {
    id: 'floating',
    label: 'Floating-Widget',
    description: 'Schwebendes Popup unten rechts/links. Immer sichtbar, ohne Platz einzunehmen.',
    icon: '💬',
  },
]

export default function WidgetPage() {
  const { data: session } = useSession()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [config, setConfig] = useState<WidgetConfig>({
    variant: 'badge',
    theme: 'light',
    position: 'right',
    color: '#0070f3',
  })
  const [workshopData, setWorkshopData] = useState<WorkshopData | null>(null)
  const [workshopId, setWorkshopId] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkshopData()
  }, [])

  async function fetchWorkshopData() {
    try {
      // First get workshop ID
      const configRes = await fetch('/api/workshop/widget-config')
      const configData = await configRes.json()
      if (!configData.workshopId) return

      setWorkshopId(configData.workshopId)

      // Then fetch public widget data
      const widgetRes = await fetch(`/api/widget/${configData.workshopId}`)
      const widgetData = await widgetRes.json()
      if (!widgetData.error) {
        setWorkshopData(widgetData)
      }
    } catch (err) {
      console.error('Error loading workshop data:', err)
    } finally {
      setLoading(false)
    }
  }

  function getEmbedCode(): string {
    if (!workshopId) return ''

    if (config.variant === 'booking') {
      return `<!-- Bereifung24 Buchungsformular -->\n<iframe\n  src="https://bereifung24.de/widget/booking/${workshopId}?theme=${config.theme}&color=${encodeURIComponent(config.color)}"\n  style="width: 100%; max-width: 450px; height: 520px; border: 1px solid ${config.theme === 'dark' ? '#333' : '#e5e7eb'}; border-radius: 14px;"\n  frameborder="0"\n  allow="payment"\n  loading="lazy"\n  title="Online-Termin buchen">\n</iframe>`
    }

    const attrs = [
      `src="https://bereifung24.de/widget.js"`,
      `data-workshop="${workshopId}"`,
      `data-variant="${config.variant}"`,
      `data-theme="${config.theme}"`,
    ]

    if (config.variant === 'floating') {
      attrs.push(`data-position="${config.position}"`)
    }

    if (config.color !== '#0070f3') {
      attrs.push(`data-color="${config.color}"`)
    }

    return `<!-- Bereifung24 Widget -->\n<script\n  ${attrs.join('\n  ')}>\n</script>`
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(getEmbedCode())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">🔌 Website-Widget</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Widget auf Ihrer Website einbinden für Bewertungen und Online-Buchungen</p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Left: Configuration */}
        <div className="space-y-6">
          {/* Variant Selection */}
          <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Widget-Variante wählen
            </h2>
            <div className="space-y-3">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setConfig({ ...config, variant: v.id })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    config.variant === v.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : isDark
                        ? 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{v.icon}</span>
                    <div>
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {v.label}
                      </div>
                      <div className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {v.description}
                      </div>
                    </div>
                    {config.variant === v.id && (
                      <span className="ml-auto text-primary-500 font-bold">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Appearance Settings */}
          <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Erscheinungsbild
            </h2>
            
            <div className="space-y-4">
              {/* Theme */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Theme
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfig({ ...config, theme: 'light' })}
                    className={`flex-1 p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                      config.theme === 'light'
                        ? 'border-primary-500 bg-white text-gray-900'
                        : 'border-gray-300 bg-gray-100 text-gray-600'
                    }`}
                  >
                    ☀️ Hell
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, theme: 'dark' })}
                    className={`flex-1 p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                      config.theme === 'dark'
                        ? 'border-primary-500 bg-gray-800 text-white'
                        : 'border-gray-600 bg-gray-700 text-gray-300'
                    }`}
                  >
                    🌙 Dunkel
                  </button>
                </div>
              </div>

              {/* Color */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Akzentfarbe
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.color}
                    onChange={(e) => setConfig({ ...config, color: e.target.value })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm font-mono ${
                      isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                  <button
                    onClick={() => setConfig({ ...config, color: '#0070f3' })}
                    className="px-3 py-2 text-xs rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Position (only for floating) */}
              {config.variant === 'floating' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Position
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfig({ ...config, position: 'left' })}
                      className={`flex-1 p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                        config.position === 'left'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : isDark
                            ? 'border-gray-700 text-gray-400'
                            : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      ⬅️ Links unten
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, position: 'right' })}
                      className={`flex-1 p-3 rounded-lg border-2 text-center text-sm font-medium transition-all ${
                        config.position === 'right'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                          : isDark
                            ? 'border-gray-700 text-gray-400'
                            : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      Rechts unten ➡️
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Embed Code */}
          <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Einbettungscode
              </h2>
              <button
                onClick={copyToClipboard}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Kopiert!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    Code kopieren
                  </>
                )}
              </button>
            </div>
            <pre className={`p-4 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap break-all ${
              isDark ? 'bg-gray-900 text-green-400' : 'bg-gray-900 text-green-400'
            }`}>
              {getEmbedCode()}
            </pre>
            <p className={`text-xs mt-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Fügen Sie diesen Code in den HTML-Quellcode Ihrer Website ein, an der Stelle wo das Widget erscheinen soll.
              {config.variant === 'floating' && ' Das Floating-Widget erscheint automatisch unten ' + (config.position === 'left' ? 'links' : 'rechts') + '.'}
            </p>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-6">
          <div className={`rounded-xl border p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Vorschau
            </h2>
            <div
              className="rounded-xl border-2 border-dashed p-8 flex items-center justify-center min-h-[400px]"
              style={{
                background: config.theme === 'dark' ? '#0f0f1a' : '#f8f9fc',
                borderColor: config.theme === 'dark' ? '#333' : '#d1d5db',
              }}
            >
              {workshopData ? (
                <WidgetPreview config={config} data={workshopData} />
              ) : (
                <div className="text-center text-gray-400">
                  <p>Widget-Vorschau nicht verfügbar</p>
                  <p className="text-sm mt-1">Werkstatt-Daten konnten nicht geladen werden</p>
                </div>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className={`rounded-xl border p-6 ${isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              💡 Tipps zur Einbindung
            </h3>
            <ul className={`space-y-2 text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
              <li>• <strong>Badge</strong> — Am besten im Header oder Footer Ihrer Website</li>
              <li>• <strong>Button</strong> — Direkt neben Ihren Kontaktdaten oder im Header</li>
              <li>• <strong>Service-Karte</strong> — Auf Ihrer Startseite oder Service-Seite</li>
              <li>• <strong>Buchungsformular</strong> — Als eigener Bereich auf Ihrer Website</li>
              <li>• <strong>Floating-Widget</strong> — Wird automatisch auf allen Seiten angezeigt</li>
              <li className="pt-2 border-t border-blue-300/30">
                Die Daten (Bewertung, Services, Preise) werden <strong>automatisch aktualisiert</strong>.
              </li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

// ========================
// PREVIEW COMPONENT
// ========================
function WidgetPreview({ config, data }: { config: WidgetConfig; data: WorkshopData }) {
  const { variant, theme, color, position } = config
  const isDark = theme === 'dark'
  const bg = isDark ? '#1a1a2e' : '#ffffff'
  const text = isDark ? '#ffffff' : '#1a1a2e'
  const subtext = isDark ? '#a0aec0' : '#6b7280'
  const border = isDark ? '#333' : '#e5e7eb'
  const cardBg = isDark ? '#252540' : '#f9fafb'

  const stars = '⭐'.repeat(Math.floor(data.rating))

  const serviceIcons: Record<string, string> = {
    'TIRE_CHANGE': '🔄',
    'WHEEL_CHANGE': '🔁',
    'TIRE_REPAIR': '🔧',
    'MOTORCYCLE_TIRE': '🏍️',
    'ALIGNMENT': '📐',
    'ALIGNMENT_BOTH': '📐',
    'CLIMATE_SERVICE': '❄️',
    'BRAKE_SERVICE': '🛑',
    'BATTERY_SERVICE': '🔋',
    'OTHER_SERVICES': '⚙️',
  }

  const formatPrice = (price: number) => price > 0 ? price.toFixed(2).replace('.', ',') + ' €' : 'Auf Anfrage'

  const openProfile = () => window.open(data.profileUrl, '_blank')
  const openBooking = () => window.open(data.bookingUrl, '_blank')

  // Badge Preview
  if (variant === 'badge') {
    return (
      <div
        onClick={openProfile}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 12, padding: '10px 16px',
          background: bg, border: `1px solid ${border}`, borderRadius: 10,
          fontFamily: '-apple-system, sans-serif', cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{stars}</span>
            <span style={{ fontWeight: 700, fontSize: 15, color: text }}>{data.rating.toFixed(1)}/5</span>
          </div>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{data.reviewCount} Bewertungen</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, paddingLeft: 12, borderLeft: `1px solid ${border}` }}>
          {data.verified && <span style={{ fontSize: 10, color: '#10b981', fontWeight: 600 }}>✓ Verifiziert</span>}
          <img src="/logos/B24_Logo_blau.png" alt="Bereifung24" style={{ height: 20, width: 'auto' }} />
        </div>
      </div>
    )
  }

  // Button Preview
  if (variant === 'button') {
    return (
      <div onClick={openBooking} style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 24px',
        background: color, color: '#fff', borderRadius: 8,
        fontFamily: '-apple-system, sans-serif', fontSize: 15, fontWeight: 600,
        cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,112,243,0.3)',
      }}>
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Online-Termin buchen
      </div>
    )
  }

  // Card Preview
  if (variant === 'card') {
    return (
      <div style={{
        width: 320, padding: 20, background: bg, border: `1px solid ${border}`,
        borderRadius: 14, fontFamily: '-apple-system, sans-serif',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: text }}>{data.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 12 }}>{stars}</span>
              <span style={{ fontSize: 12, color: subtext }}>{data.rating.toFixed(1)} · {data.reviewCount} Bew.</span>
              {data.verified && <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, marginLeft: 4 }}>✓</span>}
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          {data.services.slice(0, 5).map((s, i) => (
            <div key={i} onClick={openBooking} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', background: cardBg, borderRadius: 6, marginBottom: 4, cursor: 'pointer',
            }}>
              <span style={{ fontSize: 13, color: text }}>
                {serviceIcons[s.type] || '🔧'} {s.label}
                {s.detail && <span style={{ fontSize: 11, color: subtext, fontWeight: 400 }}> ({s.detail})</span>}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: s.price > 0 ? color : subtext, whiteSpace: 'nowrap', marginLeft: 8 }}>{formatPrice(s.price)}</span>
            </div>
          ))}
        </div>
        <div onClick={openBooking} style={{
          textAlign: 'center', padding: 12, background: color, color: '#fff',
          borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          🔍 Jetzt online buchen
        </div>
        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <span style={{ fontSize: 11, color: subtext }}>Powered by Bereifung24</span>
        </div>
      </div>
    )
  }

  // Booking Preview
  if (variant === 'booking') {
    return (
      <div style={{
        width: 400, background: bg, border: `1px solid ${border}`, borderRadius: 14,
        fontFamily: '-apple-system, sans-serif', overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <div style={{ padding: '16px 20px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: text }}>{data.name}</div>
          <div style={{ fontSize: 12, color: subtext, marginTop: 4 }}>
            {data.city && <>{data.city} · </>}
            {stars} {data.rating.toFixed(1)}/5 · {data.reviewCount} Bewertungen
          </div>
        </div>
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
            Service wählen
          </div>
          {data.services.slice(0, 5).map((s, i) => (
            <div key={i} onClick={openBooking} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 14px', background: cardBg, border: `1px solid ${border}`,
              borderRadius: 10, marginBottom: 6, cursor: 'pointer',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: text }}>
                  {serviceIcons[s.type] || '🔧'} {s.label}
                  {s.detail && <span style={{ fontSize: 11, color: subtext, fontWeight: 400 }}> ({s.detail})</span>}
                </div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: s.price > 0 ? color : subtext, whiteSpace: 'nowrap', marginLeft: 8 }}>{formatPrice(s.price)}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div onClick={openBooking} style={{
            textAlign: 'center', padding: 14, background: color, color: '#fff',
            borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            🔍 Alle Services ansehen & buchen
          </div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: subtext }}>Powered by Bereifung24</span>
          </div>
        </div>
      </div>
    )
  }

  // Floating Preview
  if (variant === 'floating') {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <div style={{ position: 'relative', width: '100%', height: 350 }}>
        {/* Popup */}
        {isOpen && (
          <div style={{
            position: 'absolute', bottom: 68, [position]: 0, width: 280,
            background: bg, border: `1px solid ${border}`, borderRadius: 14,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontFamily: '-apple-system, sans-serif',
            overflow: 'hidden',
          }}>
            <div style={{ padding: 14, borderBottom: `1px solid ${border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{data.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 12 }}>{stars}</span>
                    <span style={{ fontSize: 11, color: subtext }}>{data.rating.toFixed(1)} · {data.reviewCount} Bew.</span>
                  </div>
                </div>
                <span onClick={() => setIsOpen(false)} style={{ cursor: 'pointer', fontSize: 18, color: subtext, padding: 4 }}>✕</span>
              </div>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: subtext, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
                Unsere Services
              </div>
              {data.services.slice(0, 3).map((s, i) => (
                <div key={i} onClick={openBooking} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '8px 10px',
                  background: cardBg, borderRadius: 6, marginBottom: 3, cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 12, color: text }}>
                    {serviceIcons[s.type] || '🔧'} {s.label}
                    {s.detail && <span style={{ fontSize: 10, color: subtext, fontWeight: 400 }}> ({s.detail})</span>}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: s.price > 0 ? color : subtext, whiteSpace: 'nowrap', marginLeft: 6 }}>{formatPrice(s.price)}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 14px', borderTop: `1px solid ${border}` }}>
              <div onClick={openBooking} style={{
                textAlign: 'center', padding: 11, background: color, color: '#fff',
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                Online-Termin buchen →
              </div>
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <span style={{ fontSize: 10, color: subtext }}>Powered by Bereifung24</span>
              </div>
            </div>
          </div>
        )}
        {/* Bubble */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute', bottom: 0, [position]: 0,
            width: 56, height: 56, background: color, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,112,243,0.4)',
            transition: 'transform 0.2s', transform: isOpen ? 'scale(0.9)' : 'scale(1)',
          }}
        >
          <svg width="24" height="24" fill="none" stroke="#fff" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    )
  }

  return null
}
