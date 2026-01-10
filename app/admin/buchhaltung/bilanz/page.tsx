'use client'

import { useState, useEffect } from 'react'
import { Download, Lock, CheckCircle, Calendar, RefreshCw, Printer, ArrowLeft } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
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

interface BalanceSheetData {
  year: number
  aktiva: {
    anlagevermoegen: {
      sachanlagen: number
      finanzanlagen: number
      immaterielleVermoegensgegenstaende: number
    }
    umlaufvermoegen: {
      vorraete: number
      forderungen: number
      kasseBank: number
    }
    rechnungsabgrenzungsposten: number
  }
  passiva: {
    eigenkapital: {
      gezeichnetesKapital: number
      kapitalruecklagen: number
      gewinnruecklagen: number
      jahresueberschuss: number
    }
    rueckstellungen: {
      pensionsrueckstellungen: number
      steuerrueckstellungen: number
      sonstigeRueckstellungen: number
    }
    verbindlichkeiten: {
      anleihen: number
      verbindlichkeitenKreditinstitute: number
      erhalteneAnzahlungen: number
      verbindlichkeitenLieferungen: number
      sonstigeVerbindlichkeiten: number
    }
    rechnungsabgrenzungsposten: number
  }
  locked: boolean
  approved: boolean
  approvedBy?: string
  approvedAt?: string
}

