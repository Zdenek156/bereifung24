'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, Users, Euro, Calendar } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'

interface PayrollStats {
  year: number
  months: {
    month: number
    totalGross: number
    totalNet: number
    totalEmployer: number
    employeeCount: number
  }[]
  yearlyTotals: {
    totalGross: number
    totalNet: number
    totalEmployer: number
    avgEmployeeCount: number
  }
}

export default function PayrollAnalyticsPage() {
  const [stats, setStats] = useState<PayrollStats | null>(null)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)

  const currentYear = new Date().getFullYear()
  const startYear = 2025
  const yearCount = currentYear - startYear + 1
  const availableYears = Array.from(
    { length: yearCount },
    (_, i) => startYear + i
  ).reverse()

  useEffect(() => {
    fetchStats()
  }, [selectedYear])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/hr/payrolls?year=${selectedYear}`)
      if (response.ok) {
        const payrolls = await response.json()
        calculateStats(payrolls)
      }
    } catch (error) {
      console.error('Error fetching payroll stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (payrolls: any[]) => {
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      totalGross: 0,
      totalNet: 0,
      totalEmployer: 0,
      employeeCount: 0
    }))

    payrolls.forEach(payroll => {
      const monthIndex = payroll.month - 1
      if (monthIndex >= 0 && monthIndex < 12) {
        months[monthIndex].totalGross += payroll.totalGross || 0
        months[monthIndex].totalNet += payroll.totalNet || 0
        months[monthIndex].totalEmployer += payroll.totalEmployer || 0
        months[monthIndex].employeeCount = Math.max(months[monthIndex].employeeCount, payroll.employeeCount || 0)
      }
    })

    const yearlyTotals = months.reduce((acc, m) => ({
      totalGross: acc.totalGross + m.totalGross,
      totalNet: acc.totalNet + m.totalNet,
      totalEmployer: acc.totalEmployer + m.totalEmployer,
      avgEmployeeCount: acc.avgEmployeeCount + m.employeeCount
    }), { totalGross: 0, totalNet: 0, totalEmployer: 0, avgEmployeeCount: 0 })

    const monthsWithData = months.filter(m => m.employeeCount > 0).length
    yearlyTotals.avgEmployeeCount = monthsWithData > 0 ? yearlyTotals.avgEmployeeCount / monthsWithData : 0

    setStats({
      year: selectedYear,
      months,
      yearlyTotals
    })
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const getMonthName = (month: number) => {
    const names = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
    return names[month - 1] || `Monat ${month}`
  }

  return (
    <PermissionGuard permissions={['admin', 'employee']}>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold">Gehaltsabrechnungen - Auswertungen</h1>
              <p className="text-gray-600">Statistiken und Übersichten</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Lade Statistiken...</div>
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Yearly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Euro className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">Brutto Gesamt</span>
                </div>
                <div className="text-2xl font-bold">{formatEUR(stats.yearlyTotals.totalGross)}</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">Netto Gesamt</span>
                </div>
                <div className="text-2xl font-bold">{formatEUR(stats.yearlyTotals.totalNet)}</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-600">AG-Kosten Gesamt</span>
                </div>
                <div className="text-2xl font-bold">{formatEUR(stats.yearlyTotals.totalEmployer)}</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-sm text-gray-600">Ø Mitarbeiter</span>
                </div>
                <div className="text-2xl font-bold">{Math.round(stats.yearlyTotals.avgEmployeeCount)}</div>
              </Card>
            </div>

            {/* Monthly Breakdown */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Monatliche Übersicht {selectedYear}</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3">Monat</th>
                      <th className="text-right py-3">Mitarbeiter</th>
                      <th className="text-right py-3">Brutto</th>
                      <th className="text-right py-3">Netto</th>
                      <th className="text-right py-3">AG-Kosten</th>
                      <th className="text-right py-3">Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.months.map((month) => month.employeeCount > 0 && (
                      <tr key={month.month} className="border-b hover:bg-gray-50">
                        <td className="py-3">{getMonthName(month.month)}</td>
                        <td className="text-right">{month.employeeCount}</td>
                        <td className="text-right font-mono">{formatEUR(month.totalGross)}</td>
                        <td className="text-right font-mono">{formatEUR(month.totalNet)}</td>
                        <td className="text-right font-mono">{formatEUR(month.totalEmployer)}</td>
                        <td className="text-right font-bold font-mono">{formatEUR(month.totalGross + month.totalEmployer)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-gray-50">
                      <td className="py-3">Gesamt</td>
                      <td className="text-right">-</td>
                      <td className="text-right font-mono">{formatEUR(stats.yearlyTotals.totalGross)}</td>
                      <td className="text-right font-mono">{formatEUR(stats.yearlyTotals.totalNet)}</td>
                      <td className="text-right font-mono">{formatEUR(stats.yearlyTotals.totalEmployer)}</td>
                      <td className="text-right font-mono">{formatEUR(stats.yearlyTotals.totalGross + stats.yearlyTotals.totalEmployer)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-2">Keine Daten für {selectedYear}</h2>
            <p className="text-gray-600">Es sind noch keine Gehaltsabrechnungen für dieses Jahr vorhanden.</p>
          </Card>
        )}
      </div>
    </PermissionGuard>
  )
}
