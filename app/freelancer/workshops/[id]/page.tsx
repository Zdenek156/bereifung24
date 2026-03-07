'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface WorkshopDetail {
  id: string
  companyName: string
  status: string
  contact: { name: string, email: string, phone: string, address: string }
  health: { status: 'green' | 'yellow' | 'red', label: string }
  avgRating: number | null
  reviewCount: number
  services: { name: string, price: number }[]
  profileItems: { name: string, complete: boolean }[]
  profileComplete: boolean
  monthlyBookings: { period: string, label: string, count: number }[]
  registeredAt: string
}

export default function WorkshopDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/freelancer/workshops/${params.id}`)
        if (res.ok) setWorkshop(await res.json())
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [params.id])

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (!workshop) return <div className="text-center py-12 text-gray-500">Werkstatt nicht gefunden</div>

  const healthColors = { green: 'bg-green-100 text-green-800', yellow: 'bg-yellow-100 text-yellow-800', red: 'bg-red-100 text-red-800' }
  const healthIcons = { green: '🟢', yellow: '🟡', red: '🔴' }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/freelancer/workshops')} className="p-2 hover:bg-gray-100 rounded-lg">
          ← Zurück
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{workshop.companyName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${healthColors[workshop.health.status]}`}>
              {healthIcons[workshop.health.status]} {workshop.health.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              workshop.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>{workshop.status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kontaktdaten</h2>
          <div className="space-y-3">
            <div><span className="text-sm text-gray-500">Ansprechpartner:</span><p className="font-medium">{workshop.contact.name}</p></div>
            <div><span className="text-sm text-gray-500">E-Mail:</span><p><a href={`mailto:${workshop.contact.email}`} className="text-blue-600 hover:underline">{workshop.contact.email}</a></p></div>
            <div><span className="text-sm text-gray-500">Telefon:</span><p>{workshop.contact.phone || '-'}</p></div>
            <div><span className="text-sm text-gray-500">Adresse:</span><p>{workshop.contact.address || '-'}</p></div>
          </div>
        </div>

        {/* Profile Completeness */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profilvollständigkeit</h2>
          <div className="space-y-3">
            {workshop.profileItems.map(item => (
              <div key={item.name} className="flex items-center gap-2">
                <span className={item.complete ? 'text-green-500' : 'text-red-500'}>
                  {item.complete ? '✅' : '❌'}
                </span>
                <span className="text-sm">{item.name}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            {workshop.profileComplete ? 'Profil ist vollständig' : 'Profil sollte vervollständigt werden'}
          </p>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistiken</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Bewertung:</span>
              <p className="font-medium">{workshop.avgRating ? `⭐ ${workshop.avgRating} (${workshop.reviewCount} Bewertungen)` : 'Keine Bewertungen'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Services:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {workshop.services.length > 0 ? workshop.services.map(s => (
                  <span key={s.name} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{s.name}</span>
                )) : <span className="text-xs text-gray-400">Keine Services gelistet</span>}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Registriert:</span>
              <p>{new Date(workshop.registeredAt).toLocaleDateString('de-DE')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Bookings Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Buchungen (letzte 6 Monate)</h2>
        <div className="flex items-end gap-3 h-40">
          {workshop.monthlyBookings.map(m => {
            const maxCount = Math.max(...workshop.monthlyBookings.map(b => b.count), 1)
            return (
              <div key={m.period} className="flex-1 flex flex-col items-center">
                <span className="text-sm font-medium text-gray-700 mb-1">{m.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t transition-all"
                  style={{ height: `${Math.max(4, (m.count / maxCount) * 120)}px` }}
                />
                <span className="text-xs text-gray-500 mt-1">{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
