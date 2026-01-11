'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Star, Trash2, RefreshCw } from 'lucide-react'

interface Account {
  id: string
  accountNumber: string
  accountName: string
  accountType: 'REVENUE' | 'EXPENSE' | 'ASSET' | 'LIABILITY'
}

interface BookingTemplate {
  id: string
  name: string
  description: string
  debitAccount: string
  creditAccount: string
  amount: number
  useCount: number
}

export default function ManuelleBuchungPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [templates, setTemplates] = useState<BookingTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [autocompleteResults, setAutocompleteResults] = useState<BookingTemplate[]>([])
  const [showTemplateList, setShowTemplateList] = useState(false)
  const autocompleteRef = useRef<HTMLDivElement>(null)

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
    loadAccounts()
    loadTemplates()
  }, [session, status, router])

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/admin/accounting/templates')
      if (!res.ok) throw new Error('Fehler beim Laden der Vorlagen')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error('Error loading templates:', err)
    }
  }

  const searchTemplates = async (query: string) => {
    if (!query || query.length < 2) {
      setAutocompleteResults([])
      setShowAutocomplete(false)
      return
    }

    try {
      const res = await fetch(`/api/admin/accounting/templates?search=${encodeURIComponent(query)}`)
      if (!res.ok) return
      const data = await res.json()
      setAutocompleteResults(data.templates || [])
      setShowAutocomplete(data.templates.length > 0)
    } catch (err) {
      console.error('Error searching templates:', err)
    }
  }

  const loadTemplate = async (template: BookingTemplate) => {
    // Find accounts by account number (4-digit)
    const debitAcc = accounts.find(a => a.accountNumber === template.debitAccount)
    const creditAcc = accounts.find(a => a.accountNumber === template.creditAccount)

    setFormData({
      ...formData,
      debitAccountId: debitAcc?.id || '',
      creditAccountId: creditAcc?.id || '',
      amount: template.amount.toString(),
      description: template.description,
    })

    setShowAutocomplete(false)

    // Increment use count
    try {
      await fetch(`/api/admin/accounting/templates/${template.id}`, { method: 'POST' })
      loadTemplates() // Refresh list
    } catch (err) {
      console.error('Error updating template use count:', err)
    }
  }

  const deleteTemplate = async (id: string) => {
    if (!confirm('Möchten Sie diese Vorlage wirklich löschen?')) return

    try {
      const res = await fetch(`/api/admin/accounting/templates/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Fehler beim Löschen')
      loadTemplates()
    } catch (err: any) {
      alert(err.message || 'Fehler beim Löschen der Vorlage')
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

      // Save as template if requested
      if (saveAsTemplate) {
        const debitAcc = accounts.find(a => a.id === formData.debitAccountId)
        const creditAcc = accounts.find(a => a.id === formData.creditAccountId)

        await fetch('/api/admin/accounting/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.description,
            description: formData.description,
            debitAccount: debitAcc?.accountNumber,
            creditAccount: creditAcc?.accountNumber,
            amount: parseFloat(formData.amount),
          }),
        })
      }

      // Create booking
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
        <div className="flex items-center justify-between">
          <div>
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
        </div>
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

          {/* Description with Autocomplete */}
          <div className="mb-6 relative" ref={autocompleteRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung * <span className="text-xs text-gray-500">(Tippen Sie für Vorschläge)</span>
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
                searchTemplates(e.target.value)
              }}
              onFocus={(e) => searchTemplates(e.target.value)}
              placeholder="z.B. Büromaterial Einkauf bei XY GmbH"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Autocomplete Dropdown */}
            {showAutocomplete && autocompleteResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {autocompleteResults.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => loadTemplate(template)}
                    className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-600">{template.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {template.debitAccount} → {template.creditAccount} | {template.amount.toFixed(2)} €
                        </div>
                      </div>
                      <div className="ml-4 flex items-center text-xs text-gray-500">
                        <RefreshCw className="w-3 h-3 mr-1" />
                        {template.useCount}x
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
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

          {/* Save as Template */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsTemplate}
                onChange={(e) => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="flex items-center text-sm font-medium text-gray-900">
                <Star className="w-4 h-4 mr-2 text-yellow-600" />
                Als Vorlage speichern (verwendet Beschreibung als Name)
              </span>
            </label>
            {templates.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTemplateList(!showTemplateList)}
                className="mt-3 w-full px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg border border-yellow-300 flex items-center justify-center gap-2 transition-colors"
              >
                <Star className="w-4 h-4" />
                {showTemplateList ? 'Vorlagen ausblenden' : `${templates.length} Vorlagen anzeigen`}
              </button>
            )}
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

      {/* Saved Templates List */}
      {templates.length > 0 && showTemplateList && (
        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-600" />
            Gespeicherte Vorlagen ({templates.length})
          </h2>
          <div className="space-y-2">
            {templates.slice(0, 10).map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => loadTemplate(template)}
                  className="flex-1 text-left"
                >
                  <div className="font-medium text-gray-900">{template.name}</div>
                  <div className="text-sm text-gray-600">
                    {template.debitAccount} → {template.creditAccount} | {template.amount.toFixed(2)} €
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    {template.useCount}x verwendet
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => deleteTemplate(template.id)}
                  className="ml-4 text-red-600 hover:text-red-700"
                  title="Vorlage löschen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">💡 Hinweise zur Buchung</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
          <li><strong>Soll-Konto:</strong> Empfänger (Wo landet das Geld?)</li>
          <li><strong>Haben-Konto:</strong> Quelle (Woher kommt das Geld?)</li>
          <li>Beispiel: Bank (Soll) / Provisionserlös (Haben) = Geld kommt auf Bank-Konto</li>
          <li><strong>Vorlagen:</strong> Wiederkehrende Buchungen als Vorlage speichern für schnellere Erfassung</li>
          <li>Die Buchung erhält automatisch eine fortlaufende Belegnummer (BEL-YYYY-NNNNNN)</li>
        </ul>
      </div>
    </div>
  )
}
