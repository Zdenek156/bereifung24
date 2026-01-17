'use client'

import { useState, useEffect } from 'react'
import { Download, Calendar, TrendingUp, TrendingDown, BarChart3, RefreshCw, Printer } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'

// Print styles
const printStyles = `
  @media print {
    @page {
      size: A4;
      margin: 2cm;
    }
    
    body * {
      visibility: hidden;
    }
    
    #print-content, #print-content * {
      visibility: visible;
    }
    
    #print-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
    
    .print-hide {
      display: none !important;
    }
    
    .print-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    
    .print-table th,
    .print-table td {
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    
    .print-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    
    .print-section {
      margin-top: 30px;
      page-break-inside: avoid;
    }
    
    .print-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .print-total {
      font-weight: bold;
      border-top: 2px solid #000;
      margin-top: 10px;
    }
  }
`

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
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null)
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'single' | 'comparison'>('single')
  const [showCharts, setShowCharts] = useState(false)

  // Years from 2025 up to current year (no future years for accounting data)
  const currentYear = new Date().getFullYear()
  const startYear = 2025
  const yearCount = currentYear - startYear + 1
  const availableYears = Array.from(
    { length: yearCount },
    (_, i) => startYear + i
  ).reverse() // Most recent year first

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
          const result = await response.json()
          if (result.success && result.data) {
            setComparison(result.data)
            setIncomeStatement(result.data.current)
          } else {
            // No data available, fetch single year data
            const singleResponse = await fetch(
              `/api/admin/accounting/income-statement?year=${selectedYear}`
            )
            if (singleResponse.ok) {
              const singleResult = await singleResponse.json()
              if (singleResult.success && singleResult.data && singleResult.data.length > 0) {
                setIncomeStatement(singleResult.data[0])
                setComparison(null)
              } else {
                setIncomeStatement(null)
                setComparison(null)
              }
            }
          }
        } else {
          // If comparison fails, try to get single year data
          const singleResponse = await fetch(
            `/api/admin/accounting/income-statement?year=${selectedYear}`
          )
          if (singleResponse.ok) {
            const singleResult = await singleResponse.json()
            if (singleResult.success && singleResult.data && singleResult.data.length > 0) {
              setIncomeStatement(singleResult.data[0])
              setComparison(null)
            } else {
              setIncomeStatement(null)
              setComparison(null)
            }
          }
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
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold">Gewinn- und Verlustrechnung (GuV)</h1>
          </div>
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
    <>
      <style>{printStyles}</style>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6 print-hide">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/buchhaltung')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <h1 className="text-3xl font-bold">Gewinn- und Verlustrechnung (GuV)</h1>
          </div>
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
                console.error('Error regenerating income statement:', error)
              }
            }}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Neu generieren
          </Button>
          <Button
            onClick={() => window.print()}
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'single' | 'comparison')} className="mb-6">
        <TabsList>
          <TabsTrigger value="single">Einzelansicht</TabsTrigger>
          <TabsTrigger value="comparison">Vorjahresvergleich</TabsTrigger>
        </TabsList>
      </Tabs>

      {viewMode === 'comparison' && incomeStatement && !comparison?.previous && (
        <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <div className="text-yellow-600 text-2xl">⚠️</div>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Keine Vorjahresdaten verfügbar</h3>
              <p className="text-sm text-yellow-800">
                Für das Jahr {selectedYear - 1} sind keine Gewinn- und Verlustrechnungsdaten vorhanden. 
                Der Vergleich kann daher nicht angezeigt werden.
              </p>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/accounting/income-statement', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ year: selectedYear - 1 })
                    })
                    if (response.ok) {
                      fetchIncomeStatement()
                    }
                  } catch (error) {
                    console.error('Error generating previous year income statement:', error)
                  }
                }}
                size="sm"
                className="mt-3 bg-yellow-600 hover:bg-yellow-700"
              >
                GuV für {selectedYear - 1} generieren
              </Button>
            </div>
          </div>
        </Card>
      )}

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
                  {viewMode === 'comparison' && comparison && comparison.previous && renderChangeIndicator(incomeStatement?.revenue.umsatzerloese || 0, comparison.previous.revenue.umsatzerloese)}
                  {viewMode === 'comparison' && !comparison?.previous && <span className="text-xs text-gray-400">Keine Vorjahresdaten</span>}
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

      {/* Print-only content */}
      <div id="print-content" className="hidden print:block">
        <div className="print-header">
          <h1 className="text-2xl font-bold">GEWINN- UND VERLUSTRECHNUNG</h1>
          <p className="text-lg">für das Geschäftsjahr {selectedYear}</p>
          <p className="text-sm mt-2">Bereifung24 GmbH</p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '70%' }}>ERTRÄGE</th>
              <th style={{ width: '30%', textAlign: 'right' }}>EUR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1. Umsatzerlöse</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.revenue.umsatzerloese || 0)}</td>
            </tr>
            <tr>
              <td>2. Bestandsveränderungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.revenue.bestandsveraenderungen || 0)}</td>
            </tr>
            <tr>
              <td>3. Andere aktivierte Eigenleistungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.revenue.andereAktivierteEigenleistungen || 0)}</td>
            </tr>
            <tr>
              <td>4. Sonstige betriebliche Erträge</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.revenue.sonstigeBetrieblicheErtraege || 0)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>Gesamtleistung</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR(calculateTotalRevenue(incomeStatement!))}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="print-table" style={{ marginTop: '30px' }}>
          <thead>
            <tr>
              <th style={{ width: '70%' }}>AUFWENDUNGEN</th>
              <th style={{ width: '30%', textAlign: 'right' }}>EUR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2}><strong>5. Materialaufwand</strong></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>a) Aufwendungen für Roh-, Hilfs- und Betriebsstoffe</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe || 0)}</td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>b) Aufwendungen für bezogene Leistungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.expenses.materialaufwand.aufwendungenBezogeneLeistungen || 0)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '20px' }}>Summe Materialaufwand</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((incomeStatement?.expenses.materialaufwand.aufwendungenRohHilfsBetriebsstoffe || 0) + 
                          (incomeStatement?.expenses.materialaufwand.aufwendungenBezogeneLeistungen || 0))}
              </td>
            </tr>
            
            <tr>
              <td colSpan={2}><strong>6. Personalaufwand</strong></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>a) Löhne und Gehälter</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.expenses.personalaufwand.loehneGehaelter || 0)}</td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>b) Soziale Abgaben</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.expenses.personalaufwand.sozialeAbgaben || 0)}</td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>c) Altersversorgung</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.expenses.personalaufwand.altersversorgung || 0)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td style={{ paddingLeft: '20px' }}>Summe Personalaufwand</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((incomeStatement?.expenses.personalaufwand.loehneGehaelter || 0) + 
                          (incomeStatement?.expenses.personalaufwand.sozialeAbgaben || 0) + 
                          (incomeStatement?.expenses.personalaufwand.altersversorgung || 0))}
              </td>
            </tr>
            
            <tr>
              <td><strong>7. Abschreibungen</strong></td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.expenses.abschreibungen || 0)}</td>
            </tr>
            
            <tr>
              <td><strong>8. Sonstige betriebliche Aufwendungen</strong></td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.expenses.sonstigeBetrieblicheAufwendungen || 0)}</td>
            </tr>
            
            <tr style={{ fontWeight: 'bold' }}>
              <td>Betriebsergebnis</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR(calculateTotalRevenue(incomeStatement!) - calculateTotalExpenses(incomeStatement!))}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="print-table" style={{ marginTop: '30px' }}>
          <thead>
            <tr>
              <th style={{ width: '70%' }}>FINANZERGEBNIS</th>
              <th style={{ width: '30%', textAlign: 'right' }}>EUR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>9. Zinserträge</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.financialResult?.zinsertraege || 0)}</td>
            </tr>
            <tr>
              <td>10. Beteiligungserträge</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.financialResult?.beteiligungsertraege || 0)}</td>
            </tr>
            <tr>
              <td>11. Zinsen und ähnliche Aufwendungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.financialResult?.zinsenAehnlicheAufwendungen || 0)}</td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>Finanzergebnis</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((incomeStatement?.financialResult?.zinsertraege || 0) + 
                          (incomeStatement?.financialResult?.beteiligungsertraege || 0) - 
                          (incomeStatement?.financialResult?.zinsenAehnlicheAufwendungen || 0))}
              </td>
            </tr>
            
            <tr style={{ fontWeight: 'bold', borderTop: '2px solid #000' }}>
              <td>Ergebnis vor Steuern</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.earningsBeforeTax || 0)}</td>
            </tr>
            
            <tr>
              <td>12. Steuern vom Einkommen und vom Ertrag</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(incomeStatement?.taxes || 0)}</td>
            </tr>
            
            <tr className="print-total">
              <td><strong>{incomeStatement && incomeStatement.netIncome >= 0 ? 'JAHRESÜBERSCHUSS' : 'JAHRESFEHLBETRAG'}</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{formatEUR(incomeStatement?.netIncome || 0)}</strong></td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: '40px', fontSize: '12px', textAlign: 'center' }}>
          <p>Erstellt am: {new Date().toLocaleDateString('de-DE')}</p>
        </div>
      </div>
    </div>
    </>
  )
}