export default function BilanzPage() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  // Years from 2025 up to current year (no future years for accounting data)
  const currentYear = new Date().getFullYear()
  const startYear = 2025
  const yearCount = currentYear - startYear + 1
  const availableYears = Array.from(
    { length: yearCount },
    (_, i) => startYear + i
  ).reverse() // Most recent year first

  useEffect(() => {
    fetchBalanceSheet()
  }, [selectedYear])

  const fetchBalanceSheet = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/admin/accounting/balance-sheet?year=${selectedYear}`
      )
      if (response.ok) {
        const result = await response.json()
        // API returns { success: true, data: BalanceSheet[] }
        if (result.success && result.data && result.data.length > 0) {
          setBalanceSheet(result.data[0])
        } else {
          setBalanceSheet(null)
        }
      }
    } catch (error) {
      console.error('Error fetching balance sheet:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async () => {
    if (!confirm('Möchten Sie die Bilanz wirklich sperren?')) return
    setProcessing(true)
    try {
      const response = await fetch(
        `/api/admin/accounting/balance-sheet/${selectedYear}/lock`,
        { method: 'POST' }
      )
      if (response.ok) {
        await fetchBalanceSheet()
      }
    } catch (error) {
      console.error('Error locking balance sheet:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleApprove = async () => {
    if (!confirm('Möchten Sie die Bilanz wirklich freigeben?')) return
    setProcessing(true)
    try {
      const response = await fetch(
        `/api/admin/accounting/balance-sheet/${selectedYear}/approve`,
        { method: 'POST' }
      )
      if (response.ok) {
        await fetchBalanceSheet()
      }
    } catch (error) {
      console.error('Error approving balance sheet:', error)
    } finally {
      setProcessing(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch(
        `/api/admin/accounting/balance-sheet/${selectedYear}/export?format=${format}`
      )
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `bilanz_${selectedYear}.${format === 'excel' ? 'xlsx' : format}`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting balance sheet:', error)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const calculateActivaTotal = () => {
    if (!balanceSheet) return 0
    const av = balanceSheet.aktiva.anlagevermoegen
    const uv = balanceSheet.aktiva.umlaufvermoegen
    return (
      av.sachanlagen +
      av.finanzanlagen +
      av.immaterielleVermoegensgegenstaende +
      uv.vorraete +
      uv.forderungen +
      uv.kasseBank +
      balanceSheet.aktiva.rechnungsabgrenzungsposten
    )
  }

  const calculatePassivaTotal = () => {
    if (!balanceSheet) return 0
    const ek = balanceSheet.passiva.eigenkapital
    const rs = balanceSheet.passiva.rueckstellungen
    const vb = balanceSheet.passiva.verbindlichkeiten
    return (
      ek.gezeichnetesKapital +
      ek.kapitalruecklagen +
      ek.gewinnruecklagen +
      ek.jahresueberschuss +
      rs.pensionsrueckstellungen +
      rs.steuerrueckstellungen +
      rs.sonstigeRueckstellungen +
      vb.anleihen +
      vb.verbindlichkeitenKreditinstitute +
      vb.erhalteneAnzahlungen +
      vb.verbindlichkeitenLieferungen +
      vb.sonstigeVerbindlichkeiten +
      balanceSheet.passiva.rechnungsabgrenzungsposten
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Bilanz...</div>
        </div>
      </div>
    )
  }

  if (!balanceSheet) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/buchhaltung')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <h1 className="text-3xl font-bold">Bilanz</h1>
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
            <div className="text-6xl mb-4">⚖️</div>
            <h2 className="text-2xl font-bold">Keine Bilanzdaten für {selectedYear}</h2>
            <p className="text-gray-600">
              Für das ausgewählte Jahr sind noch keine Bilanzdaten vorhanden.
            </p>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/admin/accounting/balance-sheet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ year: selectedYear })
                  })
                  if (response.ok) {
                    fetchBalanceSheet()
                  }
                } catch (error) {
                  console.error('Error generating balance sheet:', error)
                }
              }}
              className="mt-4"
            >
              Bilanz für {selectedYear} generieren
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
            <h1 className="text-3xl font-bold">Bilanz</h1>
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
          {balanceSheet && !balanceSheet.locked && (
            <>
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/accounting/balance-sheet', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ year: selectedYear })
                    })
                    if (response.ok) {
                      fetchBalanceSheet()
                    }
                  } catch (error) {
                    console.error('Error regenerating balance sheet:', error)
                  }
                }}
                disabled={processing}
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Neu generieren
              </Button>
              <Button
                onClick={handleLock}
                disabled={processing}
                variant="outline"
              >
                <Lock className="h-4 w-4 mr-2" />
                Sperren
              </Button>
            </>
          )}
          {balanceSheet && balanceSheet.locked && !balanceSheet.approved && (
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Freigeben
            </Button>
          )}
          <Button
            onClick={() => window.print()}
            variant="outline"
          >
            <Printer className="h-4 w-4 mr-2" />
            Drucken
          </Button>
        </div>
      </div>

      {balanceSheet?.approved && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Freigegeben</span>
            {balanceSheet.approvedBy && (
              <span className="text-sm">
                von {balanceSheet.approvedBy} am{' '}
                {new Date(balanceSheet.approvedAt!).toLocaleDateString('de-DE')}
              </span>
            )}
          </div>
        </div>
      )}

      {balanceSheet?.locked && !balanceSheet.approved && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <div className="flex items-center gap-2 text-yellow-800">
            <Lock className="h-5 w-5" />
            <span className="font-semibold">Gesperrt - Warten auf Freigabe</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktiva */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">Aktiva</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">A. Anlagevermögen</h3>
              <div className="space-y-1 ml-4">
                <div className="flex justify-between">
                  <span>I. Immaterielle Vermögensgegenstände</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>II. Sachanlagen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.aktiva.anlagevermoegen.sachanlagen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>III. Finanzanlagen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.aktiva.anlagevermoegen.finanzanlagen || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">B. Umlaufvermögen</h3>
              <div className="space-y-1 ml-4">
                <div className="flex justify-between">
                  <span>I. Vorräte</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.aktiva.umlaufvermoegen.vorraete || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>II. Forderungen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.aktiva.umlaufvermoegen.forderungen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>III. Kasse, Bank</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.aktiva.umlaufvermoegen.kasseBank || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold">C. Rechnungsabgrenzungsposten</span>
              <span className="font-mono">
                {formatEUR(balanceSheet?.aktiva.rechnungsabgrenzungsposten || 0)}
              </span>
            </div>

            <div className="flex justify-between pt-4 border-t-2 border-black font-bold text-lg">
              <span>Summe Aktiva</span>
              <span className="font-mono">{formatEUR(calculateActivaTotal())}</span>
            </div>
          </div>
        </Card>

        {/* Passiva */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4 border-b pb-2">Passiva</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">A. Eigenkapital</h3>
              <div className="space-y-1 ml-4">
                <div className="flex justify-between">
                  <span>I. Gezeichnetes Kapital</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.eigenkapital.gezeichnetesKapital || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>II. Kapitalrücklagen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.eigenkapital.kapitalruecklagen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>III. Gewinnrücklagen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.eigenkapital.gewinnruecklagen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>IV. Jahresüberschuss</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.eigenkapital.jahresueberschuss || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">B. Rückstellungen</h3>
              <div className="space-y-1 ml-4">
                <div className="flex justify-between">
                  <span>I. Pensionsrückstellungen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.rueckstellungen.pensionsrueckstellungen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>II. Steuerrückstellungen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.rueckstellungen.steuerrueckstellungen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>III. Sonstige Rückstellungen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.rueckstellungen.sonstigeRueckstellungen || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">C. Verbindlichkeiten</h3>
              <div className="space-y-1 ml-4">
                <div className="flex justify-between">
                  <span>I. Anleihen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.verbindlichkeiten.anleihen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>II. Verbindlichkeiten Kreditinstitute</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>III. Erhaltene Anzahlungen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.verbindlichkeiten.erhalteneAnzahlungen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>IV. Verbindlichkeiten Lieferungen</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.verbindlichkeiten.verbindlichkeitenLieferungen || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>V. Sonstige Verbindlichkeiten</span>
                  <span className="font-mono">
                    {formatEUR(balanceSheet?.passiva.verbindlichkeiten.sonstigeVerbindlichkeiten || 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="font-semibold">D. Rechnungsabgrenzungsposten</span>
              <span className="font-mono">
                {formatEUR(balanceSheet?.passiva.rechnungsabgrenzungsposten || 0)}
              </span>
            </div>

            <div className="flex justify-between pt-4 border-t-2 border-black font-bold text-lg">
              <span>Summe Passiva</span>
              <span className="font-mono">{formatEUR(calculatePassivaTotal())}</span>
            </div>
          </div>
        </Card>
      </div>

      {balanceSheet && Math.abs(calculateActivaTotal() - calculatePassivaTotal()) > 0.01 && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded print-hide">
          <div className="text-red-800 font-semibold">
            ⚠️ Warnung: Aktiva und Passiva sind nicht ausgeglichen!
            Differenz: {formatEUR(calculateActivaTotal() - calculatePassivaTotal())}
          </div>
        </div>
      )}

      {/* Print-only content */}
      <div id="print-content" className="hidden print:block">
        <div className="print-header">
          <h1 className="text-2xl font-bold">BILANZ</h1>
          <p className="text-lg">zum 31. Dezember {selectedYear}</p>
          <p className="text-sm mt-2">Bereifung24 GmbH</p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>AKTIVA</th>
              <th style={{ width: '20%', textAlign: 'right' }}>EUR</th>
              <th style={{ width: '30%' }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3}><strong>A. ANLAGEVERMÖGEN</strong></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>I. Immaterielle Vermögensgegenstände</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>II. Sachanlagen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.aktiva.anlagevermoegen.sachanlagen || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>III. Finanzanlagen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.aktiva.anlagevermoegen.finanzanlagen || 0)}</td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>Summe Anlagevermögen</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((balanceSheet?.aktiva.anlagevermoegen.immaterielleVermoegensgegenstaende || 0) + 
                          (balanceSheet?.aktiva.anlagevermoegen.sachanlagen || 0) + 
                          (balanceSheet?.aktiva.anlagevermoegen.finanzanlagen || 0))}
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={3}><strong>B. UMLAUFVERMÖGEN</strong></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>I. Vorräte</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.aktiva.umlaufvermoegen.vorraete || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>II. Forderungen und sonstige Vermögensgegenstände</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.aktiva.umlaufvermoegen.forderungen || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>III. Kassenbestand, Guthaben bei Kreditinstituten</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.aktiva.umlaufvermoegen.kasseBank || 0)}</td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>Summe Umlaufvermögen</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((balanceSheet?.aktiva.umlaufvermoegen.vorraete || 0) + 
                          (balanceSheet?.aktiva.umlaufvermoegen.forderungen || 0) + 
                          (balanceSheet?.aktiva.umlaufvermoegen.kasseBank || 0))}
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={3}><strong>C. RECHNUNGSABGRENZUNGSPOSTEN</strong></td>
            </tr>
            <tr>
              <td></td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.aktiva.rechnungsabgrenzungsposten || 0)}</td>
              <td></td>
            </tr>
            <tr className="print-total">
              <td><strong>SUMME AKTIVA</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{formatEUR(calculateActivaTotal())}</strong></td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <table className="print-table" style={{ marginTop: '40px' }}>
          <thead>
            <tr>
              <th style={{ width: '50%' }}>PASSIVA</th>
              <th style={{ width: '20%', textAlign: 'right' }}>EUR</th>
              <th style={{ width: '30%' }}></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3}><strong>A. EIGENKAPITAL</strong></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>I. Gezeichnetes Kapital</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.eigenkapital.stammkapital || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>II. Kapitalrücklage</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.eigenkapital.kapitalruecklage || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>III. Gewinnrücklagen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.eigenkapital.gewinnruecklagen || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>IV. Gewinnvortrag/Verlustvortrag</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.eigenkapital.gewinnvortrag || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>V. Jahresüberschuss/Jahresfehlbetrag</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.eigenkapital.jahresueberschuss || 0)}</td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>Summe Eigenkapital</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((balanceSheet?.passiva.eigenkapital.stammkapital || 0) + 
                          (balanceSheet?.passiva.eigenkapital.kapitalruecklage || 0) + 
                          (balanceSheet?.passiva.eigenkapital.gewinnruecklagen || 0) + 
                          (balanceSheet?.passiva.eigenkapital.gewinnvortrag || 0) + 
                          (balanceSheet?.passiva.eigenkapital.jahresueberschuss || 0))}
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={3}><strong>B. RÜCKSTELLUNGEN</strong></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>1. Rückstellungen für Pensionen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.rueckstellungen.pensionsrueckstellungen || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>2. Steuerrückstellungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.rueckstellungen.steuerrueckstellungen || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>3. Sonstige Rückstellungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.rueckstellungen.sonstigeRueckstellungen || 0)}</td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>Summe Rückstellungen</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((balanceSheet?.passiva.rueckstellungen.pensionsrueckstellungen || 0) + 
                          (balanceSheet?.passiva.rueckstellungen.steuerrueckstellungen || 0) + 
                          (balanceSheet?.passiva.rueckstellungen.sonstigeRueckstellungen || 0))}
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={3}><strong>C. VERBINDLICHKEITEN</strong></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>1. Verbindlichkeiten gegenüber Kreditinstituten</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>2. Erhaltene Anzahlungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.verbindlichkeiten.erhalteneAnzahlungen || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>3. Verbindlichkeiten aus Lieferungen und Leistungen</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.verbindlichkeiten.verbindlichkeitenLieferungenLeistungen || 0)}</td>
              <td></td>
            </tr>
            <tr>
              <td style={{ paddingLeft: '20px' }}>4. Sonstige Verbindlichkeiten</td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.verbindlichkeiten.sonstigeVerbindlichkeiten || 0)}</td>
              <td></td>
            </tr>
            <tr style={{ fontWeight: 'bold' }}>
              <td>Summe Verbindlichkeiten</td>
              <td style={{ textAlign: 'right' }}>
                {formatEUR((balanceSheet?.passiva.verbindlichkeiten.verbindlichkeitenKreditinstitute || 0) + 
                          (balanceSheet?.passiva.verbindlichkeiten.erhalteneAnzahlungen || 0) + 
                          (balanceSheet?.passiva.verbindlichkeiten.verbindlichkeitenLieferungenLeistungen || 0) + 
                          (balanceSheet?.passiva.verbindlichkeiten.sonstigeVerbindlichkeiten || 0))}
              </td>
              <td></td>
            </tr>
            <tr>
              <td colSpan={3}><strong>D. RECHNUNGSABGRENZUNGSPOSTEN</strong></td>
            </tr>
            <tr>
              <td></td>
              <td style={{ textAlign: 'right' }}>{formatEUR(balanceSheet?.passiva.rechnungsabgrenzungsposten || 0)}</td>
              <td></td>
            </tr>
            <tr className="print-total">
              <td><strong>SUMME PASSIVA</strong></td>
              <td style={{ textAlign: 'right' }}><strong>{formatEUR(calculatePassivaTotal())}</strong></td>
              <td></td>
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
