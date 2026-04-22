'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Sparkles, Send, Loader2, Mail, MailOpen, MousePointerClick,
  Reply, AlertCircle, Bot, Globe, RefreshCw, ChevronDown, ChevronRight,
} from 'lucide-react'

interface OutreachEmail {
  id: string
  direction: 'OUTBOUND' | 'INBOUND'
  templateType: string
  status: string
  subject: string
  body: string
  fromEmail: string
  toEmail: string
  threadId?: string | null
  sentAt?: string | null
  openedAt?: string | null
  openCount: number
  clickedAt?: string | null
  clickCount: number
  repliedAt?: string | null
  errorMessage?: string | null
  aiGenerated: boolean
  sentByName?: string | null
  createdAt: string
}

interface Insights {
  summary?: string
  services?: string[]
  brands?: string[]
  targetGroups?: string[]
  uniqueSellingPoints?: string[]
  weaknesses?: string[]
  fitForBereifung24?: number
  fitReasoning?: string
  recommendedAngle?: string
}

type TemplateType = 'FIRST_CONTACT' | 'FOLLOWUP' | 'BREAKUP' | 'CUSTOM'

interface Props {
  placeId: string
  prospectName: string
  prospectEmail?: string | null
  prospectWebsite?: string | null
  onEmailSaved?: () => void
}

const TEMPLATE_LABELS: Record<TemplateType, string> = {
  FIRST_CONTACT: 'Erstkontakt',
  FOLLOWUP: 'Follow-up',
  BREAKUP: 'Letzter Versuch',
  CUSTOM: 'Frei',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SCHEDULED: 'bg-blue-100 text-blue-700',
    SENT: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    RECEIVED: 'bg-purple-100 text-purple-700',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  )
}

