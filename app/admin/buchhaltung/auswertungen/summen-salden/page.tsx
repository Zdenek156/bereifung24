'use client'

import { useState, useEffect } from 'react'
import BackButton from '@/components/BackButton'
import '../print.css'

interface AccountBalance {
  accountNumber: string
  accountName: string
  accountType: string
  debitTotal: number
  creditTotal: number
  balance: number
  debitBalance: number
  creditBalance: number
}

interface SummenSaldenData {
  period: {
    startDate: string
    endDate: string
  }
  accounts: AccountBalance[]
  totals: {
    debitTotal: number
    creditTotal: number
    debitBalance: number
    creditBalance: number
  }
}

export default function SummenSaldenPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<SummenSaldenData | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>('')

  useEffect(() => {
    // Set default to current year
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const yearEnd = new Date(now.getFullYear(), 11, 31)
    
    setStartDate(yearStart.toISOString().split('T')[0])
    setEndDate(yearEnd.toISOString().split('T')[0])
  }, [])

  useEffect(() => {
    if (startDate && endDate) {
      fetchData()
    }
  }, [startDate, endDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate
      })

      const response = await fetch(`/api/admin/accounting/reports/summen-salden?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching Summen- und Saldenliste:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const setQuickPeriod = (type: string) => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (type) {
      case 'currentMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'currentYear':
        start = new Date(now.getFullYear(), 0, 1)
        end = new Date(now.getFullYear(), 11, 31)
        break
      case 'lastYear':
        start = new Date(now.getFullYear() - 1, 0, 1)
        end = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        return
    }

    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }

  const handlePrint = () => {
    window.print()
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

  const filteredAccounts = data?.accounts.filter(acc => {
    if (!filterType) return true
    return acc.accountType === filterType
  }) || []

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Header */}
      <div className="print-only print-header">
        <div className="company-name">Bereifung24</div>
        <h1>Summen- und Saldenliste</h1>
        {data && (
          <div className="period">
            Zeitraum: {new Date(startDate).toLocaleDateString('de-DE')} - {new Date(endDate).toLocaleDateString('de-DE')}
          </div>
        )}
        <div style={{ fontSize: '10pt', marginTop: '5px', color: '#666' }}>
          Erstellt am: {new Date().toLocaleDateString('de-DE')} um {new Date().toLocaleTimeString('de-DE')}
        </div>
      </div>

      <header className="bg-white shadow-sm border-b border-gray-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <BackButton />
              <h1 className="text-3xl font-bold text-gray-900">
                Summen- und Saldenliste
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Übersicht aller Konten mit Umsätzen und Salden
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print-container">
        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 no-print">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Zeitraum auswählen</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bis
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontoart
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Alle</option>
                <option value="ASSET">Aktiva</option>
                <option value="LIABILITY">Passiva</option>
                <option value="REVENUE">Erlöse</option>
                <option value="EXPENSE">Aufwand</option>
              </select>
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setQuickPeriod('currentMonth')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Aktueller Monat
            </button>
            <button
              onClick={() => setQuickPeriod('lastMonth')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Letzter Monat
            </button>
            <button
              onClick={() => setQuickPeriod('currentYear')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Aktuelles Jahr
            </button>
            <button
              onClick={() => setQuickPeriod('lastYear')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Letztes Jahr
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-4 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Drucken / PDF
          </button>
        </div>

        {/* Report */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Daten...</p>
          </div>
        ) : data ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900">
                Summen- und Saldenliste
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Zeitraum: {new Date(data.period.startDate).toLocaleDateString('de-DE')} - {new Date(data.period.endDate).toLocaleDateString('de-DE')}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Anzahl Konten: {filteredAccounts.length}
              </p>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Konto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Kontobezeichnung
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Art
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Soll-Summe
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Haben-Summe
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Soll-Saldo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Haben-Saldo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAccounts.map((account) => (
                    <tr key={account.accountNumber} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {account.accountNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {account.accountName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {getAccountTypeLabel(account.accountType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {account.debitTotal > 0 ? formatCurrency(account.debitTotal) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {account.creditTotal > 0 ? formatCurrency(account.creditTotal) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                        {account.debitBalance > 0 ? formatCurrency(account.debitBalance) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        {account.creditBalance > 0 ? formatCurrency(account.creditBalance) : '-'}
                      </td>
                    </tr>
                  ))}

                  {/* Totals */}
                  <tr className="bg-gray-100 font-bold border-t-2 border-gray-900">
                    <td colSpan={3} className="px-4 py-4 text-sm text-gray-900">
                      SUMMEN
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(data.totals.debitTotal)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                      {formatCurrency(data.totals.creditTotal)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-blue-700">
                      {formatCurrency(data.totals.debitBalance)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-green-700">
                      {formatCurrency(data.totals.creditBalance)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Info Box */}
            <div className="p-6 bg-blue-50 border-t border-blue-200 no-print">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Hinweis zur Summen- und Saldenliste</p>
                  <p>
                    Die Summen- und Saldenliste zeigt alle Konten mit ihren Umsätzen (Soll- und Haben-Summe) 
                    sowie den daraus resultierenden Salden für den gewählten Zeitraum. Die Soll- und Haben-Summen 
                    müssen gleich sein (doppelte Buchführung). Die Salden zeigen die Position jedes Kontos am Ende 
                    des Zeitraums.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

