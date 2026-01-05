'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Expense {
  id: string
  category: string
  amount: number
  vatAmount?: number
  vatRate?: number
  date: string
  description: string
  merchant?: string
  receiptUrl?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID'
  approvedBy?: {
    firstName: string
    lastName: string
  }
  approvedAt?: string
  rejectionNote?: string
  projectName?: string
  customerName?: string
  createdAt: string
}

interface ExpenseStats {
  total: number
  pending: number
  approved: number
  rejected: number
  totalAmount: number
  pendingAmount: number
}

const categoryLabels: Record<string, string> = {
  MEAL: 'Essen & Trinken',
  HOTEL: 'Übernachtung',
  TRAVEL: 'Fahrtkosten',
  FUEL: 'Tankkosten',
  TOOLS: 'Werkzeug/Material',
  OFFICE: 'Büromaterial',
  PHONE: 'Telefon/Internet',
  OTHER: 'Sonstiges',
}

const statusLabels: Record<string, string> = {
  PENDING: 'Wartend',
  APPROVED: 'Genehmigt',
  REJECTED: 'Abgelehnt',
  PAID: 'Ausgezahlt',
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PAID: 'bg-blue-100 text-blue-800',
}

export default function SpesenPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  
  // Formular-Daten
  const [formData, setFormData] = useState({
    category: 'MEAL',
    amount: '',
    vatAmount: '',
    vatRate: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    merchant: '',
    receiptFile: null as File | null,
    receiptUrl: '',
    projectName: '',
    customerName: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session) {
      fetchExpenses()
    }
  }, [status, session, router, filterStatus])

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams()
      if (filterStatus) params.append('status', filterStatus)
      
      const res = await fetch(`/api/employee/expenses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    const formDataUpload = new FormData()
    formDataUpload.append('receipt', file)

    try {
      const res = await fetch('/api/employee/expenses/upload-receipt', {
        method: 'POST',
        body: formDataUpload,
      })

      if (res.ok) {
        const data = await res.json()
        setFormData((prev) => ({
          ...prev,
          receiptFile: file,
          receiptUrl: data.receiptUrl,
        }))
        alert('Beleg erfolgreich hochgeladen!')
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Hochladen')
      }
    } catch (error) {
      console.error('Error uploading receipt:', error)
      alert('Fehler beim Hochladen des Belegs')
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch('/api/employee/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: formData.category,
          amount: formData.amount,
          vatAmount: formData.vatAmount || null,
          vatRate: formData.vatRate || null,
          date: formData.date,
          description: formData.description,
          merchant: formData.merchant || null,
          receiptUrl: formData.receiptUrl || null,
          projectName: formData.projectName || null,
          customerName: formData.customerName || null,
        }),
      })

      if (res.ok) {
        alert('Spese erfolgreich eingereicht!')
        setShowForm(false)
        setFormData({
          category: 'MEAL',
          amount: '',
          vatAmount: '',
          vatRate: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          merchant: '',
          receiptFile: null,
          receiptUrl: '',
          projectName: '',
          customerName: '',
        })
        fetchExpenses()
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Einreichen')
      }
    } catch (error) {
      console.error('Error submitting expense:', error)
      alert('Fehler beim Einreichen der Spese')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Spesen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Link
              href="/mitarbeiter"
              className="text-blue-600 hover:text-blue-700 mb-2 inline-block"
            >
              ← Zurück zum Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">
              💰 Spesenverwaltung
            </h1>
            <p className="text-gray-600 mt-1">
              Reichen Sie Ihre Ausgaben ein und verfolgen Sie den Status
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? '❌ Abbrechen' : '➕ Neue Spese'}
          </button>
        </div>
      </div>

      {/* Statistiken */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Gesamt</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">
              {stats.totalAmount.toFixed(2)} €
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg shadow">
            <div className="text-sm text-yellow-800">Wartend</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
            <div className="text-sm text-yellow-700">
              {stats.pendingAmount.toFixed(2)} €
            </div>
          </div>
          <div className="bg-green-50 p-6 rounded-lg shadow">
            <div className="text-sm text-green-800">Genehmigt</div>
            <div className="text-2xl font-bold text-green-900">{stats.approved}</div>
          </div>
          <div className="bg-red-50 p-6 rounded-lg shadow">
            <div className="text-sm text-red-800">Abgelehnt</div>
            <div className="text-2xl font-bold text-red-900">{stats.rejected}</div>
          </div>
        </div>
      )}

      {/* Formular */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Neue Spese einreichen</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Datum *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Betrag (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MwSt.-Satz (%)
                </label>
                <select
                  value={formData.vatRate}
                  onChange={(e) => {
                    const rate = e.target.value
                    const amount = parseFloat(formData.amount) || 0
                    const vatAmount = rate
                      ? ((amount * parseInt(rate)) / (100 + parseInt(rate))).toFixed(2)
                      : ''
                    setFormData({
                      ...formData,
                      vatRate: rate,
                      vatAmount,
                    })
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Keine MwSt.</option>
                  <option value="7">7%</option>
                  <option value="19">19%</option>
                </select>
              </div>

              {formData.vatRate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    MwSt.-Betrag (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.vatAmount}
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Händler/Lieferant
                </label>
                <input
                  type="text"
                  value={formData.merchant}
                  onChange={(e) =>
                    setFormData({ ...formData, merchant: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="z.B. REWE, Shell, Amazon"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={3}
                placeholder="Wofür war die Ausgabe?"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projekt (optional)
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData({ ...formData, projectName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Projektname"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kunde (optional)
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Kundenname"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beleg hochladen
              </label>
              <input
                type="file"
                onChange={handleReceiptUpload}
                accept="image/*,application/pdf"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                disabled={uploadingReceipt}
              />
              {uploadingReceipt && (
                <p className="text-sm text-blue-600 mt-1">Wird hochgeladen...</p>
              )}
              {formData.receiptUrl && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Beleg hochgeladen
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {submitting ? 'Wird eingereicht...' : 'Einreichen'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nach Status filtern:
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-lg ${
              filterStatus === ''
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Alle
          </button>
          {Object.entries(statusLabels).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-4 py-2 rounded-lg ${
                filterStatus === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Spesen-Liste */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Meine Spesen</h2>
          {expenses.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              Noch keine Spesen eingereicht
            </p>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-medium text-lg">
                          {categoryLabels[expense.category]}
                        </span>
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            statusColors[expense.status]
                          }`}
                        >
                          {statusLabels[expense.status]}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">{expense.description}</p>
                      {expense.merchant && (
                        <p className="text-sm text-gray-500">
                          🏪 {expense.merchant}
                        </p>
                      )}
                      {expense.projectName && (
                        <p className="text-sm text-gray-500">
                          📋 Projekt: {expense.projectName}
                        </p>
                      )}
                      {expense.customerName && (
                        <p className="text-sm text-gray-500">
                          👤 Kunde: {expense.customerName}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Datum: {new Date(expense.date).toLocaleDateString('de-DE')}
                      </p>
                      {expense.approvedBy && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Genehmigt von {expense.approvedBy.firstName}{' '}
                          {expense.approvedBy.lastName}
                        </p>
                      )}
                      {expense.rejectionNote && (
                        <p className="text-xs text-red-600 mt-1">
                          ✗ Abgelehnt: {expense.rejectionNote}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {expense.amount.toFixed(2)} €
                      </div>
                      {expense.vatRate && (
                        <div className="text-sm text-gray-500">
                          inkl. {expense.vatRate}% MwSt.
                        </div>
                      )}
                      {expense.receiptUrl && (
                        <a
                          href={expense.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                        >
                          📄 Beleg ansehen
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Link zu Reisekosten */}
      <div className="mt-6 text-center">
        <Link
          href="/mitarbeiter/reisekosten"
          className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
        >
          ✈️ Zur Reisekostenabrechnung
        </Link>
      </div>
    </div>
  )
}
