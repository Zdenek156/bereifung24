'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import {
  Ticket,
  Plus,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit,
  Copy,
  X,
  Check,
  Loader2,
  Percent,
  Euro,
  Users,
  TrendingDown,
  Calendar,
  Gift,
  History,
  AlertCircle
} from 'lucide-react'

interface Coupon {
  id: string
  code: string
  description: string | null
  type: string
  value: number
  minOrderValue: number | null
  maxDiscount: number | null
  maxUsages: number | null
  usedCount: number
  maxUsagesPerUser: number
  validFrom: string
  validUntil: string | null
  isActive: boolean
  costBearer: string
  createdAt: string
  _count: { usages: number }
}

interface CouponUsage {
  id: string
  couponId: string
  customerId: string | null
  bookingId: string | null
  originalAmount: number
  discountAmount: number
  finalAmount: number
  redeemedAt: string
  coupon: { code: string; type: string; value: number }
  customer: { firstName: string; lastName: string; email: string } | null
}

interface Stats {
  totalCoupons: number
  activeCoupons: number
  totalUsages: number
  totalDiscountGiven: number
}

interface CouponForm {
  code: string
  description: string
  type: 'PERCENTAGE' | 'FIXED'
  value: string
  minOrderValue: string
  maxDiscount: string
  maxUsages: string
  maxUsagesPerUser: string
  validFrom: string
  validUntil: string
  isActive: boolean
  costBearer: 'PLATFORM' | 'WORKSHOP'
}

const defaultForm: CouponForm = {
  code: '',
  description: '',
  type: 'PERCENTAGE',
  value: '',
  minOrderValue: '',
  maxDiscount: '',
  maxUsages: '',
  maxUsagesPerUser: '1',
  validFrom: new Date().toISOString().split('T')[0],
  validUntil: '',
  isActive: true,
  costBearer: 'PLATFORM',
}

