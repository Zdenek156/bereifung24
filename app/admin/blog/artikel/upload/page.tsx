'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import BackButton from '@/components/BackButton'

interface UploadResult {
  success: boolean
  created: number
  skipped: number
  errors: string[]
  articles?: Array<{ title: string; slug: string }>
}

export default function BlogUploadPage() {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setSelectedFile(file)
        setResult(null)
      } else {
        alert('Bitte nur Excel-Dateien (.xlsx oder .xls) hochladen')
        e.target.value = ''
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/admin/blog/upload-excel', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setResult({
          success: false,
          created: 0,
          skipped: 0,
          errors: [data.error || 'Upload fehlgeschlagen']
        })
      }
    } catch (error) {
      console.error('Upload error:', error)
      setResult({
        success: false,
        created: 0,
        skipped: 0,
        errors: ['Netzwerkfehler beim Upload']
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Blog-Artikel aus Excel importieren</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Excel-Datei hochladen
          </h2>

          <div className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-upload"
                disabled={uploading}
              />
              <label
                htmlFor="excel-upload"
                className="cursor-pointer text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Excel-Datei auswählen
              </label>
              <p className="text-sm text-gray-500 mt-2">
                Unterstützte Formate: .xlsx, .xls
              </p>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm font-medium">Ausgewählte Datei:</p>
                <p className="text-sm text-gray-600">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importiere Artikel...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Artikel importieren
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Instructions Card */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">📋 Anleitung</h2>
          
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Excel-Struktur:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Jedes Sheet = 1 Blog-Artikel</li>
                <li>Sheet-Name = Stadt/Thema (z.B. "Ludwigsburg")</li>
                <li>Zeile 3 enthält den HTML-Content</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Automatisch erstellt:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Titel aus H1-Tag extrahiert</li>
                <li>Slug aus Sheet-Name generiert</li>
                <li>Kategorie: "Regional"</li>
                <li>Tags aus Stadt-Namen</li>
                <li>Excerpt aus lead-Paragraph</li>
                <li>Lesezeit automatisch berechnet</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Status:</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Alle Artikel werden als DRAFT erstellt</li>
                <li>Du kannst sie danach bearbeiten und veröffentlichen</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <p className="text-xs text-blue-800">
                💡 <strong>Tipp:</strong> Bestehende Artikel mit gleichem Slug werden übersprungen
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Result Card */}
      {result && (
        <Card className="p-6 mt-6">
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-2">
                {result.success ? 'Import erfolgreich!' : 'Import mit Fehlern'}
              </h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-2xl font-bold text-green-600">{result.created}</p>
                  <p className="text-sm text-gray-600">Erstellt</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded">
                  <p className="text-2xl font-bold text-yellow-600">{result.skipped}</p>
                  <p className="text-sm text-gray-600">Übersprungen</p>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-2xl font-bold text-red-600">{result.errors.length}</p>
                  <p className="text-sm text-gray-600">Fehler</p>
                </div>
              </div>

              {result.articles && result.articles.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Erstellte Artikel:</h4>
                  <div className="space-y-1">
                    {result.articles.map((article, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{article.title}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-600 font-mono">/ratgeber/{article.slug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Fehler:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                    {result.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
