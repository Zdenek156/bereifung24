'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface EuerData {
  period: {
    startDate: string
    endDate: string
  }
  revenue: {
    commission: number
    other: number
    total: number
  }
  expenses: {
    wages: number
    socialSecurity: number
    commissions: number
    travel: number
    vehicle: number
    rent: number
    insurance: number
    marketing: number
    other: number
    total: number
  }
  profitLoss: number
  summary: {
    totalRevenue: number
    totalExpenses: number
    profit: number
    loss: number
  }
}

export default function EuerPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [data, setData] = useState<EuerData | null>(null)
  const [loading, setLoading] = useState(false)

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

      const response = await fetch(`/api/admin/accounting/reports/euer?${params}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching EÜR:', error)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
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
                Einnahmen-Überschuss-Rechnung (EÜR)
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Gewinnermittlung nach § 4 Abs. 3 EStG
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 print:hidden">
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
        <div className="mb-6 flex gap-4 print:hidden">
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
                Einnahmen-Überschuss-Rechnung
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Zeitraum: {new Date(data.period.startDate).toLocaleDateString('de-DE')} - {new Date(data.period.endDate).toLocaleDateString('de-DE')}
              </p>
            </div>

            <div className="p-6">
              {/* Betriebseinnahmen */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                  Betriebseinnahmen
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Provisionserlöse</span>
                    <span className="font-medium">{formatCurrency(data.revenue.commission)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Sonstige Erlöse</span>
                    <span className="font-medium">{formatCurrency(data.revenue.other)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-lg">
                    <span>Summe Betriebseinnahmen</span>
                    <span className="text-green-600">{formatCurrency(data.revenue.total)}</span>
                  </div>
                </div>
              </div>

              {/* Betriebsausgaben */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-300">
                  Betriebsausgaben
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Löhne und Gehälter</span>
                    <span className="font-medium">{formatCurrency(data.expenses.wages)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Sozialabgaben</span>
                    <span className="font-medium">{formatCurrency(data.expenses.socialSecurity)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Provisionen an Werkstätten</span>
                    <span className="font-medium">{formatCurrency(data.expenses.commissions)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Reisekosten</span>
                    <span className="font-medium">{formatCurrency(data.expenses.travel)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Kfz-Kosten</span>
                    <span className="font-medium">{formatCurrency(data.expenses.vehicle)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Miete</span>
                    <span className="font-medium">{formatCurrency(data.expenses.rent)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Versicherungen</span>
                    <span className="font-medium">{formatCurrency(data.expenses.insurance)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Werbekosten</span>
                    <span className="font-medium">{formatCurrency(data.expenses.marketing)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-700">Sonstige Betriebsausgaben</span>
                    <span className="font-medium">{formatCurrency(data.expenses.other)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-lg">
                    <span>Summe Betriebsausgaben</span>
                    <span className="text-red-600">{formatCurrency(data.expenses.total)}</span>
                  </div>
                </div>
              </div>

              {/* Gewinn/Verlust */}
              <div className="pt-6 border-t-4 border-gray-900">
                <div className="flex justify-between items-center py-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {data.profitLoss >= 0 ? 'Gewinn' : 'Verlust'}
                  </span>
                  <span className={`text-3xl font-bold ${data.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(data.profitLoss))}
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 print:hidden">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-700">
                    <p className="font-semibold mb-1">Hinweis zur EÜR</p>
                    <p>
                      Die Einnahmen-Überschuss-Rechnung (EÜR) ist eine vereinfachte Gewinnermittlung 
                      nach § 4 Abs. 3 EStG für Kleinunternehmer und Freiberufler. Sie basiert auf dem 
                      Zufluss-Abfluss-Prinzip. Bitte beachten Sie, dass diese Auswertung eine Übersicht 
                      darstellt und für die offizielle Steuererklärung mit Ihrem Steuerberater abgestimmt 
                      werden sollte.
                    </p>
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