export default function GutscheinePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'coupons' | 'usages'>('coupons')
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [usages, setUsages] = useState<CouponUsage[]>([])
  const [stats, setStats] = useState<Stats>({ totalCoupons: 0, activeCoupons: 0, totalUsages: 0, totalDiscountGiven: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [form, setForm] = useState<CouponForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchCoupons()
  }, [statusFilter])

  useEffect(() => {
    if (activeTab === 'usages') {
      fetchUsages()
    }
  }, [activeTab])

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search) params.set('search', search)
      const response = await fetch(`/api/admin/coupons?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons)
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching coupons:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsages = async () => {
    try {
      const response = await fetch('/api/admin/coupons/usages')
      if (response.ok) {
        const data = await response.json()
        setUsages(data.usages)
      }
    } catch (err) {
      console.error('Error fetching usages:', err)
    }
  }

  const handleSearch = () => {
    fetchCoupons()
  }

  const openCreateDialog = () => {
    setEditingCoupon(null)
    setForm(defaultForm)
    setError('')
    setShowDialog(true)
  }

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type as 'PERCENTAGE' | 'FIXED',
      value: coupon.value.toString(),
      minOrderValue: coupon.minOrderValue?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      maxUsages: coupon.maxUsages?.toString() || '',
      maxUsagesPerUser: coupon.maxUsagesPerUser.toString(),
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      isActive: coupon.isActive,
      costBearer: (coupon.costBearer || 'PLATFORM') as 'PLATFORM' | 'WORKSHOP',
    })
    setError('')
    setShowDialog(true)
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setForm(prev => ({ ...prev, code }))
  }

  const handleSave = async () => {
    if (!form.code.trim()) {
      setError('Gutscheincode ist erforderlich')
      return
    }
    if (!form.value || parseFloat(form.value) <= 0) {
      setError('Rabattwert muss größer als 0 sein')
      return
    }
    if (form.type === 'PERCENTAGE' && parseFloat(form.value) > 100) {
      setError('Prozentwert darf nicht über 100% sein')
      return
    }

    setSaving(true)
    setError('')

    try {
      const url = editingCoupon
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons'
      const method = editingCoupon ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          description: form.description || null,
          type: form.type,
          value: form.value,
          minOrderValue: form.minOrderValue || null,
          maxDiscount: form.maxDiscount || null,
          maxUsages: form.maxUsages || null,
          maxUsagesPerUser: form.maxUsagesPerUser || '1',
          validFrom: form.validFrom,
          validUntil: form.validUntil || null,
          isActive: form.isActive,
          costBearer: form.costBearer,
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Fehler beim Speichern')
        return
      }

      setShowDialog(false)
      fetchCoupons()
    } catch (err) {
      setError('Netzwerkfehler')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}/toggle`, { method: 'POST' })
      if (response.ok) {
        fetchCoupons()
      }
    } catch (err) {
      console.error('Error toggling coupon:', err)
    }
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Gutschein "${coupon.code}" wirklich löschen?`)) return
    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchCoupons()
      }
    } catch (err) {
      console.error('Error deleting coupon:', err)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { label: 'Deaktiviert', color: 'bg-gray-100 text-gray-700' }
    if (coupon.validUntil && new Date(coupon.validUntil) < new Date()) return { label: 'Abgelaufen', color: 'bg-red-100 text-red-700' }
    if (coupon.maxUsages !== null && coupon.usedCount >= coupon.maxUsages) return { label: 'Aufgebraucht', color: 'bg-orange-100 text-orange-700' }
    return { label: 'Aktiv', color: 'bg-green-100 text-green-700' }
  }

  return (
    <PermissionGuard applicationKey="gutscheine">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="mb-2">
                  <BackButton />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Gift className="w-8 h-8 text-primary-600" />
                  Gutschein-Verwaltung
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Gutscheincodes erstellen, verwalten und Nutzung nachverfolgen
                </p>
              </div>
              <button
                onClick={openCreateDialog}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Neuer Gutschein
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Gutscheine gesamt</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{stats.totalCoupons}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aktive Gutscheine</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">{stats.activeCoupons}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Einlösungen</p>
                  <p className="mt-2 text-2xl font-bold text-purple-600">{stats.totalUsages}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rabatt gewährt</p>
                  <p className="mt-2 text-2xl font-bold text-orange-600">{formatPrice(stats.totalDiscountGiven)}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'coupons'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    Gutscheine
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('usages')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'usages'
                      ? 'text-primary-600 border-primary-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Nutzungshistorie
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab: Gutscheine */}
            {activeTab === 'coupons' && (
              <div className="p-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Code oder Beschreibung suchen..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">Alle Status</option>
                    <option value="active">Aktiv</option>
                    <option value="inactive">Deaktiviert</option>
                    <option value="expired">Abgelaufen</option>
                  </select>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Suchen
                  </button>
                </div>

                {/* Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                  </div>
                ) : coupons.length === 0 ? (
                  <div className="text-center py-12">
                    <Gift className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Keine Gutscheine gefunden</p>
                    <button
                      onClick={openCreateDialog}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Ersten Gutschein erstellen →
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Code</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Typ & Wert</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kostenträger</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nutzung</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Gültigkeit</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Aktionen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {coupons.map((coupon) => {
                          const status = getCouponStatus(coupon)
                          return (
                            <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm font-semibold text-gray-900">
                                    {coupon.code}
                                  </code>
                                  <button
                                    onClick={() => copyCode(coupon.code)}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Code kopieren"
                                  >
                                    {copiedCode === coupon.code ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                                {coupon.description && (
                                  <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-1">
                                  {coupon.type === 'PERCENTAGE' ? (
                                    <>
                                      <Percent className="w-4 h-4 text-blue-500" />
                                      <span className="font-semibold text-blue-700">{coupon.value}%</span>
                                    </>
                                  ) : (
                                    <>
                                      <Euro className="w-4 h-4 text-green-500" />
                                      <span className="font-semibold text-green-700">{coupon.value.toFixed(2)} €</span>
                                    </>
                                  )}
                                </div>
                                {coupon.minOrderValue && (
                                  <p className="text-xs text-gray-500 mt-0.5">ab {coupon.minOrderValue.toFixed(2)} €</p>
                                )}
                                {coupon.maxDiscount && (
                                  <p className="text-xs text-gray-500">max. {coupon.maxDiscount.toFixed(2)} €</p>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  coupon.costBearer === 'WORKSHOP' 
                                    ? 'bg-orange-100 text-orange-700' 
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {coupon.costBearer === 'WORKSHOP' ? '🔧 Werkstatt' : '🏢 Bereifung24'}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-sm font-medium">
                                  {coupon.usedCount}{coupon.maxUsages !== null ? ` / ${coupon.maxUsages}` : ''}
                                </span>
                                <p className="text-xs text-gray-500">
                                  max. {coupon.maxUsagesPerUser}x pro Kunde
                                </p>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-sm">
                                  <span className="text-gray-600">ab {formatDate(coupon.validFrom)}</span>
                                </div>
                                {coupon.validUntil ? (
                                  <p className="text-xs text-gray-500">bis {formatDate(coupon.validUntil)}</p>
                                ) : (
                                  <p className="text-xs text-gray-400">unbegrenzt</p>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                  {status.label}
                                </span>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleToggle(coupon)}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                    title={coupon.isActive ? 'Deaktivieren' : 'Aktivieren'}
                                  >
                                    {coupon.isActive ? (
                                      <ToggleRight className="w-5 h-5 text-green-500" />
                                    ) : (
                                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => openEditDialog(coupon)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Bearbeiten"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(coupon)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Löschen"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Nutzungshistorie */}
            {activeTab === 'usages' && (
              <div className="p-6">
                {usages.length === 0 ? (
                  <div className="text-center py-12">
                    <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Noch keine Einlösungen vorhanden</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Datum</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Code</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Kunde</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Ursprungsbetrag</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Rabatt</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Endbetrag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {usages.map((usage) => (
                          <tr key={usage.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 text-sm text-gray-600">
                              {formatDateTime(usage.redeemedAt)}
                            </td>
                            <td className="py-3 px-4">
                              <code className="bg-gray-100 px-2 py-0.5 rounded font-mono text-xs font-semibold">
                                {usage.coupon.code}
                              </code>
                            </td>
                            <td className="py-3 px-4 text-sm">
                              {usage.customer ? (
                                <div>
                                  <span className="font-medium">{usage.customer.firstName} {usage.customer.lastName}</span>
                                  <p className="text-xs text-gray-500">{usage.customer.email}</p>
                                </div>
                              ) : (
                                <span className="text-gray-400">Unbekannt</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-gray-600">
                              {formatPrice(usage.originalAmount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-medium text-green-600">
                              -{formatPrice(usage.discountAmount)}
                            </td>
                            <td className="py-3 px-4 text-sm text-right font-semibold text-gray-900">
                              {formatPrice(usage.finalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Create/Edit Dialog */}
        {showDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingCoupon ? 'Gutschein bearbeiten' : 'Neuer Gutschein'}
                </h2>
                <button onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gutscheincode *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.code}
                      onChange={(e) => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder="z.B. WINTER25"
                      className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase font-mono"
                    />
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      Generieren
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung (intern)</label>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="z.B. Winterkampagne 2026"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* Type & Value */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rabatt-Typ *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'PERCENTAGE' | 'FIXED' }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="PERCENTAGE">Prozent (%)</option>
                      <option value="FIXED">Festbetrag (€)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wert * {form.type === 'PERCENTAGE' ? '(%)' : '(€)'}
                    </label>
                    <input
                      type="number"
                      step={form.type === 'PERCENTAGE' ? '1' : '0.01'}
                      min="0"
                      max={form.type === 'PERCENTAGE' ? '100' : undefined}
                      value={form.value}
                      onChange={(e) => setForm(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={form.type === 'PERCENTAGE' ? 'z.B. 10' : 'z.B. 5.00'}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Min Order Value & Max Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mindestbestellwert (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.minOrderValue}
                      onChange={(e) => setForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                      placeholder="Optional"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  {form.type === 'PERCENTAGE' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max. Rabatt (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.maxDiscount}
                        onChange={(e) => setForm(prev => ({ ...prev, maxDiscount: e.target.value }))}
                        placeholder="Optional"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  )}
                </div>

                {/* Max Usages */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max. Einlösungen (gesamt)</label>
                    <input
                      type="number"
                      min="0"
                      value={form.maxUsages}
                      onChange={(e) => setForm(prev => ({ ...prev, maxUsages: e.target.value }))}
                      placeholder="Unbegrenzt"
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max. pro Kunde</label>
                    <input
                      type="number"
                      min="1"
                      value={form.maxUsagesPerUser}
                      onChange={(e) => setForm(prev => ({ ...prev, maxUsagesPerUser: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                {/* Validity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gültig ab</label>
                    <input
                      type="date"
                      value={form.validFrom}
                      onChange={(e) => setForm(prev => ({ ...prev, validFrom: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gültig bis</label>
                    <input
                      type="date"
                      value={form.validUntil}
                      onChange={(e) => setForm(prev => ({ ...prev, validUntil: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Leer = unbegrenzt</p>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Sofort aktiv</span>
                    <p className="text-xs text-gray-500">Gutschein kann sofort verwendet werden</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary-600' : 'bg-gray-300'}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`}
                    />
                  </button>
                </div>

                {/* Cost Bearer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kostenträger *</label>
                  <p className="text-xs text-gray-500 mb-2">Wer trägt die Kosten des Gutscheins?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, costBearer: 'PLATFORM' }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        form.costBearer === 'PLATFORM'
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">🏢 Bereifung24</div>
                      <p className="text-xs text-gray-500 mt-1">Rabatt wird von der Plattform-Provision abgezogen</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, costBearer: 'WORKSHOP' }))}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        form.costBearer === 'WORKSHOP'
                          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">🔧 Werkstatt</div>
                      <p className="text-xs text-gray-500 mt-1">Rabatt geht zu Lasten der Werkstatt (reduzierte Auszahlung)</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 font-medium rounded-lg transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingCoupon ? 'Aktualisieren' : 'Erstellen'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PermissionGuard>
  )
}
