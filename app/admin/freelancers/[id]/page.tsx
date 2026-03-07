'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface FreelancerDetail {
  id: string
  tier: string
  status: string
  phone: string | null
  region: string | null
  company: string | null
  affiliateCode: string
  taxId: string | null
  iban: string | null
  bankName: string | null
  createdAt: string
  totalCommission: number
  user: { id: string; firstName: string | null; lastName: string | null; email: string; createdAt: string }
  workshops: Array<{ id: string; companyName: string; city: string; createdAt: string; freelancerAcquiredAt: string | null }>
  leads: Array<{ id: string; companyName: string; status: string; contactName: string | null; createdAt: string }>
  recentCommissions: Array<{ id: string; bookingAmount: number; b24GrossCommission: number; freelancerAmount: number; createdAt: string }>
  payouts: Array<{ id: string; amount: number; status: string; periodStart: string; periodEnd: string; paidAt: string | null }>
}

const tierLabels: Record<string, string> = { STARTER: '🌱 Starter (15%)', BRONZE: '🥉 Bronze (20%)', SILVER: '🥈 Silber (25%)', GOLD: '🥇 Gold (30%)' }
const statusLabels: Record<string, string> = { ACTIVE: '✅ Aktiv', PAUSED: '⏸ Pausiert', TERMINATED: '❌ Beendet' }
const leadStatusLabels: Record<string, string> = { NEW: 'Neu', CONTACTED: 'Kontaktiert', INTERESTED: 'Interessiert', DEMO_SCHEDULED: 'Demo geplant', NEGOTIATION: 'Verhandlung', ONBOARDED: '✅ Onboarded', LOST: '❌ Verloren' }

