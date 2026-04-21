'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Mail,
  Sparkles,
  Search,
  Send,
  Eye,
  MousePointerClick,
  Loader2,
  CheckCircle2,
  AlertCircle,
  History,
  Star,
  TrendingUp,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface Workshop {
  id: string
  companyName: string
  customerNumber: string
  logoUrl: string | null
  email: string
  contactName: string
  city: string | null
  status: string | null
  isVerified: boolean
  createdAt: string
  offersCount: number
  reviewsCount: number
  avgRating: number | null
  revenue: number
  recommendationsSent: number
}

interface HistoryItem {
  id: string
  workshopId: string
  workshopName: string
  workshopLogo: string | null
  sentByName: string
  subject: string
  recipientEmail: string
  tone: string
  status: string
  sentAt: string | null
  openedAt: string | null
  openCount: number
  clickedCtaAt: string | null
  clickCount: number
  createdAt: string
}

// ─────────────────────────────────────────────────────────
// Quick Tags (müssen zur Backend-Mapping passen)
// ─────────────────────────────────────────────────────────
const QUICK_TAGS: { key: string; label: string }[] = [
  { key: 'profile_picture', label: 'Profilbild fehlt' },
  { key: 'opening_hours', label: 'Öffnungszeiten unvollständig' },
  { key: 'slow_response', label: 'Langsame Reaktion' },
  { key: 'few_tires', label: 'Wenige Reifen im Katalog' },
  { key: 'low_ratings', label: 'Wenige/niedrige Bewertungen' },
  { key: 'no_direct_booking', label: 'Keine Direktbuchung' },
  { key: 'high_prices', label: 'Preise zu hoch' },
  { key: 'no_stripe', label: 'Stripe nicht aktiv' },
  { key: 'no_landing_page', label: 'Keine Landingpage' },
  { key: 'missing_services', label: 'Zu wenige Services' },
]

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────
export default function WorkshopRecommendationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])

  // Composer state
  const [query, setQuery] = useState('')
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [topics, setTopics] = useState<string[]>([])
  const [tone, setTone] = useState<'FRIENDLY' | 'PROFESSIONAL' | 'MOTIVATING'>('FRIENDLY')
  const [language, setLanguage] = useState<'de' | 'en'>('de')

  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Auth Guard ──
  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      router.push('/login')
    }
  }, [session, status, router])

  // ── Load Data ──
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/workshop-recommendations?include=all')
      const data = await res.json()
      setWorkshops(data.workshops || [])
      setHistory(data.history || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // ── Filtered Workshops ──
  const filteredWorkshops = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return workshops.slice(0, 50)
    return workshops.filter(
      w =>
        w.companyName.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q) ||
        (w.city || '').toLowerCase().includes(q) ||
        w.customerNumber.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [query, workshops])

  const toggleTopic = (key: string) => {
    setTopics(prev => (prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]))
  }

  // ── Generate ──
  const handleGenerate = async () => {
    if (!selectedWorkshop || !adminNotes.trim()) {
      setFeedback({ type: 'error', text: 'Bitte Werkstatt wählen und Notizen eingeben.' })
      return
    }
    setGenerating(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/workshop-recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: selectedWorkshop.id,
          adminNotes,
          topics,
          tone,
          language,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      setSubject(data.subject)
      setBody(data.body)
      setFeedback({ type: 'success', text: '✨ Email generiert – du kannst sie jetzt anpassen und senden.' })
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Generierung fehlgeschlagen' })
    } finally {
      setGenerating(false)
    }
  }

  // ── Send ──
  const handleSend = async () => {
    if (!selectedWorkshop || !subject.trim() || !body.trim()) {
      setFeedback({ type: 'error', text: 'Betreff und Text sind Pflicht.' })
      return
    }
    if (!confirm(`Email jetzt an ${selectedWorkshop.email} senden?`)) return

    setSending(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/admin/workshop-recommendations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workshopId: selectedWorkshop.id,
          subject,
          body,
          adminNotes,
          topics,
          tone,
          language,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.details || 'Fehler')
      setFeedback({ type: 'success', text: `✅ Email an ${selectedWorkshop.companyName} gesendet.` })
      setAdminNotes('')
      setTopics([])
      setSubject('')
      setBody('')
      setSelectedWorkshop(null)
      await loadData()
    } catch (e: any) {
      setFeedback({ type: 'error', text: e.message || 'Versand fehlgeschlagen' })
    } finally {
      setSending(false)
    }
  }

  // ── Render ──
  if (status === 'loading' || loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        Lädt...
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mt-2">
            <Mail className="w-8 h-8 text-sky-600" />
            Werkstatt-Empfehlungen
          </h1>
          <p className="text-gray-600 mt-1">
            KI-generierte Optimierungs-Emails an Partner-Werkstätten mit Open- & Click-Tracking.
          </p>
        </div>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Neue Empfehlung
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            Historie ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* ───────── COMPOSE ───────── */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Linke Spalte: Werkstatt-Auswahl + Eingaben */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Werkstatt wählen */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">1. Werkstatt auswählen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="Name, Email, Stadt oder Kundennummer…"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
                    {filteredWorkshops.length === 0 && (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        Keine Werkstätten gefunden.
                      </div>
                    )}
                    {filteredWorkshops.map(w => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWorkshop(w)}
                        className={`w-full text-left p-3 flex items-center gap-3 hover:bg-gray-50 transition ${
                          selectedWorkshop?.id === w.id ? 'bg-sky-50' : ''
                        }`}
                      >
                        {w.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={w.logoUrl}
                            alt=""
                            className="w-10 h-10 rounded object-cover border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-semibold border">
                            {w.companyName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{w.companyName}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {w.email} {w.city ? `· ${w.city}` : ''}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {w.isVerified && (
                            <Badge variant="secondary" className="text-xs">
                              Verifiziert
                            </Badge>
                          )}
                          {w.recommendationsSent > 0 && (
                            <span className="text-[10px] text-gray-400">
                              {w.recommendationsSent}× versendet
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Step 2: Notizen + Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2. Deine Analyse</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Was sollte die Werkstatt verbessern? (Stichpunkte reichen)</Label>
                    <Textarea
                      rows={5}
                      className="mt-1"
                      placeholder="z.B.&#10;- Profilbild fehlt komplett&#10;- Reagiert oft erst nach 2 Tagen auf Anfragen&#10;- Nur 3 Reifen im Katalog&#10;- Sollte Direktbuchung aktivieren"
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Quick-Tags (optional)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {QUICK_TAGS.map(t => (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => toggleTopic(t.key)}
                          className={`text-xs px-3 py-1.5 rounded-full border transition ${
                            topics.includes(t.key)
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-sky-400'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tonalität</Label>
                      <Select value={tone} onValueChange={(v: any) => setTone(v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FRIENDLY">🤝 Freundlich (du)</SelectItem>
                          <SelectItem value="PROFESSIONAL">💼 Sachlich (Sie)</SelectItem>
                          <SelectItem value="MOTIVATING">🚀 Motivierend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Sprache</Label>
                      <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!selectedWorkshop || !adminNotes.trim() || generating}
                    className="w-full bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        KI generiert…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Email generieren
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Step 3: Vorschau + Senden */}
              {(subject || body) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">3. Vorschau & Feinschliff</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Betreff</Label>
                      <Input
                        className="mt-1"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Email-Text</Label>
                      <Textarea
                        rows={12}
                        className="mt-1 font-mono text-sm"
                        value={body}
                        onChange={e => setBody(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Absätze durch Leerzeile trennen. Signatur wird automatisch angefügt.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleGenerate}
                        variant="outline"
                        disabled={generating}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Neu generieren
                      </Button>
                      <Button
                        onClick={handleSend}
                        disabled={sending || !selectedWorkshop}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sende…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Jetzt an {selectedWorkshop?.email} senden
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {feedback && (
                <div
                  className={`p-4 rounded-lg flex items-start gap-2 text-sm ${
                    feedback.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  )}
                  <div>{feedback.text}</div>
                </div>
              )}
            </div>

            {/* Rechte Spalte: Workshop-Dashboard */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">Performance-Überblick</CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedWorkshop ? (
                    <div className="text-sm text-gray-500 text-center py-8">
                      Wähle eine Werkstatt aus, um Kennzahlen zu sehen.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        {selectedWorkshop.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={selectedWorkshop.logoUrl}
                            alt=""
                            className="w-14 h-14 rounded object-cover border"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded bg-gray-100 flex items-center justify-center border text-gray-400">
                            {selectedWorkshop.companyName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-semibold truncate">
                            {selectedWorkshop.companyName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {selectedWorkshop.contactName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {selectedWorkshop.email}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Stat
                          icon={<TrendingUp className="w-4 h-4 text-sky-600" />}
                          label="Angebote"
                          value={selectedWorkshop.offersCount}
                        />
                        <Stat
                          icon={<Mail className="w-4 h-4 text-purple-600" />}
                          label="Umsatz"
                          value={`${selectedWorkshop.revenue.toFixed(0)} €`}
                        />
                        <Stat
                          icon={<Star className="w-4 h-4 text-amber-500" />}
                          label="Bewertung"
                          value={
                            selectedWorkshop.avgRating
                              ? `${selectedWorkshop.avgRating} (${selectedWorkshop.reviewsCount})`
                              : '—'
                          }
                        />
                        <Stat
                          icon={<History className="w-4 h-4 text-gray-500" />}
                          label="Empfehlungen"
                          value={selectedWorkshop.recommendationsSent}
                        />
                      </div>

                      <div className="text-xs text-gray-500 pt-3 border-t">
                        Status:{' '}
                        <span className="font-medium text-gray-700">
                          {selectedWorkshop.status || '—'}
                        </span>
                        {' · '}
                        {selectedWorkshop.isVerified ? 'Verifiziert' : 'Nicht verifiziert'}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ───────── HISTORY ───────── */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Versendete Empfehlungen</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-12">
                  Noch keine Empfehlungen versendet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b text-xs uppercase text-gray-500">
                        <th className="py-2 pr-4">Werkstatt</th>
                        <th className="py-2 pr-4">Betreff</th>
                        <th className="py-2 pr-4">Gesendet von</th>
                        <th className="py-2 pr-4">Versand</th>
                        <th className="py-2 pr-4">Opens</th>
                        <th className="py-2 pr-4">Clicks</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(h => (
                        <tr key={h.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              {h.workshopLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={h.workshopLogo}
                                  alt=""
                                  className="w-7 h-7 rounded object-cover border"
                                />
                              ) : (
                                <div className="w-7 h-7 rounded bg-gray-100 border" />
                              )}
                              <div>
                                <div className="font-medium">{h.workshopName}</div>
                                <div className="text-xs text-gray-500">{h.recipientEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 max-w-xs truncate" title={h.subject}>
                            {h.subject}
                          </td>
                          <td className="py-3 pr-4 text-xs">{h.sentByName}</td>
                          <td className="py-3 pr-4 text-xs text-gray-600">
                            {h.sentAt
                              ? new Date(h.sentAt).toLocaleString('de-DE', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-gray-400" />
                              {h.openCount}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-1">
                              <MousePointerClick className="w-3.5 h-3.5 text-gray-400" />
                              {h.clickCount}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge
                              variant={
                                h.status === 'SENT'
                                  ? 'default'
                                  : h.status === 'FAILED'
                                    ? 'destructive'
                                    : 'secondary'
                              }
                            >
                              {h.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 border">
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  )
}
