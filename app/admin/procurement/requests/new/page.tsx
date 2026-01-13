'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Supplier {
  id: string
  name: string
}

export default function NewRequestPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'GWG',
    estimatedPrice: '',
    urgency: 'NORMAL',
    costCenter: 'IT',
    supplierId: '',
    justification: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE')) {
      router.push('/admin')
      return
    }
    fetchSuppliers()
  }, [session, status, router])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/admin/procurement/suppliers')
      const data = await response.json()
      if (response.ok) {
        setSuppliers(data)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/procurement/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimatedPrice: parseFloat(formData.estimatedPrice),
          supplierId: formData.supplierId || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Anfrage erstellt!')
        router.push(`/admin/procurement/requests/${data.id}`)
      } else {
        alert('Fehler beim Erstellen')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler beim Erstellen')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/admin/procurement/requests" className="text-sm text-gray-600 hover:text-gray-900">← Zurück</Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">Neue Bedarfsanforderung</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Titel *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="z.B. Laptop für Entwickler"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Detaillierte Beschreibung des Bedarfs..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie *</label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="GWG">GWG (≤800€)</option>
                <option value="SAMMELPOSTEN">Sammelposten (≤1.000€)</option>
                <option value="ANLAGEVERMOEGEN">Anlagevermögen (>1.000€)</option>
                <option value="VERBRAUCHSMATERIAL">Verbrauchsmaterial</option>
                <option value="DIENSTLEISTUNG">Dienstleistung</option>
                <option value="SOFTWARE_LIZENZ">Software-Lizenz</option>
                <option value="HARDWARE">Hardware</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Geschätzter Preis (€) *</label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.estimatedPrice}
                onChange={(e) => setFormData({ ...formData, estimatedPrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dringlichkeit *</label>
              <select
                required
                value={formData.urgency}
                onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="LOW">Niedrig</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kostenstelle *</label>
              <select
                required
                value={formData.costCenter}
                onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="MARKETING">Marketing</option>
                <option value="SUPPORT">Support</option>
                <option value="IT">IT</option>
                <option value="BUCHHALTUNG">Buchhaltung</option>
                <option value="PERSONAL">Personal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lieferant (optional)</label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Noch nicht festgelegt</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Begründung</label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Warum wird dieser Bedarf benötigt?"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Anfragen unter 250€ werden automatisch genehmigt. 
              Anfragen über 1.000€ erfordern eine Investitionsplanung.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? 'Wird erstellt...' : 'Anfrage erstellen'}
            </button>
            <Link
              href="/admin/procurement/requests"
              className="px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