export default function FreelancerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [freelancer, setFreelancer] = useState<FreelancerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'workshops' | 'leads' | 'commissions' | 'payouts'>('overview')

  useEffect(() => {
    fetch(`/api/admin/freelancers/${params.id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setFreelancer(d.freelancer))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [params.id])

  async function updateField(field: string, value: string) {
    await fetch(`/api/admin/freelancers/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    // Reload
    const res = await fetch(`/api/admin/freelancers/${params.id}`)
    if (res.ok) setFreelancer((await res.json()).freelancer)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (!freelancer) return <div className="p-8 text-center text-gray-500">Freelancer nicht gefunden</div>

  const f = freelancer

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={() => router.push('/admin/freelancers')} className="text-sm text-blue-600 hover:underline mb-1">← Zurück zur Übersicht</button>
            <h1 className="text-2xl font-bold text-gray-900">
              {f.user.firstName} {f.user.lastName}
            </h1>
            <p className="text-sm text-gray-500">{f.user.email} · Code: <span className="font-mono text-blue-600">{f.affiliateCode}</span></p>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={f.tier}
              onChange={e => updateField('tier', e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm font-medium"
            >
              <option value="STARTER">🌱 Starter</option>
              <option value="BRONZE">🥉 Bronze</option>
              <option value="SILVER">🥈 Silber</option>
              <option value="GOLD">🥇 Gold</option>
            </select>
            <select
              value={f.status}
              onChange={e => updateField('status', e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm font-medium"
            >
              <option value="ACTIVE">Aktiv</option>
              <option value="PAUSED">Pausiert</option>
              <option value="TERMINATED">Beendet</option>
            </select>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Tier</p>
            <p className="text-lg font-bold">{tierLabels[f.tier]}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Werkstätten</p>
            <p className="text-lg font-bold">{f.workshops.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Offene Leads</p>
            <p className="text-lg font-bold">{f.leads.filter(l => l.status !== 'ONBOARDED' && l.status !== 'LOST').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <p className="text-xs text-gray-500">Gesamt-Provision</p>
            <p className="text-lg font-bold text-green-600">€{f.totalCommission.toFixed(2)}</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h3 className="font-semibold text-sm text-gray-700 mb-2">Kontaktdaten</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Telefon:</span> <span className="font-medium">{f.phone || '–'}</span></div>
            <div><span className="text-gray-500">Region:</span> <span className="font-medium">{f.region || '–'}</span></div>
            <div><span className="text-gray-500">Firma:</span> <span className="font-medium">{f.company || '–'}</span></div>
            <div><span className="text-gray-500">IBAN:</span> <span className="font-mono text-xs">{f.iban || '–'}</span></div>
            <div><span className="text-gray-500">Bank:</span> <span className="font-medium">{f.bankName || '–'}</span></div>
            <div><span className="text-gray-500">Steuer-ID:</span> <span className="font-mono text-xs">{f.taxId || '–'}</span></div>
            <div><span className="text-gray-500">Dabei seit:</span> <span className="font-medium">{new Date(f.createdAt).toLocaleDateString('de-DE')}</span></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b">
          {[
            { key: 'workshops', label: `Werkstätten (${f.workshops.length})` },
            { key: 'leads', label: `Leads (${f.leads.length})` },
            { key: 'commissions', label: `Provisionen (${f.recentCommissions.length})` },
            { key: 'payouts', label: `Auszahlungen (${f.payouts.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border">
          {tab === 'workshops' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Werkstatt</th>
                  <th className="text-left p-3 font-medium text-gray-600">Stadt</th>
                  <th className="text-left p-3 font-medium text-gray-600">Akquiriert am</th>
                  <th className="text-left p-3 font-medium text-gray-600">Registriert</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {f.workshops.map(w => (
                  <tr key={w.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{w.companyName}</td>
                    <td className="p-3 text-gray-600">{w.city}</td>
                    <td className="p-3 text-gray-600">{w.freelancerAcquiredAt ? new Date(w.freelancerAcquiredAt).toLocaleDateString('de-DE') : '–'}</td>
                    <td className="p-3 text-gray-500">{new Date(w.createdAt).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
                {f.workshops.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Keine Werkstätten</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'leads' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Firma</th>
                  <th className="text-left p-3 font-medium text-gray-600">Kontakt</th>
                  <th className="text-center p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Erstellt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {f.leads.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{l.companyName}</td>
                    <td className="p-3 text-gray-600">{l.contactName || '–'}</td>
                    <td className="p-3 text-center"><span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded-full">{leadStatusLabels[l.status] || l.status}</span></td>
                    <td className="p-3 text-gray-500">{new Date(l.createdAt).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
                {f.leads.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Keine Leads</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'commissions' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Datum</th>
                  <th className="text-right p-3 font-medium text-gray-600">Buchungswert</th>
                  <th className="text-right p-3 font-medium text-gray-600">B24 Provision</th>
                  <th className="text-right p-3 font-medium text-gray-600">Freelancer-Anteil</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {f.recentCommissions.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-3">{new Date(c.createdAt).toLocaleDateString('de-DE')}</td>
                    <td className="p-3 text-right">€{Number(c.bookingAmount).toFixed(2)}</td>
                    <td className="p-3 text-right">€{Number(c.b24GrossCommission).toFixed(2)}</td>
                    <td className="p-3 text-right font-medium text-green-600">€{Number(c.freelancerAmount).toFixed(2)}</td>
                  </tr>
                ))}
                {f.recentCommissions.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Keine Provisionen</td></tr>}
              </tbody>
            </table>
          )}

          {tab === 'payouts' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-600">Zeitraum</th>
                  <th className="text-right p-3 font-medium text-gray-600">Betrag</th>
                  <th className="text-center p-3 font-medium text-gray-600">Status</th>
                  <th className="text-left p-3 font-medium text-gray-600">Bezahlt am</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {f.payouts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3">{new Date(p.periodStart).toLocaleDateString('de-DE')} – {new Date(p.periodEnd).toLocaleDateString('de-DE')}</td>
                    <td className="p-3 text-right font-medium">€{Number(p.amount).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        p.status === 'PAID' ? 'bg-green-100 text-green-700' :
                        p.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                        p.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="p-3 text-gray-500">{p.paidAt ? new Date(p.paidAt).toLocaleDateString('de-DE') : '–'}</td>
                  </tr>
                ))}
                {f.payouts.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-gray-500">Keine Auszahlungen</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
