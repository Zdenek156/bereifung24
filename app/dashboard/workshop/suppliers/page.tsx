'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'

interface Supplier {
  id: string
  supplier: string
  name: string
  isActive: boolean
  autoOrder: boolean
  priority: number
  lastApiCheck: string | null
  lastApiError: string | null
  apiCallsToday: number
  createdAt: string
  updatedAt: string
}

export default function SuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    supplier: 'TYRESYSTEM',
    name: 'TyreSystem GmbH',
    username: '',
    password: '',
    autoOrder: false,
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }
    fetchSuppliers()
  }, [session, status, router])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/workshop/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSupplier = async () => {
    if (!formData.username || !formData.password) {
      alert('Bitte Benutzername und Passwort eingeben')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/workshop/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        alert('Lieferant erfolgreich gespeichert')
        setShowAddForm(false)
        setFormData({
          supplier: 'TYRESYSTEM',
          name: 'TyreSystem GmbH',
          username: '',
          password: '',
          autoOrder: false,
        })
        fetchSuppliers()
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const response = await fetch('/api/workshop/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: supplier.supplier,
          isActive: !supplier.isActive,
        }),
      })

      if (response.ok) {
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Error toggling supplier:', error)
    }
  }

  const handleToggleAutoOrder = async (supplier: Supplier) => {
    try {
      const response = await fetch('/api/workshop/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier: supplier.supplier,
          autoOrder: !supplier.autoOrder,
        }),
      })

      if (response.ok) {
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Error toggling auto-order:', error)
    }
  }

  const handleDeleteSupplier = async (supplier: Supplier) => {
    if (!confirm(`Möchten Sie ${supplier.name} wirklich löschen?`)) return

    try {
      const response = await fetch(`/api/workshop/suppliers?supplier=${supplier.supplier}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('Lieferant gelöscht')
        fetchSuppliers()
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
    }
  }

  const testConnection = async (supplier: Supplier) => {
    try {
      // Call test API endpoint
      const response = await fetch(`/api/admin/tyresystem/test?action=inquiry`)
      if (response.ok) {
        alert('✅ Verbindung erfolgreich!')
      } else {
        alert('❌ Verbindung fehlgeschlagen')
      }
    } catch (error) {
      alert('❌ Verbindungsfehler')
    }
  }

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center">Lade...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reifenhändler & Lieferanten</h1>
              <p className="mt-2 text-sm text-gray-600">
                Verwalten Sie Ihre Lieferanten-Zugangsdaten und Bestelleinstellungen
              </p>
            </div>
            <Link href="/dashboard/workshop">
              <Button variant="outline">← Zurück zum Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Box */}
        <Card className="p-6 bg-blue-50 border-blue-200 mb-6">
          <div className="flex gap-3">
            <div className="text-blue-600 text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Wichtige Hinweise:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Automatisch bestellen:</strong> Reifen werden bei Kundenbuchung automatisch beim Lieferanten bestellt</li>
                <li>• <strong>Preisgarantie:</strong> Bei automatischer Bestellung gilt der Preis zum Zeitpunkt der Buchung</li>
                <li>• <strong>Manuelle Bestellung:</strong> Ohne Auto-Order können sich Preise bis zur manuellen Bestellung ändern</li>
                <li>• <strong>Sicherheit:</strong> Zugangsdaten werden verschlüsselt gespeichert (AES-256)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Add Button */}
        {!showAddForm && suppliers.length === 0 && (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🚚</div>
            <h2 className="text-2xl font-bold mb-2">Noch keine Lieferanten konfiguriert</h2>
            <p className="text-gray-600 mb-6">
              Fügen Sie Ihren ersten Lieferanten hinzu, um Reifen direkt über die Plattform zu bestellen
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Lieferant hinzufügen
            </Button>
          </Card>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Lieferant hinzufügen</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Lieferant</label>
                <select
                  value={formData.supplier}
                  onChange={(e) => {
                    const supplier = e.target.value
                    setFormData({
                      ...formData,
                      supplier,
                      name: supplier === 'TYRESYSTEM' ? 'TyreSystem GmbH' : supplier,
                    })
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="TYRESYSTEM">TyreSystem</option>
                  {/* Später mehr Lieferanten hinzufügen */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Anzeigename</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="z.B. TyreSystem GmbH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Benutzername</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ihr TyreSystem Benutzername"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Passwort</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg pr-12"
                    placeholder="Ihr TyreSystem Passwort"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Wird verschlüsselt gespeichert (AES-256)
                </p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="autoOrder"
                  checked={formData.autoOrder}
                  onChange={(e) => setFormData({ ...formData, autoOrder: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="autoOrder" className="text-sm font-medium cursor-pointer">
                  Reifen automatisch bei Buchung bestellen
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveSupplier}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    'Speichern'
                  )}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Suppliers List */}
        {suppliers.length > 0 && (
          <div className="space-y-4">
            {!showAddForm && (
              <div className="flex justify-end mb-4">
                <Button onClick={() => setShowAddForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Weiteren Lieferanten hinzufügen
                </Button>
              </div>
            )}

            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold">{supplier.name}</h3>
                      {supplier.isActive ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Aktiv
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Inaktiv
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Automatische Bestellung:</span>
                        <div className="mt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={supplier.autoOrder}
                              onChange={() => handleToggleAutoOrder(supplier)}
                              className="w-4 h-4"
                            />
                            <span className="font-medium">
                              {supplier.autoOrder ? 'Aktiviert ✅' : 'Deaktiviert'}
                            </span>
                          </label>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">API-Aufrufe heute:</span>
                        <p className="font-medium">{supplier.apiCallsToday}</p>
                      </div>

                      {supplier.lastApiCheck && (
                        <div>
                          <span className="text-gray-600">Letzte erfolgreiche Verbindung:</span>
                          <p className="font-medium">
                            {new Date(supplier.lastApiCheck).toLocaleString('de-DE')}
                          </p>
                        </div>
                      )}

                      {supplier.lastApiError && (
                        <div className="col-span-2">
                          <span className="text-red-600">Letzter Fehler:</span>
                          <p className="text-red-800 font-medium text-xs mt-1">
                            {supplier.lastApiError}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection(supplier)}
                      variant="outline"
                      size="sm"
                    >
                      Verbindung testen
                    </Button>
                    <Button
                      onClick={() => handleToggleActive(supplier)}
                      variant="outline"
                      size="sm"
                    >
                      {supplier.isActive ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    <Button
                      onClick={() => handleDeleteSupplier(supplier)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
