'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Asset {
  id: string
  assetNumber: string
  name: string
  description: string | null
  category: string
  acquisitionCost: number
  acquisitionDate: string
  usefulLife: number
  annualDepreciation: number
  bookValue: number
  fullyDepreciated: boolean
  costCenter: string
  location: string | null
  status: string
  serialNumber: string | null
  manufacturer: string | null
  model: string | null
  assignedTo: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  createdAt: string
}

const CATEGORY_LABELS: Record<string, string> = {
  EQUIPMENT: 'Ausstattung & Geräte',
  VEHICLES: 'Fahrzeuge',
  IT_HARDWARE: 'IT-Hardware',
  MACHINERY: 'Maschinen',
  FURNITURE: 'Möbel',
  BUILDING: 'Gebäude',
  OTHER: 'Sonstige'
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktiv',
  MAINTENANCE: 'Wartung',
  DISPOSED: 'Ausgesondert',
  SOLD: 'Verkauft',
  LOST: 'Verloren'
}

const COST_CENTER_LABELS: Record<string, string> = {
  ADMIN: 'Verwaltung',
  SALES: 'Vertrieb',
  OPERATIONS: 'Betrieb',
  IT: 'IT',
  MARKETING: 'Marketing',
  HR: 'Personal',
  OTHER: 'Sonstige'
}

export default function AssetsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/admin')
      return
    }
    fetchAssets()
  }, [session, status, router])

  useEffect(() => {
    filterAssets()
  }, [assets, categoryFilter, statusFilter, searchTerm])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/admin/procurement/assets')
      const data = await response.json()
      if (response.ok) {
        setAssets(data.assets)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAssets = () => {
    let filtered = [...assets]

    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter(asset => asset.category === categoryFilter)
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(asset => asset.status === statusFilter)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(term) ||
        asset.assetNumber.toLowerCase().includes(term) ||
        asset.manufacturer?.toLowerCase().includes(term) ||
        asset.model?.toLowerCase().includes(term) ||
        asset.serialNumber?.toLowerCase().includes(term)
      )
    }

    setFilteredAssets(filtered)
  }

  const handleDeleteAsset = async (id: string) => {
    if (!confirm('Möchten Sie dieses Anlagegut wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/procurement/assets?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchAssets()
      } else {
        alert('Fehler beim Löschen des Anlageguts')
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
      alert('Fehler beim Löschen des Anlageguts')
    }
  }

  const calculateTotalValue = () => {
    return assets.reduce((sum, asset) => sum + asset.bookValue, 0)
  }

  const calculateAcquisitionValue = () => {
    return assets.reduce((sum, asset) => sum + asset.acquisitionCost, 0)
  }

  if (status === 'loading' || !session) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Anlagenvermögen</h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwalten Sie Ihr Anlagenvermögen und AfA-Berechnungen
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/procurement"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Zurück
              </Link>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                + Anlagegut erfassen
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Anzahl Anlagegüter</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{assets.length}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Anschaffungswert</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {calculateAcquisitionValue().toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Aktueller Buchwert</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {calculateTotalValue().toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suche
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, Nummer, Hersteller..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="ALL">Alle Kategorien</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="ALL">Alle Status</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <p className="mt-4 text-gray-600">
                {searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Keine Anlagegüter gefunden'
                  : 'Noch keine Anlagegüter erfasst'}
              </p>
              {!searchTerm && categoryFilter === 'ALL' && statusFilter === 'ALL' && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Erstes Anlagegut erfassen
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anlagegut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Anschaffung
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Buchwert
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AfA/Jahr
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.assetNumber}</div>
                          {asset.manufacturer && (
                            <div className="text-xs text-gray-400">{asset.manufacturer} {asset.model}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800">
                          {CATEGORY_LABELS[asset.category]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {asset.acquisitionCost.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(asset.acquisitionDate).toLocaleDateString('de-DE')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {asset.bookValue.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                        </div>
                        {asset.fullyDepreciated && (
                          <div className="text-xs text-orange-600">Voll abgeschrieben</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {asset.annualDepreciation.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          asset.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                          asset.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {STATUS_LABELS[asset.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedAsset(asset)}
                          className="text-emerald-600 hover:text-emerald-900 mr-3"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Löschen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedAsset) && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedAsset(null)
          }}
          onSave={() => {
            fetchAssets()
            setShowCreateModal(false)
            setSelectedAsset(null)
          }}
        />
      )}
    </div>
  )
}

// Asset Create/Edit Modal Component
function AssetModal({ 
  asset, 
  onClose, 
  onSave 
}: { 
  asset: Asset | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    description: asset?.description || '',
    category: asset?.category || 'EQUIPMENT',
    acquisitionCost: asset?.acquisitionCost || 0,
    acquisitionDate: asset?.acquisitionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    usefulLife: asset?.usefulLife || 3,
    costCenter: asset?.costCenter || 'ADMIN',
    location: asset?.location || '',
    serialNumber: asset?.serialNumber || '',
    manufacturer: asset?.manufacturer || '',
    model: asset?.model || '',
    status: asset?.status || 'ACTIVE'
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const assetData = {
        ...formData,
        acquisitionCost: parseFloat(formData.acquisitionCost.toString()),
        usefulLife: parseInt(formData.usefulLife.toString())
      }

      const response = await fetch('/api/admin/procurement/assets', {
        method: asset ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asset ? { ...assetData, id: asset.id } : assetData)
      })

      if (response.ok) {
        onSave()
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {asset ? 'Anlagegut bearbeiten' : 'Neues Anlagegut erfassen'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bezeichnung *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategorie *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kostenstelle *
              </label>
              <select
                required
                value={formData.costCenter}
                onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {Object.entries(COST_CENTER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anschaffungskosten (€) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.acquisitionCost}
                onChange={(e) => setFormData({ ...formData, acquisitionCost: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anschaffungsdatum *
              </label>
              <input
                type="date"
                required
                value={formData.acquisitionDate}
                onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nutzungsdauer (Jahre) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="50"
                value={formData.usefulLife}
                onChange={(e) => setFormData({ ...formData, usefulLife: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                AfA/Jahr: {(formData.acquisitionCost / formData.usefulLife).toFixed(2)} €
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standort
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="z.B. Büro München, Raum 301"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hersteller
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modell
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seriennummer
              </label>
              <input
                type="text"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Speichern...' : asset ? 'Änderungen speichern' : 'Anlagegut erfassen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
