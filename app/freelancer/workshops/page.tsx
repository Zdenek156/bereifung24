'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Workshop {
  id: string
  companyName: string
  status: string
  contactName: string
  contactEmail: string
  contactPhone: string
  bookingsThisMonth: number
  bookingsLastMonth: number
  bookingTrend: 'up' | 'down' | 'stable'
  commissionThisMonth: number
  avgRating: number | null
  reviewCount: number
  profileScore: number
  profileComplete: boolean
  profileDetails: { hasCalendar: boolean, hasStripe: boolean, hasServices: boolean, hasPricing: boolean, hasSupplier: boolean, hasLandingPage: boolean }
  health: { status: 'green' | 'yellow' | 'red', label: string }
  services: string[]
  registeredAt: string
}

const healthIcons = { green: '🟢', yellow: '🟡', red: '🔴' }
const trendIcons = { up: '↑', down: '↓', stable: '→' }
const trendColors = { up: 'text-green-600', down: 'text-red-600', stable: 'text-gray-500' }

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchWorkshops()
  }, [search, statusFilter])

  async function fetchWorkshops() {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/freelancer/workshops?${params}`)
      if (res.ok) {
        const data = await res.json()
        setWorkshops(data.workshops)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meine Werkstätten</h1>
        <p className="text-gray-500">{workshops.length} Werkstätten zugeordnet</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Werkstatt suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Alle Status</option>
          <option value="ACTIVE">Aktiv</option>
          <option value="PENDING">Onboarding</option>
          <option value="SUSPENDED">Inaktiv</option>
        </select>
      </div>

      {/* Workshops Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gesundheit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Werkstatt</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buchungen</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Provision</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Bewertung</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Profil</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registriert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workshops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    Noch keine Werkstätten zugeordnet. Nutze deine Lead-Pipeline, um Werkstätten zu akquirieren!
                  </td>
                </tr>
              ) : (
                workshops.map(ws => (
                  <tr key={ws.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3">
                      <span title={ws.health.label}>{healthIcons[ws.health.status]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/freelancer/workshops/${ws.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {ws.companyName}
                      </Link>
                      <p className="text-xs text-gray-500">{ws.contactName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ws.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        ws.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>{ws.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium">{ws.bookingsThisMonth}</span>
                      <span className={`ml-1 text-xs ${trendColors[ws.bookingTrend]}`}>
                        {trendIcons[ws.bookingTrend]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {ws.commissionThisMonth.toFixed(2)}€
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ws.avgRating ? (
                        <span className="text-sm">⭐ {ws.avgRating} ({ws.reviewCount})</span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span 
                        className={`text-sm cursor-help ${ws.profileScore >= 5 ? 'text-green-600' : ws.profileScore >= 3 ? 'text-yellow-600' : 'text-red-600'}`}
                        title={`Werkstatt-Einrichtung:\n${ws.profileDetails?.hasCalendar ? '✅' : '❌'} Google Kalender\n${ws.profileDetails?.hasStripe ? '✅' : '❌'} Stripe Konto\n${ws.profileDetails?.hasServices ? '✅' : '❌'} Services\n${ws.profileDetails?.hasPricing ? '✅' : '❌'} Preiskalkulation\n${ws.profileDetails?.hasSupplier ? '✅' : '❌'} Lieferant\n${ws.profileDetails?.hasLandingPage ? '✅' : '❌'} Landing Page`}
                      >
                        {ws.profileScore}/6
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(ws.registeredAt).toLocaleDateString('de-DE')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
