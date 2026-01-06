'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Account {
  id: string
  accountNumber: string
  accountName: string
  accountType: 'REVENUE' | 'EXPENSE' | 'ASSET' | 'LIABILITY'
}

export default function ManuelleBuchungPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    bookingDate: new Date().toISOString().split('T')[0],
    debitAccountId: '',
    creditAccountId: '',
    amount: '',
    description: '',
    referenceNumber: ''
  })

  const [preview, setPreview] = useState<{
    debitAccount: Account | null
    creditAccount: Account | null
  } | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    // Load accounts
    loadAccounts()
  }, [session, status, router])

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/admin/accounting/accounts')
      if (!res.ok) throw new Error('Fehler beim Laden der Konten')
      const data = await res.json()
      setAccounts(data.accounts || [])
    } catch (err) {
      console.error('Error loading accounts:', err)
      setError('Konten konnten nicht geladen werden')
    }
  }

  // Update preview when accounts are selected
  useEffect(() => {
    if (formData.debitAccountId && formData.creditAccountId) {
      const debit = accounts.find(a => a.id === formData.debitAccountId)
      const credit = accounts.find(a => a.id === formData.creditAccountId)
      setPreview({
        debitAccount: debit || null,
        creditAccount: credit || null
      })
    } else {
      setPreview(null)
    }
  }, [formData.debitAccountId, formData.creditAccountId, accounts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validate
      if (!formData.debitAccountId || !formData.creditAccountId) {
        throw new Error('Bitte beide Konten auswählen')
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Bitte einen gültigen Betrag eingeben')
      }
      if (!formData.description.trim()) {
        throw new Error('Bitte eine Beschreibung eingeben')
      }
      if (formData.debitAccountId === formData.creditAccountId) {
        throw new Error('Soll- und Haben-Konto müssen unterschiedlich sein')
      }

      const res = await fetch('/api/admin/accounting/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingDate: new Date(formData.bookingDate),
          debitAccountId: formData.debitAccountId,
          creditAccountId: formData.creditAccountId,
          amount: parseFloat(formData.amount),
          description: formData.description,
          referenceNumber: formData.referenceNumber || undefined,
          sourceType: 'MANUAL'
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Erstellen der Buchung')
      }

      const data = await res.json()
      
      // Success - redirect to journal
      router.push(`/admin/buchhaltung/journal?highlight=${data.entry.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const accountTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return 'text-blue-600'
      case 'LIABILITY': return 'text-red-600'
      case 'REVENUE': return 'text-green-600'
      case 'EXPENSE': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const accountTypeName = (type: string) => {
    switch (type) {
      case 'ASSET': return 'Aktiva'
      case 'LIABILITY': return 'Passiva'
      case 'REVENUE': return 'Erlös'
      case 'EXPENSE': return 'Aufwand'
      default: return type
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Link 
          href="/admin/buchhaltung"
          className="text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Zurück zur Buchhaltung
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Manuelle Buchung</h1>
        <p className="text-gray-600 mt-2">
          Erstellen Sie eine manuelle Buchung nach dem Soll/Haben-Prinzip (SKR04)
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* Booking Date */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buchungsdatum *
            </label>
            <input
              type="date"
              required
              value={formData.bookingDate}
              onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Betrag (€) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="z.B. 125.50"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Debit Account (Soll) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soll-Konto * <span className="text-gray-500 text-xs">(Wohin geht das Geld?)</span>
            </label>
            <select
              required
              value={formData.debitAccountId}
              onChange={(e) => setFormData({ ...formData, debitAccountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Konto auswählen --</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.accountNumber} - {account.accountName} ({accountTypeName(account.accountType)})
                </option>
              ))}
            </select>
          </div>

          {/* Credit Account (Haben) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Haben-Konto * <span className="text-gray-500 text-xs">(Woher kommt das Geld?)</span>
            </label>
            <select
              required
              value={formData.creditAccountId}
              onChange={(e) => setFormData({ ...formData, creditAccountId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Konto auswählen --</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.accountNumber} - {account.accountName} ({accountTypeName(account.accountType)})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="z.B. Büromaterial Einkauf bei XY GmbH"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Reference Number */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belegnummer (optional)
            </label>
            <input
              type="text"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="z.B. RE-2026-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Preview */}
          {preview && preview.debitAccount && preview.creditAccount && formData.amount && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Vorschau der Buchung:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Datum:</span>
                  <span className="font-medium">{new Date(formData.bookingDate).toLocaleDateString('de-DE')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Betrag:</span>
                  <span className="font-bold text-lg">{parseFloat(formData.amount).toFixed(2)} €</span>
                </div>
                <div className="border-t border-blue-300 pt-2 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-900">Soll:</span>
                    <span className={`${accountTypeColor(preview.debitAccount.accountType)} font-medium`}>
                      {preview.debitAccount.accountNumber} - {preview.debitAccount.accountName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Haben:</span>
                    <span className={`${accountTypeColor(preview.creditAccount.accountType)} font-medium`}>
                      {preview.creditAccount.accountNumber} - {preview.creditAccount.accountName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Erstelle Buchung...' : 'Buchung erstellen'}
            </button>
            <Link
              href="/admin/buchhaltung"
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700 font-medium"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Hinweise zur Buchung</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Soll-Konto:</strong> Empfänger (Wo landet das Geld?)</li>
          <li><strong>Haben-Konto:</strong> Quelle (Woher kommt das Geld?)</li>
          <li>Beispiel: Bank (Soll) / Provisionserlös (Haben) = Geld kommt auf Bank-Konto</li>
          <li>Die Buchung erhält automatisch eine fortlaufende Belegnummer (BEL-YYYY-NNNNNN)</li>
          <li>Alle Buchungen sind GoBD-konform und werden im Audit-Log protokolliert</li>
        </ul>
      </div>
    </div>
  )
}
