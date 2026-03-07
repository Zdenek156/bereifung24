'use client'

import { useEffect, useState } from 'react'

interface CommissionMonth {
  period: string
  bookingCount: number
  totalVolume: number
  b24NetCommission: number
  freelancerAmount: number
  payout: { status: string, tier: string, paidAt: string | null } | null
}

interface PeriodDetail {
  period: string
  commissionCount: number
  totals: {
    bookingAmount: number
    b24GrossCommission: number
    stripeFee: number
    b24NetCommission: number
    freelancerAmount: number
  }
  byWorkshop: { workshopId: string, workshopName: string, bookings: number, totalVolume: number, totalCommission: number }[]
}

const statusLabels: Record<string, string> = {
  CALCULATED: 'Berechnet',
  REVIEWED: 'Geprüft',
  INVOICED: 'Rechnung gestellt',
  PAID: 'Ausgezahlt',
}
const statusColors: Record<string, string> = {
  CALCULATED: 'bg-yellow-100 text-yellow-800',
  REVIEWED: 'bg-blue-100 text-blue-800',
  INVOICED: 'bg-purple-100 text-purple-800',
  PAID: 'bg-green-100 text-green-800',
}

export default function EarningsPage() {
  const [commissions, setCommissions] = useState<CommissionMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null)
  const [periodDetail, setPeriodDetail] = useState<PeriodDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/freelancer/commissions')
        if (res.ok) {
          const data = await res.json()
          setCommissions(data.commissions)
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function loadPeriodDetail(period: string) {
    if (selectedPeriod === period) {
      setSelectedPeriod(null)
      setPeriodDetail(null)
      return
    }
    setSelectedPeriod(period)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/freelancer/commissions/${period}`)
      if (res.ok) setPeriodDetail(await res.json())
    } catch (err) { console.error(err) }
    finally { setDetailLoading(false) }
  }

  const totalEarnings = commissions.reduce((sum, c) => sum + c.freelancerAmount, 0)
  const totalBookings = commissions.reduce((sum, c) => sum + c.bookingCount, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Provisionen & Einnahmen</h1>
        <p className="text-gray-500">Volle Transparenz über alle Einnahmen</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Gesamteinnahmen</p>
          <p className="text-2xl font-bold text-gray-900">{totalEarnings.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Gesamtbuchungen</p>
          <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Abrechnungsperioden</p>
          <p className="text-2xl font-bold text-gray-900">{commissions.length}</p>
        </div>
      </div>

      {/* Monthly Overview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Monatsübersicht</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monat</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buchungen</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Volumen</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">B24-Netto</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mein Anteil</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {commissions.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Noch keine Provisionen vorhanden</td></tr>
            ) : commissions.map(c => (
              <>
                <tr
                  key={c.period}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => loadPeriodDetail(c.period)}
                >
                  <td className="px-4 py-3 font-medium text-sm">
                    {selectedPeriod === c.period ? '▼' : '▶'} {c.period}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{c.bookingCount}</td>
                  <td className="px-4 py-3 text-right text-sm">{c.totalVolume.toFixed(2)}€</td>
                  <td className="px-4 py-3 text-right text-sm">{c.b24NetCommission.toFixed(2)}€</td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{c.freelancerAmount.toFixed(2)}€</td>
                  <td className="px-4 py-3 text-center">
                    {c.payout ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.payout.status] || 'bg-gray-100'}`}>
                        {statusLabels[c.payout.status] || c.payout.status}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Ausstehend</span>
                    )}
                  </td>
                </tr>
                {selectedPeriod === c.period && periodDetail && !detailLoading && (
                  <tr key={`${c.period}-detail`}>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <h3 className="text-sm font-semibold mb-3">Aufschlüsselung nach Werkstatt</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 text-xs">
                            <th className="text-left py-1">Werkstatt</th>
                            <th className="text-right py-1">Buchungen</th>
                            <th className="text-right py-1">Volumen</th>
                            <th className="text-right py-1">Mein Anteil</th>
                          </tr>
                        </thead>
                        <tbody>
                          {periodDetail.byWorkshop.map(ws => (
                            <tr key={ws.workshopId} className="border-t border-gray-200">
                              <td className="py-1">{ws.workshopName}</td>
                              <td className="text-right py-1">{ws.bookings}</td>
                              <td className="text-right py-1">{ws.totalVolume.toFixed(2)}€</td>
                              <td className="text-right py-1 font-medium">{ws.totalCommission.toFixed(2)}€</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                        Buchungsvolumen: {periodDetail.totals.bookingAmount.toFixed(2)}€ → B24-Brutto: {periodDetail.totals.b24GrossCommission.toFixed(2)}€ → Stripe: -{periodDetail.totals.stripeFee.toFixed(2)}€ → B24-Netto: {periodDetail.totals.b24NetCommission.toFixed(2)}€ → Ihr Anteil: <strong className="text-green-700">{periodDetail.totals.freelancerAmount.toFixed(2)}€</strong>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
