// app/admin/buchhaltung/auswertungen/bwa/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface BWAData {
  revenue: {
    commission: number
    otherRevenue: number
    total: number
  }
  costOfSales: {
    commissionExpense: number
    total: number
  }
  grossProfit: number
  operatingExpenses: {
    personnel: {
      wages: number
      socialSecurity: number
      total: number
    }
    roomCosts: {
      rent: number
      utilities: number
      total: number
    }
    vehicle: {
      fuel: number
      maintenance: number
      insurance: number
      total: number
    }
    marketing: number
    insurance: number
    travel: number
    office: number
    other: number
    total: number
  }
  operatingResult: number
  financialResult: number
  earningsBeforeTax: number
  taxes: number
  netIncome: number
}

export default function BWAPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<{ current: { period: any, bwa: BWAData }, comparison: any } | null>(null)
  
  // Default to current month
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  
  const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(lastDay.toISOString().split('T')[0])
  const [showComparison, setShowComparison] = useState(false)
  const [compareStartDate, setCompareStartDate] = useState('')
  const [compareEndDate, setCompareEndDate] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = `/api/admin/accounting/reports/bwa?startDate=${startDate}&endDate=${endDate}`
      if (showComparison && compareStartDate && compareEndDate) {
        url += `&compareStartDate=${compareStartDate}&compareEndDate=${compareEndDate}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching BWA:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickSelect = (type: string) => {
    const now = new Date()
    let start: Date, end: Date

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  }

  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0%'
    return `${((value / total) * 100).toFixed(1)}%`
  }

  return (
    <main className="flex-1 p-8 bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/admin/buchhaltung/auswertungen"
          className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
        >
          ← Zurück zu Auswertungen
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Betriebswirtschaftliche Auswertung (BWA)
        </h1>
        <p className="text-gray-600 mt-2">
          Übersicht über Umsätze, Kosten und Ergebnis
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Von
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Lädt...' : 'Aktualisieren'}
            </button>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleQuickSelect('currentMonth')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Aktueller Monat
          </button>
          <button
            onClick={() => handleQuickSelect('lastMonth')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Letzter Monat
          </button>
          <button
            onClick={() => handleQuickSelect('currentYear')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Aktuelles Jahr
          </button>
          <button
            onClick={() => handleQuickSelect('lastYear')}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Letztes Jahr
          </button>
        </div>
      </div>

      {/* BWA Table */}
      {data && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Betrag
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Anteil
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Umsatzerlöse */}
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900" colSpan={3}>
                    UMSATZERLÖSE
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-700 pl-12">
                    Provisionserlöse
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(data.current.revenue.commission)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.revenue.commission, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-700 pl-12">
                    Sonstige Erlöse
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(data.current.revenue.otherRevenue)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.revenue.otherRevenue, data.current.revenue.total)}
                  </td>
                </tr>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-6 py-3 text-sm text-gray-900">
                    Gesamtleistung
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right">
                    {formatCurrency(data.current.revenue.total)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900 text-right">
                    100%
                  </td>
                </tr>

                {/* Materialaufwand */}
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900" colSpan={3}>
                    FREMDLEISTUNGEN
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-700 pl-12">
                    Provisionen an Werkstätten
                  </td>
                  <td className="px-6 py-3 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.costOfSales.commissionExpense)}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.costOfSales.commissionExpense, data.current.revenue.total)}
                  </td>
                </tr>

                {/* Rohertrag */}
                <tr className="bg-green-50 font-bold">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ROHERTRAG / BRUTTOGEWINN
                  </td>
                  <td className="px-6 py-4 text-sm text-green-700 text-right">
                    {formatCurrency(data.current.grossProfit)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 text-right">
                    {formatPercent(data.current.grossProfit, data.current.revenue.total)}
                  </td>
                </tr>

                {/* Betriebliche Aufwendungen */}
                <tr className="bg-blue-50">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900" colSpan={3}>
                    BETRIEBLICHE AUFWENDUNGEN
                  </td>
                </tr>

                {/* Personalkosten */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-800 pl-8" colSpan={3}>
                    Personalkosten
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-12">
                    Löhne und Gehälter
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.personnel.wages)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.personnel.wages, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-12">
                    Sozialabgaben
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.personnel.socialSecurity)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.personnel.socialSecurity, data.current.revenue.total)}
                  </td>
                </tr>

                {/* Raumkosten */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-800 pl-8" colSpan={3}>
                    Raumkosten
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-12">
                    Miete
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.roomCosts.rent)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.roomCosts.rent, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-12">
                    Nebenkosten
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.roomCosts.utilities)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.roomCosts.utilities, data.current.revenue.total)}
                  </td>
                </tr>

                {/* Fahrzeugkosten */}
                <tr className="bg-gray-50">
                  <td className="px-6 py-3 text-sm font-medium text-gray-800 pl-8" colSpan={3}>
                    Fahrzeugkosten
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-12">
                    Treibstoff
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.vehicle.fuel)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.vehicle.fuel, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-12">
                    Wartung & Reparatur
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.vehicle.maintenance)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.vehicle.maintenance, data.current.revenue.total)}
                  </td>
                </tr>

                {/* Weitere Kosten */}
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-8">
                    Werbekosten
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.marketing)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.marketing, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-8">
                    Versicherungen
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.insurance)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.insurance, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-8">
                    Reisekosten
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.travel)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.travel, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-8">
                    Bürokosten
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.office)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.office, data.current.revenue.total)}
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-2 text-sm text-gray-700 pl-8">
                    Sonstige Kosten
                  </td>
                  <td className="px-6 py-2 text-sm text-red-600 text-right">
                    {formatCurrency(data.current.operatingExpenses.other)}
                  </td>
                  <td className="px-6 py-2 text-sm text-gray-500 text-right">
                    {formatPercent(data.current.operatingExpenses.other, data.current.revenue.total)}
                  </td>
                </tr>

                {/* Betriebsergebnis */}
                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    BETRIEBSERGEBNIS (EBIT)
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${
                    data.current.operatingResult >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(data.current.operatingResult)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700 text-right">
                    {formatPercent(data.current.operatingResult, data.current.revenue.total)}
                  </td>
                </tr>

                {/* Jahresüberschuss */}
                <tr className={`font-bold border-t-2 border-gray-400 ${
                  data.current.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    JAHRESÜBERSCHUSS / -FEHLBETRAG
                  </td>
                  <td className={`px-6 py-4 text-base font-bold text-right ${
                    data.current.netIncome >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(data.current.netIncome)}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-700 text-right">
                    {formatPercent(data.current.netIncome, data.current.revenue.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Export Buttons */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              🖨️ Drucken
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              title="Excel-Export kommt später"
            >
              📊 Excel Export
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
