'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import '../print.css'

interface UStVAData {
  period: {
    startDate: string
    endDate: string
  }
  ustva: {
    line20_base: number
    line20_vat: number
    line21_base: number
    line21_vat: number
    line22_base: number
    line22_vat: number
    line23_taxFree: number
    line66_inputVat: number
    totalOutputVat: number
    totalInputVat: number
    difference: number
  }
  taxPayable: number
  taxRefund: number
}

export default function UStVAPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<UStVAData | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Set default to current month
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    setStartDate(monthStart.toISOString().split('T')[0])
    setEndDate(monthEnd.toISOString().split('T')[0])
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

      const response = await fetch(`/api/admin/accounting/reports/ustva?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching UStVA:', error)
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
      case 'currentQuarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), quarter * 3, 1)
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        break
      case 'lastQuarter':
        const lastQ = Math.floor(now.getMonth() / 3) - 1
        const year = lastQ < 0 ? now.getFullYear() - 1 : now.getFullYear()
        const q = lastQ < 0 ? 3 : lastQ
        start = new Date(year, q * 3, 1)
        end = new Date(year, (q + 1) * 3, 0)
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

  const handleSendToAccountant = async () => {
    if (!data) return
    
    if (!confirm('UStVA per E-Mail an den Steuerberater senden?')) return
    
    setSending(true)
    try {
      const response = await fetch('/api/admin/accounting/ustva/send-to-accountant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          startDate, 
          endDate 
        })
      })
      
      if (response.ok) {
        alert('UStVA wurde erfolgreich an den Steuerberater gesendet!')
      } else {
        const error = await response.json()
        alert(`Fehler beim Versand: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Error sending UStVA to accountant:', error)
      alert('Fehler beim Versand der UStVA')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print Header */}
      <div className="print-only print-header">
        <div className="company-name">Bereifung24</div>
        <h1>Umsatzsteuer-Voranmeldung (UStVA)</h1>
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
              <Link 
                href="/admin/buchhaltung/auswertungen"
                className="text-primary-600 hover:text-primary-700 mb-2 inline-block"
              >
                ← Zurück zu Auswertungen
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                Umsatzsteuer-Voranmeldung (UStVA)
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Monatliche/Quartalsweise Umsatzsteuer-Voranmeldung
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
              onClick={() => setQuickPeriod('currentQuarter')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Aktuelles Quartal
            </button>
            <button
              onClick={() => setQuickPeriod('lastQuarter')}
              className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Letztes Quartal
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-4 no-print">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Drucken / PDF
          </button>
          
          {data && (
            <button
              onClick={handleSendToAccountant}
              disabled={sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {sending ? 'Wird gesendet...' : 'An Steuerberater senden'}
            </button>
          )}
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
                Umsatzsteuer-Voranmeldung
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Zeitraum: {new Date(data.period.startDate).toLocaleDateString('de-DE')} - {new Date(data.period.endDate).toLocaleDateString('de-DE')}
              </p>
            </div>

            <div className="p-6">
              {/* Umsatzsteuer */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                  Umsatzsteuer (zu zahlende Steuer)
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Zeile 20: Umsatzsteuerpflichtige Umsätze zu 19%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bemessungsgrundlage (netto)</span>
                      <span className="font-medium">{formatCurrency(data.ustva.line20_base)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-green-700">
                      <span>Umsatzsteuer 19%</span>
                      <span>{formatCurrency(data.ustva.line20_vat)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-900">Zeile 21: Umsatzsteuerpflichtige Umsätze zu 7%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Bemessungsgrundlage (netto)</span>
                      <span className="font-medium">{formatCurrency(data.ustva.line21_base)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-green-700">
                      <span>Umsatzsteuer 7%</span>
                      <span>{formatCurrency(data.ustva.line21_vat)}</span>
                    </div>
                  </div>

                  {data.ustva.line22_vat > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">Zeile 22: Andere Steuersätze</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Bemessungsgrundlage (netto)</span>
                        <span className="font-medium">{formatCurrency(data.ustva.line22_base)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold text-green-700">
                        <span>Umsatzsteuer</span>
                        <span>{formatCurrency(data.ustva.line22_vat)}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between py-3 border-t-2 border-gray-300 font-bold text-lg">
                    <span>Summe Umsatzsteuer</span>
                    <span className="text-green-600">{formatCurrency(data.ustva.totalOutputVat)}</span>
                  </div>
                </div>
              </div>

              {/* Vorsteuer */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                  Vorsteuer (abziehbare Steuer)
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Zeile 66: Vorsteuer aus Eingangsleistungen</span>
                      <span className="font-semibold text-blue-700">{formatCurrency(data.ustva.line66_inputVat)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between py-3 border-t-2 border-gray-300 font-bold text-lg">
                    <span>Summe Vorsteuer</span>
                    <span className="text-blue-600">{formatCurrency(data.ustva.totalInputVat)}</span>
                  </div>
                </div>
              </div>

              {/* Steuerfreie Umsätze */}
              {data.ustva.line23_taxFree > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                    Steuerfreie Umsätze
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Zeile 23: Steuerfreie Umsätze</span>
                      <span className="font-semibold">{formatCurrency(data.ustva.line23_taxFree)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Zahllast / Erstattung */}
              <div className="pt-6 border-t-4 border-gray-900">
                <div className="flex justify-between items-center py-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {data.ustva.difference >= 0 ? 'Umsatzsteuer-Zahllast' : 'Vorsteuer-Erstattung'}
                  </span>
                  <span className={`text-3xl font-bold ${data.ustva.difference >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(Math.abs(data.ustva.difference))}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {data.ustva.difference >= 0 
                    ? '➡️ An das Finanzamt zu zahlen' 
                    : '⬅️ Vom Finanzamt zu erstatten'}
                </p>
              </div>

              {/* Info Box */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 no-print">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">Hinweis zur UStVA</p>
                    <p className="mb-2">
                      Die Umsatzsteuer-Voranmeldung muss je nach Umsatzgröße monatlich oder quartalsweise 
                      elektronisch an das Finanzamt übermittelt werden (via ELSTER).
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Diese Auswertung dient als Übersicht und Vorbereitung</li>
                      <li>Die offizielle Übermittlung erfolgt über ELSTER</li>
                      <li>Bitte mit Ihrem Steuerberater abstimmen</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}

