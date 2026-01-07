'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface ChartOfAccount {
  id: string
  accountNumber: string
  accountName: string
  accountType: string
  skrType: string
  isActive: boolean
}

export default function KontenplanPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    accountType: 'EXPENSE' as 'ASSET' | 'LIABILITY' | 'REVENUE' | 'EXPENSE',
    description: ''
  })

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

    fetchAccounts()
  }, [session, status, router])

  const fetchAccounts = async () => {
    try {
      const params = new URLSearchParams()
      if (filter) params.append('search', filter)
      if (typeFilter) params.append('type', typeFilter)

      const response = await fetch(`/api/admin/accounting/accounts?${params}`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data.accounts || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setLoading(true)
    fetchAccounts()
  }

  const handleCreate = async () => {
    if (!formData.accountNumber || !formData.accountName) {
      alert('Bitte Kontonummer und Kontobezeichnung eingeben')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setFormData({
          accountNumber: '',
          accountName: '',
          accountType: 'EXPENSE',
          description: ''
        })
        fetchAccounts()
        alert('Konto erfolgreich erstellt!')
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Erstellen des Kontos')
      }
    } catch (error) {
      console.error('Error creating account:', error)
      alert('Fehler beim Erstellen des Kontos')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (accountId: string, accountNumber: string) => {
    if (!confirm(`Möchten Sie das Konto ${accountNumber} wirklich löschen?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/accounting/accounts?id=${accountId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Löschen')
      }

      alert('Konto erfolgreich gelöscht')
      fetchAccounts()
    } catch (error: any) {
      alert('Fehler: ' + error.message)
    }
  }

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return 'bg-blue-100 text-blue-800'
      case 'LIABILITY': return 'bg-red-100 text-red-800'
      case 'REVENUE': return 'bg-green-100 text-green-800'
      case 'EXPENSE': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSET': return 'Aktiva'
      case 'LIABILITY': return 'Passiva'
      case 'REVENUE': return 'Erlöse'
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href="/admin/buchhaltung" 
                className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
              >
                ← Zurück zur Buchhaltung
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Kontenplan (SKR04)
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Standardkontenrahmen Abschlussgliederungsprinzip
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Neues Konto
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suche
              </label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Kontonummer oder -name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontoart
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Alle</option>
                <option value="ASSET">Aktiva</option>
                <option value="LIABILITY">Passiva</option>
                <option value="REVENUE">Erlöse</option>
                <option value="EXPENSE">Aufwand</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Suchen
              </button>
            </div>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontonummer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontobezeichnung
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kontoart
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKR-Typ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      Keine Konten gefunden
                    </td>
                  </tr>
                ) : (
                  accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {account.accountNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {account.accountName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAccountTypeColor(account.accountType)}`}>
                          {getAccountTypeLabel(account.accountType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {account.skrType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {account.isActive ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            Aktiv
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            Inaktiv
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(account.id, account.accountNumber)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Konto entfernen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <strong>SKR04-Kontenrahmen:</strong>
              <ul className="mt-2 space-y-1">
                <li>• <strong>0xxx:</strong> Anlagevermögen (Fahrzeuge, Gebäude, BGA)</li>
                <li>• <strong>1xxx:</strong> Umlaufvermögen (Bank, Kasse, Forderungen)</li>
                <li>• <strong>2xxx-3xxx:</strong> Eigenkapital & Fremdkapital</li>
                <li>• <strong>4xxx:</strong> Personalaufwand (Löhne, Gehälter, Provisionen)</li>
                <li>• <strong>6xxx:</strong> Sonstige Aufwendungen (Kfz, Büro, Abschreibungen)</li>
                <li>• <strong>8xxx:</strong> Erlöse (Umsatz, Provisionserlöse)</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Create Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Neues Konto erstellen
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Kontonummer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontonummer * <span className="text-gray-500">(4-stellig)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="z.B. 6850"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Kontobezeichnung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontobezeichnung *
                  </label>
                  <input
                    type="text"
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="z.B. Sonstige betriebliche Aufwendungen"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Kontoart */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontoart *
                  </label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ASSET">Aktiva (Anlagevermögen/Umlaufvermögen)</option>
                    <option value="LIABILITY">Passiva (Eigenkapital/Fremdkapital)</option>
                    <option value="REVENUE">Erlöse (Umsatzerlöse)</option>
                    <option value="EXPENSE">Aufwand (Betriebsausgaben)</option>
                  </select>
                </div>

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    placeholder="Zusätzliche Informationen zum Konto..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Hinweis */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-700">
                      <strong>Hinweis:</strong> Bitte achten Sie auf die korrekte Kontenklasse:
                      <ul className="mt-2 space-y-1 text-xs">
                        <li>• <strong>0xxx:</strong> Anlagevermögen</li>
                        <li>• <strong>1xxx:</strong> Umlaufvermögen (Bank, Kasse)</li>
                        <li>• <strong>4xxx:</strong> Personalaufwand</li>
                        <li>• <strong>6xxx:</strong> Sonstige Aufwendungen</li>
                        <li>• <strong>8xxx:</strong> Erlöse</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  disabled={saving}
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? 'Erstelle...' : 'Konto erstellen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
