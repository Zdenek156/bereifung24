'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Freelancer {
  id: string
  userId: string
  name: string
  email: string
  phone: string | null
  region: string | null
  tier: string
  status: string
  affiliateCode: string
  workshopCount: number
  leadCount: number
  commissionCount: number
  company: string | null
  createdAt: string
}

interface Stats {
  total: number
  active: number
  totalWorkshops: number
  totalLeads: number
}

const tierColors: Record<string, string> = {
  STARTER: 'bg-gray-100 text-gray-700',
  BRONZE: 'bg-orange-100 text-orange-700',
  SILVER: 'bg-gray-100 text-gray-700',
  GOLD: 'bg-yellow-100 text-yellow-700',
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-gray-100 text-gray-600',
  TERMINATED: 'bg-red-100 text-red-700',
}

export default function AdminFreelancersPage() {
  const router = useRouter()
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, totalWorkshops: 0, totalLeads: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ status: '', tier: '', search: '' })
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newFreelancer, setNewFreelancer] = useState({
    email: '', firstName: '', lastName: '', phone: '', region: '', tier: 'STARTER', company: '',
  })

  useEffect(() => { loadFreelancers() }, [filter.status, filter.tier])

  async function loadFreelancers() {
    setLoading(true)
    const params = new URLSearchParams()
    if (filter.status) params.set('status', filter.status)
    if (filter.tier) params.set('tier', filter.tier)
    if (filter.search) params.set('search', filter.search)
    const res = await fetch(`/api/admin/freelancers?${params}`)
    if (res.ok) {
      const data = await res.json()
      setFreelancers(data.freelancers)
      setStats(data.stats)
    }
    setLoading(false)
  }

  async function createFreelancer(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await fetch('/api/admin/freelancers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFreelancer),
    })
    if (res.ok) {
      const data = await res.json()
      alert(`Freelancer erstellt! Affiliate-Code: ${data.affiliateCode}`)
      setShowCreate(false)
      setNewFreelancer({ email: '', firstName: '', lastName: '', phone: '', region: '', tier: 'BRONZE', company: '' })
      loadFreelancers()
    } else {
      const err = await res.json()
      alert(err.error || 'Fehler beim Erstellen')
    }
    setCreating(false)
  }

  async function updateStatus(id: string, status: string) {
    if (!confirm(`Freelancer wirklich auf "${status}" setzen?`)) return
    const res = await fetch(`/api/admin/freelancers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) loadFreelancers()
  }

  async function updateTier(id: string, tier: string) {
    const res = await fetch(`/api/admin/freelancers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })
    if (res.ok) loadFreelancers()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Freelancer-Verwaltung</h1>
            <p className="text-sm text-gray-500">Vertriebspartner verwalten und überwachen</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin')} className="px-4 py-2 text-sm text-gray-600 bg-white border rounded-lg hover:bg-gray-50">
              ← Zurück
            </button>
            <button onClick={() => router.push('/mitarbeiter/freelancers/materials')} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-lg hover:bg-gray-50">
              📁 Materialien
            </button>
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700">
              + Neuer Freelancer
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Gesamt', value: stats.total, icon: '👥' },
            { label: 'Aktiv', value: stats.active, icon: '✅' },
            { label: 'Werkstätten', value: stats.totalWorkshops, icon: '🔧' },
            { label: 'Leads', value: stats.totalLeads, icon: '📋' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">{s.icon}</span>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-4 flex flex-wrap gap-3">
          <input
            placeholder="Suche (Name, E-Mail, Code)..."
            value={filter.search}
            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && loadFreelancers()}
            className="px-3 py-1.5 border rounded-lg text-sm flex-1 min-w-[200px]"
          />
          <select value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))} className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">Alle Status</option>
            <option value="ACTIVE">Aktiv</option>
            <option value="PAUSED">Pausiert</option>
            <option value="TERMINATED">Beendet</option>
          </select>
          <select value={filter.tier} onChange={e => setFilter(f => ({ ...f, tier: e.target.value }))} className="px-3 py-1.5 border rounded-lg text-sm">
            <option value="">Alle Tiers</option>
            <option value="STARTER">Starter</option>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silber</option>
            <option value="GOLD">Gold</option>
          </select>
          <button onClick={loadFreelancers} className="px-4 py-1.5 bg-gray-100 text-sm rounded-lg hover:bg-gray-200">
            🔍 Suchen
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></div>
          ) : freelancers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Keine Freelancer gefunden</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-medium text-gray-600">Name</th>
                    <th className="text-left p-3 font-medium text-gray-600">Code</th>
                    <th className="text-left p-3 font-medium text-gray-600">Region</th>
                    <th className="text-center p-3 font-medium text-gray-600">Tier</th>
                    <th className="text-center p-3 font-medium text-gray-600">Status</th>
                    <th className="text-center p-3 font-medium text-gray-600">Werkstätten</th>
                    <th className="text-center p-3 font-medium text-gray-600">Leads</th>
                    <th className="text-center p-3 font-medium text-gray-600">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {freelancers.map(f => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-gray-900">{f.name}</p>
                          <p className="text-xs text-gray-500">{f.email}</p>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs text-blue-600">{f.affiliateCode}</td>
                      <td className="p-3 text-gray-600">{f.region || '–'}</td>
                      <td className="p-3 text-center">
                        <select
                          value={f.tier}
                          onChange={e => updateTier(f.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${tierColors[f.tier] || 'bg-gray-100'}`}
                        >
                          <option value="STARTER">🌱 Starter</option>
                          <option value="BRONZE">🥉 Bronze</option>
                          <option value="SILVER">🥈 Silber</option>
                          <option value="GOLD">🥇 Gold</option>
                        </select>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[f.status] || 'bg-gray-100'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="p-3 text-center font-medium">{f.workshopCount}</td>
                      <td className="p-3 text-center font-medium">{f.leadCount}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => router.push(`/admin/freelancers/${f.id}`)}
                            className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                          >
                            Details
                          </button>
                          {f.status === 'ACTIVE' ? (
                            <button onClick={() => updateStatus(f.id, 'TERMINATED')} className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">
                              Beenden
                            </button>
                          ) : (
                            <button onClick={() => updateStatus(f.id, 'ACTIVE')} className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100">
                              Aktivieren
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-bold mb-4">Neuen Freelancer anlegen</h2>
              <form onSubmit={createFreelancer} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Vorname *</label>
                    <input required value={newFreelancer.firstName} onChange={e => setNewFreelancer(n => ({ ...n, firstName: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Nachname *</label>
                    <input required value={newFreelancer.lastName} onChange={e => setNewFreelancer(n => ({ ...n, lastName: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">E-Mail *</label>
                  <input required type="email" value={newFreelancer.email} onChange={e => setNewFreelancer(n => ({ ...n, email: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Telefon</label>
                    <input value={newFreelancer.phone} onChange={e => setNewFreelancer(n => ({ ...n, phone: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Tier</label>
                    <select value={newFreelancer.tier} onChange={e => setNewFreelancer(n => ({ ...n, tier: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm">
                      <option value="STARTER">Starter (15%)</option>
                      <option value="BRONZE">Bronze (20%)</option>
                      <option value="SILVER">Silber (25%)</option>
                      <option value="GOLD">Gold (30%)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Region</label>
                  <input value={newFreelancer.region} onChange={e => setNewFreelancer(n => ({ ...n, region: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" placeholder="z.B. Hessen" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700">Firma</label>
                  <input value={newFreelancer.company} onChange={e => setNewFreelancer(n => ({ ...n, company: e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={creating} className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                    {creating ? 'Erstelle...' : 'Freelancer erstellen'}
                  </button>
                  <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                    Abbrechen
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
