'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface IncomeStatementData {
  year: number
  revenue: {
    umsatzerloese: number
    bestandsveraenderungen: number
    andereAktivierteEigenleistungen: number
    sonstigeBetrieblicheErtraege: number
  }
  expenses: {
    materialaufwand: {
      aufwendungenRohHilfsBetriebsstoffe: number
      aufwendungenBezogeneLeistungen: number
    }
    personalaufwand: {
      loehneGehaelter: number
      sozialeAbgaben: number
      altersversorgung: number
    }
    abschreibungen: number
    sonstigeBetrieblicheAufwendungen: number
    zinsenAehnlicheAufwendungen: number
    steuernVomEinkommenErtrag: number
    sonstigeSteuern: number
  }
  netIncome: number
}

interface ComparisonData {
  current: IncomeStatementData
  previous: IncomeStatementData
}

export default function GuvPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null)
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single')
  const [showCharts, setShowCharts] = useState(false)

  const availableYears = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  )

  useEffect(() => {
    fetchIncomeStatement()
  }, [selectedYear, viewMode])

  const fetchIncomeStatement = async () => {
    setLoading(true)
    try {
      if (viewMode === 'comparison') {
        const response = await fetch(
          `/api/admin/accounting/income-statement/comparison?year=${selectedYear}`
        )
        if (response.ok) {
          const data = await response.json()
          setComparison(data)
          setIncomeStatement(data.current)
        }
      } else {
        const response = await fetch(
          `/api/admin/accounting/income-statement?year=${selectedYear}`
        )
        if (response.ok) {
          const result = await response.json()
          // API returns { success: true, data: IncomeStatement[] }
          if (result.success && result.data && result.data.length > 0) {
            setIncomeStatement(result.data[0])
          } else {
            setIncomeStatement(null)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching income statement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch(
        `/api/admin/accounting/income-statement/${selectedYear}/export?format=${format}`
      )
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `guv_${selectedYear}.${format === 'excel' ? 'xlsx' : format}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting income statement:', error)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const calculateTotalRevenue = (data: IncomeStatementData) => {
    return (
      data.revenue.umsatzerloese +
      data.revenue.bestandsveraenderungen +
      data.revenue.andereAktivierteEigenleistungen +
      data.revenue.sonstigeBetrieblicheErtraege
    )
  }

  const calculateTotalExpenses = (data: IncomeStatementData) => {
    const mat =
      data.expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe +
      data.expenses.materialaufwand.aufwendungenBezogeneLeistungen
    const pers =
      data.expenses.personalaufwand.loehneGehaelter +
      data.expenses.personalaufwand.sozialeAbgaben +
      data.expenses.personalaufwand.altersversorgung
    return (
      mat +
      pers +
      data.expenses.abschreibungen +
      data.expenses.sonstigeBetrieblicheAufwendungen +
      data.expenses.zinsenAehnlicheAufwendungen +
      data.expenses.steuernVomEinkommenErtrag +
      data.expenses.sonstigeSteuern
    )
  }

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  const renderChangeIndicator = (current: number, previous: number) => {
    const change = calculateChange(current, previous)
    const isPositive = change > 0
    
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{Math.abs(change).toFixed(1)}%</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Gewinn- und Verlustrechnung...</div>
        </div>
      </div>
    )
  }

  if (!incomeStatement) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Gewinn- und Verlustrechnung (GuV)</h1>
          <div className="flex gap-3 items-center">
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
        </div>
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold">Keine GuV-Daten für {selectedYear}</h2>
            <p className="text-gray-600">
              Für das ausgewählte Jahr sind noch keine Gewinn- und Verlustrechnungsdaten vorhanden.
            </p>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/accounting/income-statement', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: selectedYear })
                  })
                  if (response.ok) {
                    fetchIncomeStatement()
                  }
                } catch (error) {
                  console.error('Error generating income statement:', error)
                }
              }}
              className="mt-4"
            >
              GuV für {selectedYear} generieren
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gewinn- und Verlustrechnung (GuV)</h1>
        <div className="flex gap-3 items-center">
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
          <Button
            variant={showCharts ? 'default' : 'outline'}
            onClick={() => setShowCharts(!showCharts)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Diagramme
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'single' | 'comparison')} className="mb-6">
        <TabsList>
          <TabsTrigger value="single">Einzelansicht</TabsTrigger>
          <TabsTrigger value="comparison">Vorjahresvergleich</TabsTrigger>
        </TabsList>
      </Tabs>

      {showCharts && incomeStatement && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Umsatzentwicklung</h3>
            <div className="h-64 flex items-end justify-around gap-2">
              {/* Simplified bar chart representation */}
              <div className="flex-1 bg-blue-500 rounded-t" style={{ height: '80%' }}>
                <div className="text-white text-xs text-center mt-2">Umsatz</div>
              </div>
              <div className="flex-1 bg-green-500 rounded-t" style={{ height: `${(incomeStatement.netIncome / calculateTotalRevenue(incomeStatement)) * 100}%` }}>
                <div className="text-white text-xs text-center mt-2">Gewinn</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Kostenstruktur</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Materialaufwand</span>
                <div className="flex-1 mx-4 bg-gray-200 rounded h-4">
                  <div
                    className="bg-orange-500 h-4 rounded"
                    style={{
                      width: `${((incomeStatement.expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe + incomeStatement.expenses.materialaufwand.aufwendungenBezogeneLeistungen) / calculateTotalExpenses(incomeStatement)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Personalaufwand</span>
                <div className="flex-1 mx-4 bg-gray-200 rounded h-4">
                  <div
                    className="bg-purple-500 h-4 rounded"
                    style={{
                      width: `${((incomeStatement.expenses.personalaufwand.loehneGehaelter + incomeStatement.expenses.personalaufwand.sozialeAbgaben + incomeStatement.expenses.personalaufwand.altersversorgung) / calculateTotalExpenses(incomeStatement)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Sonstige Aufwendungen</span>
                <div className="flex-1 mx-4 bg-gray-200 rounded h-4">
                  <div
                    className="bg-red-500 h-4 rounded"
                    style={{
                      width: `${(incomeStatement.expenses.sonstigeBetrieblicheAufwendungen / calculateTotalExpenses(incomeStatement)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <div className="space-y-6">
          {/* Revenue Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 bg-green-50 p-2 rounded">Erträge</h2>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span>1. Umsatzerlöse</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.revenue.umsatzerloese || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.revenue.umsatzerloese || 0, comparison.previous.revenue.umsatzerloese)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>2. Bestandsveränderungen</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.revenue.bestandsveraenderungen || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.revenue.bestandsveraenderungen || 0, comparison.previous.revenue.bestandsveraenderungen)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>3. Andere aktivierte Eigenleistungen</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.revenue.andereAktivierteEigenleistungen || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.revenue.andereAktivierteEigenleistungen || 0, comparison.previous.revenue.andereAktivierteEigenleistungen)}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span>4. Sonstige betriebliche Erträge</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.revenue.sonstigeBetrieblicheErtraege || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.revenue.sonstigeBetrieblicheErtraege || 0, comparison.previous.revenue.sonstigeBetrieblicheErtraege)}
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t font-semibold">
                <span>Gesamtleistung</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{incomeStatement && formatEUR(calculateTotalRevenue(incomeStatement))}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(calculateTotalRevenue(incomeStatement!), calculateTotalRevenue(comparison.previous))}
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h2 className="text-xl font-bold mb-4 bg-red-50 p-2 rounded">Aufwendungen</h2>
            <div className="space-y-2 ml-4">
              <div>
                <div className="font-semibold mb-2">5. Materialaufwand</div>
                <div className="space-y-1 ml-4">
                  <div className="flex justify-between items-center">
                    <span>a) Roh-, Hilfs- und Betriebsstoffe</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{formatEUR(incomeStatement?.expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe || 0)}</span>
                      {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe || 0, comparison.previous.expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>b) Bezogene Leistungen</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{formatEUR(incomeStatement?.expenses.materialaufwand.aufwendungenBezogeneLeistungen || 0)}</span>
                      {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.materialaufwand.aufwendungenBezogeneLeistungen || 0, comparison.previous.expenses.materialaufwand.aufwendungenBezogeneLeistungen)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-2">6. Personalaufwand</div>
                <div className="space-y-1 ml-4">
                  <div className="flex justify-between items-center">
                    <span>a) Löhne und Gehälter</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{formatEUR(incomeStatement?.expenses.personalaufwand.loehneGehaelter || 0)}</span>
                      {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.personalaufwand.loehneGehaelter || 0, comparison.previous.expenses.personalaufwand.loehneGehaelter)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>b) Soziale Abgaben</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{formatEUR(incomeStatement?.expenses.personalaufwand.sozialeAbgaben || 0)}</span>
                      {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.personalaufwand.sozialeAbgaben || 0, comparison.previous.expenses.personalaufwand.sozialeAbgaben)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>c) Altersversorgung</span>
                    <div className="flex items-center gap-4">
                      <span className="font-mono">{formatEUR(incomeStatement?.expenses.personalaufwand.altersversorgung || 0)}</span>
                      {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.personalaufwand.altersversorgung || 0, comparison.previous.expenses.personalaufwand.altersversorgung)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">7. Abschreibungen</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.expenses.abschreibungen || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.abschreibungen || 0, comparison.previous.expenses.abschreibungen)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">8. Sonstige betriebliche Aufwendungen</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.expenses.sonstigeBetrieblicheAufwendungen || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.sonstigeBetrieblicheAufwendungen || 0, comparison.previous.expenses.sonstigeBetrieblicheAufwendungen)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">9. Zinsen und ähnliche Aufwendungen</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.expenses.zinsenAehnlicheAufwendungen || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.zinsenAehnlicheAufwendungen || 0, comparison.previous.expenses.zinsenAehnlicheAufwendungen)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">10. Steuern vom Einkommen und Ertrag</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.expenses.steuernVomEinkommenErtrag || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.steuernVomEinkommenErtrag || 0, comparison.previous.expenses.steuernVomEinkommenErtrag)}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-semibold">11. Sonstige Steuern</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{formatEUR(incomeStatement?.expenses.sonstigeSteuern || 0)}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.expenses.sonstigeSteuern || 0, comparison.previous.expenses.sonstigeSteuern)}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t font-semibold">
                <span>Gesamtaufwand</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono">{incomeStatement && formatEUR(calculateTotalExpenses(incomeStatement))}</span>
                  {viewMode === 'comparison' && comparison && renderChangeIndicator(calculateTotalExpenses(incomeStatement!), calculateTotalExpenses(comparison.previous))}
                </div>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className={`p-4 rounded-lg ${incomeStatement && incomeStatement.netIncome >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">
                {incomeStatement && incomeStatement.netIncome >= 0 ? 'Jahresüberschuss' : 'Jahresfehlbetrag'}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold font-mono">{formatEUR(incomeStatement?.netIncome || 0)}</span>
                {viewMode === 'comparison' && comparison && renderChangeIndicator(incomeStatement?.netIncome || 0, comparison.previous.netIncome)}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
