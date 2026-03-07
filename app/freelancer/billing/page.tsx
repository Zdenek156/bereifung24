'use client'

import { useEffect, useState } from 'react'

interface Payout {
  id: string
  period: string
  totalBookings: number
  totalVolume: number
  totalCommission: number
  tier: string
  status: string
  invoiceUrl: string | null
  paidAt: string | null
  statementUrl: string | null
  createdAt: string
}

const statusLabels: Record<string, string> = {
  CALCULATED: 'Berechnet',
  APPROVED: 'Genehmigt',
  PAID: 'Ausgezahlt',
  REJECTED: 'Abgelehnt',
}
const statusColors: Record<string, string> = {
  CALCULATED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
}
const tierLabels: Record<string, string> = { STARTER: 'Starter (15%)', BRONZE: 'Bronze (20%)', SILVER: 'Silber (25%)', GOLD: 'Gold (30%)' }

export default function BillingPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/freelancer/payouts')
        if (res.ok) {
          const data = await res.json()
          setPayouts(data.payouts)
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const totalPaid = payouts.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.totalCommission, 0)
  const totalPending = payouts.filter(p => p.status !== 'PAID').reduce((sum, p) => sum + p.totalCommission, 0)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Abrechnung & Rechnungen</h1>
        <p className="text-gray-500">Monatsabrechnungen und Zahlungsübersicht</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Bereits ausgezahlt</p>
          <p className="text-2xl font-bold text-green-700">{totalPaid.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Ausstehend</p>
          <p className="text-2xl font-bold text-yellow-700">{totalPending.toFixed(2)}€</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-500">Abrechnungen</p>
          <p className="text-2xl font-bold text-gray-900">{payouts.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Abrechnungshistorie</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periode</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Buchungen</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Volumen</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Provision</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stufe</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payouts.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Noch keine Abrechnungen vorhanden</td></tr>
            ) : payouts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-sm">{p.period}</td>
                <td className="px-4 py-3 text-right text-sm">{p.totalBookings}</td>
                <td className="px-4 py-3 text-right text-sm">{p.totalVolume.toFixed(2)}€</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-green-700">{p.totalCommission.toFixed(2)}€</td>
                <td className="px-4 py-3 text-center text-xs">{tierLabels[p.tier] || p.tier}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[p.status] || 'bg-gray-100'}`}>
                    {statusLabels[p.status] || p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center gap-1">
                    {p.statementUrl && (
                      <a href={p.statementUrl} target="_blank" rel="noopener" className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                        📄 Abrechnung
                      </a>
                    )}
                    {p.paidAt && (
                      <span className="text-xs text-gray-500">
                        Bezahlt: {new Date(p.paidAt).toLocaleDateString('de-DE')}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">ℹ️ Auszahlungszyklus</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Abrechnungszeitraum: 1. – letzter Tag des Monats</li>
          <li>• Abrechnung erstellt: automatisch am 1. des Folgemonats</li>
          <li>• Prüfung durch Admin: bis zum 10. des Folgemonats</li>
          <li>• Auszahlung: zum 15. des Folgemonats</li>
        </ul>
      </div>
    </div>
  )
}
