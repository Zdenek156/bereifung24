'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Supplier {
  id: string
  name: string
  email: string
  phone: string | null
  website: string | null
  categories: string[]
  contactPerson: string | null
  address: string | null
  zipCode: string | null
  city: string | null
  country: string | null
  taxId: string | null
  iban: string | null
  paymentTerms: string | null
  notes: string | null
  isActive: boolean
  rating: number | null
  _count: {
    orders: number
  }
}

export default function SuppliersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [ratingSupplier, setRatingSupplier] = useState<Supplier | null>(null)
  const [newRating, setNewRating] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    category: 'HARDWARE',
    contactPerson: '',
    street: '',
    postalCode: '',
    city: '',
    country: 'Deutschland',
    taxId: '',
    iban: '',
    paymentTermDays: '30',
    notes: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
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
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auto-add https:// to website if no protocol specified
    let websiteUrl = formData.website.trim()
    if (websiteUrl && !websiteUrl.match(/^https?:\/\//i)) {
      websiteUrl = 'https://' + websiteUrl
    }
    
    try {
      // Map form fields to Prisma schema fields
      const supplierData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        website: websiteUrl,
        categories: [formData.category || 'HARDWARE'], // Schema expects array, ensure not null
        address: formData.street,
        zipCode: formData.postalCode,
        city: formData.city,
        country: formData.country,
        taxId: formData.taxId,
        iban: formData.iban,
        paymentTerms: `${formData.paymentTermDays} Tage netto`,
        notes: formData.notes
      }
      
      const url = editingSupplier 
        ? `/api/admin/procurement/suppliers?id=${editingSupplier.id}`
        : '/api/admin/procurement/suppliers'
      
      const response = await fetch(url, {
        method: editingSupplier ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert(editingSupplier ? 'Lieferant aktualisiert!' : 'Lieferant erstellt!')
        setShowAddForm(false)
        setEditingSupplier(null)
        setFormData({
          name: '',
          email: '',
          phone: '',
          website: '',
          category: 'HARDWARE',
          contactPerson: '',
          street: '',
          postalCode: '',
          city: '',
          country: 'Deutschland',
          taxId: '',
          iban: '',
          paymentTermDays: '30',
          notes: ''
        })
        fetchSuppliers()
      } else {
        console.error('API Error:', data)
        alert(`Fehler: ${data.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler beim Erstellen: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'))
    }
  }

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier)
    
    // Extract payment term days from text like "30 Tage netto"
    const paymentDays = supplier.paymentTerms?.match(/\d+/)?.[0] || '30'
    
    const category = supplier.categories?.[0] || 'HARDWARE'
    
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone || '',
      website: supplier.website || '',
      category: category,
      contactPerson: supplier.contactPerson || '',
      street: supplier.address || '',
      postalCode: supplier.zipCode || '',
      city: supplier.city || '',
      country: supplier.country || 'Deutschland',
      taxId: supplier.taxId || '',
      iban: supplier.iban || '',
      paymentTermDays: paymentDays,
      notes: supplier.notes || ''
    })
    setShowAddForm(true)
  }

  const handleRate = (supplier: Supplier) => {
    setRatingSupplier(supplier)
    setNewRating(supplier.rating || 0)
    setShowRatingModal(true)
  }

  const submitRating = async () => {
    if (!ratingSupplier) return

    try {
      const response = await fetch(`/api/admin/procurement/suppliers?id=${ratingSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating })
      })

      if (response.ok) {
        alert('Bewertung gespeichert!')
        setShowRatingModal(false)
        setRatingSupplier(null)
        fetchSuppliers()
      } else {
        alert('Fehler beim Speichern der Bewertung')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler beim Speichern der Bewertung')
    }
  }

  const handleToggleActive = async (supplier: Supplier) => {
    try {
      const response = await fetch(`/api/admin/procurement/suppliers?id=${supplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !supplier.isActive })
      })

      if (response.ok) {
        fetchSuppliers()
      } else {
        alert('Fehler beim Aktualisieren des Status')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler beim Aktualisieren des Status')
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lieferanten</h1>
              <p className="mt-1 text-sm text-gray-600">Lieferanten verwalten</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/procurement" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                Zurück
              </Link>
              <button
                onClick={() => {
                  setShowAddForm(!showAddForm)
                  if (showAddForm) {
                    setEditingSupplier(null)
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      website: '',
                      category: 'HARDWARE',
                      contactPerson: '',
                      street: '',
                      postalCode: '',
                      city: '',
                      country: 'Deutschland',
                      taxId: '',
                      iban: '',
                      paymentTermDays: '30',
                      notes: ''
                    })
                  }
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                {showAddForm ? 'Abbrechen' : 'Neuer Lieferant'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingSupplier ? 'Lieferant bearbeiten' : 'Neuer Lieferant'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="HARDWARE">Hardware</option>
                  <option value="SOFTWARE">Software</option>
                  <option value="BUEROAUSSTATTUNG">Büroausstattung</option>
                  <option value="IT_DIENSTLEISTUNG">IT-Dienstleistung</option>
                  <option value="VERBRAUCHSMATERIAL">Verbrauchsmaterial</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">E-Mail *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website (optional)</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="www.beispiel.de"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ansprechpartner</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Straße</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PLZ</label>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stadt</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Land</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zahlungsziel (Tage)</label>
                <input
                  type="number"
                  value={formData.paymentTermDays}
                  onChange={(e) => setFormData({ ...formData, paymentTermDays: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>

            <button type="submit" className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
              {editingSupplier ? 'Lieferant aktualisieren' : 'Lieferant erstellen'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontakt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bestellungen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bewertung</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Lädt...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Keine Lieferanten gefunden</td></tr>
              ) : (
                suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{supplier.categories?.[0] || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{supplier.email}</div>
                      {supplier.phone && <div className="text-xs text-gray-400">{supplier.phone}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{supplier._count.orders}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {supplier.rating ? `${supplier.rating.toFixed(1)} ⭐` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleToggleActive(supplier)}
                        className={`px-2 py-1 text-xs rounded-full cursor-pointer ${supplier.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                      >
                        {supplier.isActive ? 'Aktiv' : 'Inaktiv'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => handleRate(supplier)}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Bewerten"
                      >
                        ⭐
                      </button>
                      <button
                        onClick={() => handleEdit(supplier)}
                        className="text-emerald-600 hover:text-emerald-900"
                        title="Bearbeiten"
                      >
                        Bearbeiten
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Rating Modal */}
      {showRatingModal && ratingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Lieferant bewerten: {ratingSupplier.name}
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Bewertung (1-5 Sterne)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className={`text-3xl ${star <= newRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Aktuelle Bewertung: {newRating} von 5 Sternen
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={submitRating}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Bewertung speichern
              </button>
              <button
                onClick={() => {
                  setShowRatingModal(false)
                  setRatingSupplier(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
