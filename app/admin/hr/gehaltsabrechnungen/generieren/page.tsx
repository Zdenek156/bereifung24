'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, AlertCircle, Check } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import { useRouter } from 'next/navigation'

export default function GehaltsabrechnungGenerierenPage() {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]

  // Years from 2025 to current year
  const currentYear = new Date().getFullYear()
  const years = Array.from(
    { length: currentYear - 2025 + 1 },
    (_, i) => 2025 + i
  ).reverse()

  const handlePreview = async () => {
    setGenerating(true)
    try {
      const response = await fetch('/api/admin/hr/payrolls/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      })

      if (response.ok) {
        const data = await response.json()
        setPreview(data)
        setShowPreview(true)
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Vorschau konnte nicht geladen werden'}`)
      }
    } catch (error) {
      console.error('Error previewing payroll:', error)
      alert('Fehler beim Laden der Vorschau')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerate = async () => {
    if (!confirm(`Gehaltsabrechnung für ${months[selectedMonth - 1]} ${selectedYear} wirklich erstellen?`)) {
      return
    }

    setGenerating(true)
    try {
      const response = await fetch('/api/admin/hr/payrolls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert('Gehaltsabrechnung erfolgreich erstellt!')
        router.push(`/admin/hr/gehaltsabrechnungen/${data.id}`)
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error || 'Abrechnung konnte nicht erstellt werden'}`)
      }
    } catch (error) {
      console.error('Error generating payroll:', error)
      alert('Fehler beim Erstellen der Abrechnung')
    } finally {
      setGenerating(false)
    }
  }

  const formatEUR = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  return (
    <PermissionGuard applicationKey="hr">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold">Gehaltsabrechnung generieren</h1>
            <p className="text-gray-600 mt-1">Monatsabrechnung für alle Mitarbeiter erstellen</p>
          </div>
        </div>

        {/* Selection Card */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Abrechnungszeitraum auswählen</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monat
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jahr
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full border rounded px-3 py-2"
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handlePreview}
              disabled={generating}
              variant="outline"
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Lade Vorschau...' : 'Vorschau anzeigen'}
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              {generating ? 'Erstelle...' : 'Abrechnung erstellen'}
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Hinweis zur Abrechnung:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Es werden alle aktiven Mitarbeiter berücksichtigt</li>
                <li>Brutto- und Nettogehälter werden aus den Mitarbeiterdaten berechnet</li>
                <li>Arbeitgeberanteile (Sozialversicherung) werden automatisch kalkuliert</li>
                <li>Die Abrechnung wird zunächst als Entwurf erstellt</li>
                <li>Entwürfe können vor der Freigabe noch bearbeitet werden</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Preview */}
        {showPreview && preview && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">
              Vorschau: {months[selectedMonth - 1]} {selectedYear}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Anzahl Mitarbeiter</p>
                <p className="text-2xl font-bold">{preview.employeeCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Brutto gesamt</p>
                <p className="text-2xl font-bold">{formatEUR(preview.totalGross)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-600">Netto gesamt</p>
                <p className="text-2xl font-bold">{formatEUR(preview.totalNet)}</p>
              </div>
            </div>

            {/* Employee List */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Mitarbeiter</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Brutto</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Netto</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">AG-Anteil</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.employees && preview.employees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                          <p className="text-sm text-gray-600">{emp.position}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{formatEUR(emp.grossSalary)}</td>
                      <td className="px-4 py-3 text-right">{formatEUR(emp.netSalary)}</td>
                      <td className="px-4 py-3 text-right">{formatEUR(emp.employerContribution)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                onClick={() => setShowPreview(false)}
                variant="outline"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-2" />
                Jetzt erstellen
              </Button>
            </div>
          </Card>
        )}
      </div>
    </PermissionGuard>
  )
}