export default function ProspectOutreachTab({
  placeId,
  prospectName,
  prospectEmail,
  prospectWebsite,
  onEmailSaved,
}: Props) {
  const [emails, setEmails] = useState<OutreachEmail[]>([])
  const [insights, setInsights] = useState<Insights | null>(null)
  const [websiteAnalyzedAt, setWebsiteAnalyzedAt] = useState<string | null>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(prospectEmail || null)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openInsights, setOpenInsights] = useState(true)

  // Composer
  const [templateType, setTemplateType] = useState<TemplateType>('FIRST_CONTACT')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  const [isAiDraft, setIsAiDraft] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const r = await fetch(`/api/sales/prospects/${placeId}/outreach`)
      if (!r.ok) throw new Error(`Status ${r.status}`)
      const data = await r.json()
      setEmails(data.emails || [])
      if (data.prospect) {
        setInsights(data.prospect.insights || null)
        setWebsiteAnalyzedAt(data.prospect.websiteAnalyzedAt || null)
        if (data.prospect.email) setCurrentEmail(data.prospect.email)
      }
    } catch (e: any) {
      setError(`Laden fehlgeschlagen: ${e?.message || e}`)
    } finally {
      setLoading(false)
    }
  }, [placeId])

  useEffect(() => { load() }, [load])

  const runAnalyze = async () => {
    setAnalyzing(true)
    setError(null)
    try {
      const r = await fetch(`/api/sales/prospects/${placeId}/outreach/analyze`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || `Status ${r.status}`)
      setInsights(data.insights)
      setWebsiteAnalyzedAt(new Date().toISOString())
      if (data.suggestedEmail && !currentEmail) {
        setCurrentEmail(data.suggestedEmail)
        if (onEmailSaved) onEmailSaved()
      }
    } catch (e: any) {
      setError(`KI-Analyse fehlgeschlagen: ${e?.message || e}`)
    } finally {
      setAnalyzing(false)
    }
  }

  const runGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const r = await fetch(`/api/sales/prospects/${placeId}/outreach/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateType, customNotes }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || `Status ${r.status}`)
      setSubject(data.subject || '')
      setBody(data.body || '')
      setIsAiDraft(true)
    } catch (e: any) {
      setError(`Email-Generierung fehlgeschlagen: ${e?.message || e}`)
    } finally {
      setGenerating(false)
    }
  }

  const send = async () => {
    if (!currentEmail) {
      setError('Keine Empfänger-Email hinterlegt. Bitte oben im Tab "Informationen" eintragen.')
      return
    }
    if (!subject.trim() || !body.trim()) {
      setError('Subject und Body sind erforderlich.')
      return
    }
    if (!confirm(`Email wirklich an ${currentEmail} senden?`)) return

    setSending(true)
    setError(null)
    try {
      const r = await fetch(`/api/sales/prospects/${placeId}/outreach/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, body, templateType,
          aiGenerated: isAiDraft,
        }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || `Status ${r.status}`)
      setSubject('')
      setBody('')
      setCustomNotes('')
      setIsAiDraft(false)
      await load()
    } catch (e: any) {
      setError(`Versand fehlgeschlagen: ${e?.message || e}`)
    } finally {
      setSending(false)
    }
  }

  const fmtDate = (s?: string | null) =>
    s ? new Date(s).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–'

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError(null)} className="text-xs underline">schließen</button>
        </div>
      )}

      {/* KI-Insights Panel */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <button
            onClick={() => setOpenInsights((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-800"
          >
            {openInsights ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Bot className="h-4 w-4 text-purple-600" />
            KI-Analyse {insights && <span className="text-xs text-gray-500 font-normal">(Fit: {insights.fitForBereifung24}/10)</span>}
          </button>
          <div className="flex items-center gap-2">
            {websiteAnalyzedAt && (
              <span className="text-xs text-gray-500">analysiert: {fmtDate(websiteAnalyzedAt)}</span>
            )}
            <button
              onClick={runAnalyze}
              disabled={analyzing || !prospectWebsite}
              title={!prospectWebsite ? 'Keine Webseite hinterlegt' : 'Webseite crawlen + analysieren'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300"
            >
              {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {analyzing ? 'Analysiere…' : insights ? 'Neu analysieren' : 'Jetzt analysieren'}
            </button>
          </div>
        </div>

        {openInsights && (
          <div className="p-4 text-sm text-gray-700 space-y-3">
            {!insights ? (
              <div className="text-gray-500 italic">
                <Globe className="h-4 w-4 inline mr-1" />
                Noch keine KI-Analyse. Klicke auf „Jetzt analysieren", um Webseite + Google-Daten von Gemini auswerten zu lassen.
              </div>
            ) : (
              <>
                {insights.summary && <p>{insights.summary}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.services && insights.services.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Services</div>
                      <div className="flex flex-wrap gap-1">{insights.services.map((s, i) => <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 rounded">{s}</span>)}</div>
                    </div>
                  )}
                  {insights.brands && insights.brands.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Marken</div>
                      <div className="flex flex-wrap gap-1">{insights.brands.map((s, i) => <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 rounded">{s}</span>)}</div>
                    </div>
                  )}
                  {insights.targetGroups && insights.targetGroups.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Zielgruppen</div>
                      <div className="flex flex-wrap gap-1">{insights.targetGroups.map((s, i) => <span key={i} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">{s}</span>)}</div>
                    </div>
                  )}
                  {insights.uniqueSellingPoints && insights.uniqueSellingPoints.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase mb-1">USPs</div>
                      <ul className="list-disc list-inside text-sm space-y-0.5">{insights.uniqueSellingPoints.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </div>
                  )}
                </div>
                {insights.weaknesses && insights.weaknesses.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Verbesserungspotenzial</div>
                    <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-700">{insights.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {insights.recommendedAngle && (
                  <div className="p-3 rounded-md bg-purple-50 border border-purple-200">
                    <div className="text-xs font-semibold text-purple-700 uppercase mb-1">Empfohlener Aufhänger</div>
                    <div>{insights.recommendedAngle}</div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">Neue Email an {prospectName}</div>
          <div className="text-xs text-gray-500">
            an: <span className="font-medium text-gray-700">{currentEmail || '— keine Email —'}</span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Sequenz-Typ</label>
              <select
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value as TemplateType)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {(Object.keys(TEMPLATE_LABELS) as TemplateType[]).map((k) => (
                  <option key={k} value={k}>{TEMPLATE_LABELS[k]}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Briefing für die KI (optional)</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="z.B. Werkstatt hat letzte Woche neue Filiale eröffnet"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={runGenerate}
            disabled={generating}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {generating ? 'Generiere…' : 'KI-Entwurf erzeugen'}
          </button>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Betreff</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setIsAiDraft(false) }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Bereifung24 – Reifen-Aufträge aus Ihrer Region"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email-Text</label>
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); setIsAiDraft(false) }}
              rows={10}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="Sehr geehrte Damen und Herren,…"
            />
            {isAiDraft && <div className="mt-1 text-xs text-purple-600 flex items-center gap-1"><Bot className="h-3 w-3" /> KI-Entwurf – bitte vor Versand prüfen</div>}
          </div>
          <div className="flex justify-end">
            <button
              onClick={send}
              disabled={sending || !subject || !body || !currentEmail}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sende…' : 'Email versenden'}
            </button>
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="border border-gray-200 rounded-lg bg-white">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-800">Verlauf ({emails.length})</div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Aktualisieren
          </button>
        </div>
        <div className="p-4 space-y-3">
          {loading ? (
            <div className="text-center py-6 text-gray-500"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">Noch keine Outreach-Emails verschickt.</div>
          ) : (
            emails.map((e) => {
              const isInbound = e.direction === 'INBOUND'
              return (
                <div
                  key={e.id}
                  className={`border rounded-lg p-3 ${isInbound ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 text-xs">
                      {isInbound ? <Reply className="h-3.5 w-3.5 text-purple-700" /> : <Mail className="h-3.5 w-3.5 text-gray-700" />}
                      <span className="font-semibold">
                        {isInbound ? `← ${e.fromEmail}` : `→ ${e.toEmail}`}
                      </span>
                      <span className="text-gray-500">{TEMPLATE_LABELS[e.templateType as TemplateType] || e.templateType}</span>
                      {e.aiGenerated && <span className="inline-flex items-center gap-0.5 text-purple-700"><Bot className="h-3 w-3" />KI</span>}
                      <StatusBadge status={e.status} />
                    </div>
                    <div className="text-xs text-gray-500">{fmtDate(e.sentAt || e.createdAt)}</div>
                  </div>
                  <div className="text-sm font-medium text-gray-900 mb-1">{e.subject}</div>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">{e.body.slice(0, 1500)}{e.body.length > 1500 ? '…' : ''}</pre>
                  {!isInbound && (
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        {e.openedAt ? <MailOpen className="h-3.5 w-3.5 text-green-600" /> : <Mail className="h-3.5 w-3.5 text-gray-400" />}
                        {e.openedAt ? `Geöffnet ${e.openCount}×` : 'Nicht geöffnet'}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MousePointerClick className={`h-3.5 w-3.5 ${e.clickedAt ? 'text-blue-600' : 'text-gray-400'}`} />
                        {e.clickedAt ? `Klicks: ${e.clickCount}` : 'Keine Klicks'}
                      </span>
                      {e.repliedAt && <span className="inline-flex items-center gap-1 text-purple-700"><Reply className="h-3.5 w-3.5" /> Beantwortet</span>}
                      {e.sentByName && <span>von {e.sentByName}</span>}
                    </div>
                  )}
                  {e.errorMessage && (
                    <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
                      {e.errorMessage}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
