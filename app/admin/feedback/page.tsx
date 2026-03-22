'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface FeedbackEntry {
  id: string
  userId: string
  rating: number
  comment: string | null
  createdAt: string
  user: { firstName: string; lastName: string; email: string } | null
}

interface Stats {
  total: number
  average: number
  distribution: Record<number, number>
}

const EMOJIS: Record<number, string> = { 1: '😠', 2: '😕', 3: '😐', 4: '😊', 5: '🤩' }
const LABELS: Record<number, string> = { 1: 'Sehr schlecht', 2: 'Schlecht', 3: 'Okay', 4: 'Gut', 5: 'Ausgezeichnet' }
const COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-700 border-red-200',
  2: 'bg-orange-100 text-orange-700 border-orange-200',
  3: 'bg-amber-100 text-amber-700 border-amber-200',
  4: 'bg-lime-100 text-lime-700 border-lime-200',
  5: 'bg-green-100 text-green-700 border-green-200',
}

export default function FeedbackAdminPage() {
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (ratingFilter) params.set('rating', String(ratingFilter))
      const res = await fetch(`/api/admin/feedback?${params}`)
      if (!res.ok) throw new Error('Laden fehlgeschlagen')
      const data = await res.json()
      setFeedbacks(data.feedbacks)
      setStats(data.stats)
      setPages(data.pages)
    } catch {
      console.error('Fehler beim Laden')
    } finally {
      setLoading(false)
    }
  }, [page, ratingFilter])

  useEffect(() => { loadData() }, [loadData])

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Zurück
        </button>
        <div>
          <h1 className="text-2xl font-bold">App-Feedback</h1>
          <p className="text-sm text-gray-500">Kundenbewertungen aus der Bereifung24 App</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Average */}
          <div className="bg-white rounded-xl border p-5 text-center">
            <div className="text-4xl font-bold text-blue-600">{stats.average || '–'}</div>
            <div className="text-sm text-gray-500 mt-1">Durchschnitt</div>
            <div className="text-2xl mt-1">
              {stats.average >= 4.5 ? '🤩' : stats.average >= 3.5 ? '😊' : stats.average >= 2.5 ? '😐' : stats.average >= 1.5 ? '😕' : stats.total > 0 ? '😠' : '–'}
            </div>
          </div>

          {/* Total */}
          <div className="bg-white rounded-xl border p-5 text-center">
            <div className="text-4xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500 mt-1">Bewertungen gesamt</div>
          </div>

          {/* Distribution */}
          <div className="bg-white rounded-xl border p-5">
            <div className="text-sm font-semibold mb-2">Verteilung</div>
            {[5, 4, 3, 2, 1].map((r) => {
              const count = stats.distribution[r] || 0
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
              return (
                <div key={r} className="flex items-center gap-2 text-sm mb-1">
                  <span className="w-5">{EMOJIS[r]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-gray-600">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => { setRatingFilter(null); setPage(1) }}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${!ratingFilter ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
        >
          Alle
        </button>
        {[5, 4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => { setRatingFilter(r); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${ratingFilter === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white hover:bg-gray-50 border-gray-200'}`}
          >
            {EMOJIS[r]} {LABELS[r]}
          </button>
        ))}
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Laden...</div>
      ) : feedbacks.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {ratingFilter ? 'Keine Bewertungen mit diesem Filter' : 'Noch keine Bewertungen vorhanden'}
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className={`text-xl px-3 py-1 rounded-full border ${COLORS[fb.rating]}`}>
                    {EMOJIS[fb.rating]} {LABELS[fb.rating]}
                  </span>
                  <div>
                    <div className="font-medium text-sm">
                      {fb.user ? `${fb.user.firstName} ${fb.user.lastName}` : 'Unbekannt'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {fb.user?.email}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(fb.createdAt).toLocaleDateString('de-DE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </div>
              </div>
              {fb.comment && (
                <div className="mt-3 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                  &quot;{fb.comment}&quot;
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
          >
            ← Zurück
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-500">
            Seite {page} von {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40"
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  )
}
