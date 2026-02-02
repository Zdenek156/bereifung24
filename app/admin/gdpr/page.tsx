'use client'

import { useState } from 'react'
import { Download, FileJson, FileText, Search, Shield, AlertCircle, CheckCircle, Mail } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'

export default function GDPRExportPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    hasData?: boolean
  } | null>(null)

  const handleExport = async (format: 'json' | 'pdf') => {
    if (!email) {
      setResult({
        success: false,
        message: 'Bitte geben Sie eine E-Mail-Adresse ein'
      })
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setResult({
        success: false,
        message: 'Ungültige E-Mail-Adresse'
      })
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await fetch(`/api/admin/gdpr/export?email=${encodeURIComponent(email)}&format=${format}`)
      
      if (response.ok) {
        // Download file
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `gdpr-export-${email}-${Date.now()}.${format === 'json' ? 'json' : 'pdf'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        setResult({
          success: true,
          message: `Datenexport erfolgreich als ${format.toUpperCase()} heruntergeladen!`,
          hasData: true
        })
      } else {
        const error = await response.json()
        setResult({
          success: false,
          message: error.error || 'Fehler beim Exportieren der Daten',
          hasData: false
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      setResult({
        success: false,
        message: 'Netzwerkfehler beim Exportieren der Daten'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              DSGVO Datenexport
            </h1>
            <p className="text-gray-600 mt-1">
              Art. 15 DSGVO - Auskunftsrecht für betroffene Personen
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <Card className="p-6 mb-8 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Über diese Funktion</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              Hier können Sie alle bei uns gespeicherten personenbezogenen Daten eines Nutzers exportieren. 
              Dies dient zur Erfüllung von Auskunftsanfragen nach Art. 15 DSGVO (Recht auf Auskunft). 
              Der Export enthält alle Daten aus allen Systembereichen (Kunde, Werkstatt, Mitarbeiter).
            </p>
          </div>
        </div>
      </Card>

      {/* Main Export Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Export Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Search className="h-5 w-5" />
              Datenexport durchführen
            </h2>

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  E-Mail-Adresse der betroffenen Person
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="beispiel@email.de"
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Geben Sie die E-Mail-Adresse ein, für die Sie alle gespeicherten Daten exportieren möchten.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleExport('json')}
                  disabled={loading || !email}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  <FileJson className="h-5 w-5 mr-2" />
                  {loading ? 'Exportiere...' : 'Als JSON exportieren'}
                </Button>

                <Button
                  onClick={() => handleExport('pdf')}
                  disabled={loading || !email}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  {loading ? 'Exportiere...' : 'Als PDF exportieren'}
                </Button>
              </div>

              {/* Result Message */}
              {result && (
                <div className={`p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <p className={result.success ? 'text-green-800' : 'text-red-800'}>
                      {result.message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Export Info */}
          <Card className="p-6 mt-6">
            <h3 className="font-semibold text-gray-900 mb-3">📋 Was wird exportiert?</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Stammdaten:</strong> Name, E-Mail, Adresse, Telefon, Registrierungsdatum</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Fahrzeuge:</strong> Alle registrierten Fahrzeuge mit Reifenhistorie</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Anfragen:</strong> Alle Reifen- und Serviceanfragen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Angebote:</strong> Erhaltene oder erstellte Angebote</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Buchungen:</strong> Alle Terminbuchungen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Bewertungen:</strong> Abgegebene Reviews</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>SEPA-Mandate:</strong> Lastschriftvereinbarungen (nur Werkstätten)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Provisionen:</strong> Abrechnungen und Rechnungen (nur Werkstätten)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>HR-Daten:</strong> Verträge, Urlaube, Spesen (nur Mitarbeiter)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span><strong>Login-Historie:</strong> Letzte 50 Login-Vorgänge</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Right: Legal Info */}
        <div className="space-y-6">
          {/* GDPR Info */}
          <Card className="p-6 bg-gray-50">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Rechtliche Grundlagen
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-semibold text-gray-900">Art. 15 DSGVO</p>
                <p className="text-gray-600">
                  Recht auf Auskunft durch den Verantwortlichen
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Art. 20 DSGVO</p>
                <p className="text-gray-600">
                  Recht auf Datenübertragbarkeit
                </p>
              </div>
            </div>
          </Card>

          {/* Format Info */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">📄 Export-Formate</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <FileJson className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">JSON</p>
                  <p className="text-gray-600">
                    Maschinenlesbar, vollständige Rohdaten, alle Details
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">PDF</p>
                  <p className="text-gray-600">
                    Menschenlesbar, formatiert, Übersicht mit Statistiken
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Response Times */}
          <Card className="p-6 bg-yellow-50 border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">⏱️ Hinweis</h3>
            <p className="text-sm text-gray-700">
              Nach DSGVO Art. 12 Abs. 3 müssen Auskunftsanfragen 
              <strong> innerhalb von 1 Monat</strong> beantwortet werden. 
              Diese Funktion ermöglicht eine sofortige Auskunft.
            </p>
          </Card>

          {/* Contact */}
          <Card className="p-6 bg-green-50 border-green-200">
            <h3 className="font-semibold text-gray-900 mb-2">📧 Kontakt</h3>
            <p className="text-sm text-gray-700 mb-2">
              Für Datenschutzfragen:
            </p>
            <p className="text-sm">
              <a href="mailto:datenschutz@bereifung24.de" className="text-blue-600 hover:underline font-semibold">
                datenschutz@bereifung24.de
              </a>
            </p>
            <p className="text-sm">
              <a href="tel:+4971479679990" className="text-blue-600 hover:underline font-semibold">
                +49 7147 9679990
              </a>
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
