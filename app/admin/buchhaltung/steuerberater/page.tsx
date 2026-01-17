'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Save, Mail, FileText, Calculator, BookOpen, Settings } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AccountantSettings {
  name: string
  email: string
  company: string
  address: string
  phone: string
  taxNumber: string
}

export default function SteuerberaterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [year, setYear] = useState(new Date().getFullYear() - 1)
  const [sender, setSender] = useState('')
  const [format, setFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [message, setMessage] = useState('')
  
  // What to send
  const [sendBalanceSheet, setSendBalanceSheet] = useState(true)
  const [sendIncomeStatement, setSendIncomeStatement] = useState(true)
  const [sendJournal, setSendJournal] = useState(false)
  
  // Accountant settings
  const [settings, setSettings] = useState<AccountantSettings>({
    name: '',
    email: '',
    company: '',
    address: '',
    phone: '',
    taxNumber: ''
  })

  // Available years
  const currentYear = new Date().getFullYear()
  const startYear = 2025
  const availableYears = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => startYear + i
  ).reverse()

  useEffect(() => {
    loadSettings()
    loadUserName()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/accounting/accountant-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setSettings(data.data)
        }
      }
    } catch (error) {
      console.error('Error loading accountant settings:', error)
    }
  }

  const loadUserName = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const session = await response.json()
        if (session?.user?.name) {
          setSender(session.user.name)
        }
      }
    } catch (error) {
      console.error('Error loading user name:', error)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/accounting/accountant-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      
      if (response.ok) {
        alert('Steuerberater-Einstellungen gespeichert!')
      } else {
        alert('Fehler beim Speichern der Einstellungen')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleSend = async () => {
    // Validation
    if (!settings.email) {
      alert('Bitte Steuerberater-Email angeben!')
      return
    }
    
    if (!sender.trim()) {
      alert('Bitte Absender-Name angeben!')
      return
    }
    
    if (!sendBalanceSheet && !sendIncomeStatement && !sendJournal) {
      alert('Bitte mindestens ein Dokument auswählen!')
      return
    }

    const documents = []
    if (sendBalanceSheet) documents.push('Bilanz')
    if (sendIncomeStatement) documents.push('GuV')
    if (sendJournal) documents.push('Journal')

    const confirmMessage = `Folgende Dokumente für ${year} als ${format.toUpperCase()} an ${settings.name || settings.email} senden?\n\n${documents.join(', ')}\n\nAbsender: ${sender}`
    
    if (!confirm(confirmMessage)) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/accounting/send-to-accountant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          sender,
          format,
          message,
          documents: {
            balanceSheet: sendBalanceSheet,
            incomeStatement: sendIncomeStatement,
            journal: sendJournal
          },
          accountant: settings
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        alert('Dokumente wurden erfolgreich an den Steuerberater gesendet!')
        
        // Reset message
        setMessage('')
      } else {
        const error = await response.json()
        alert(`Fehler beim Versand: ${error.error || 'Unbekannter Fehler'}`)
      }
    } catch (error) {
      console.error('Error sending to accountant:', error)
      alert('Fehler beim Versand der Dokumente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Steuerberater-Kommunikation
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Dokumente an den Steuerberater senden
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Send Documents */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Dokumente auswählen
                </CardTitle>
                <CardDescription>
                  Welche Dokumente möchten Sie versenden?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Year Selection */}
                <div className="space-y-2">
                  <Label>Geschäftsjahr</Label>
                  <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Documents */}
                <div className="space-y-3 border-t pt-4">
                  <Label>Dokumente</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="bilanz"
                      checked={sendBalanceSheet}
                      onCheckedChange={(checked) => setSendBalanceSheet(checked as boolean)}
                    />
                    <label
                      htmlFor="bilanz"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        <span>Bilanz (§266 HGB)</span>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="guv"
                      checked={sendIncomeStatement}
                      onCheckedChange={(checked) => setSendIncomeStatement(checked as boolean)}
                    />
                    <label
                      htmlFor="guv"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calculator className="h-4 w-4 text-green-600" />
                        <span>GuV (§275 HGB)</span>
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="journal"
                      checked={sendJournal}
                      onCheckedChange={(checked) => setSendJournal(checked as boolean)}
                    />
                    <label
                      htmlFor="journal"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-600" />
                        <span>Laufende Buchhaltung (Journal)</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Format */}
                <div className="space-y-2 border-t pt-4">
                  <Label>Export-Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as 'pdf' | 'excel' | 'csv')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel (XLSX)</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sender */}
                <div className="space-y-2 border-t pt-4">
                  <Label htmlFor="sender">Absender (Ihr Name)</Label>
                  <Input
                    id="sender"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                    placeholder="Max Mustermann"
                  />
                  <p className="text-xs text-gray-500">
                    Dieser Name erscheint in der Email als Absender
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Nachricht (optional)</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Zusätzliche Informationen für den Steuerberater..."
                    rows={4}
                  />
                </div>

                {/* Send Button */}
                <div className="pt-4">
                  <Button
                    onClick={handleSend}
                    disabled={loading || !settings.email}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Sende...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        An Steuerberater senden
                      </>
                    )}
                  </Button>
                  {!settings.email && (
                    <p className="text-xs text-red-600 mt-2 text-center">
                      Bitte erst Steuerberater-Email hinterlegen →
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Accountant Settings */}
          <div className="space-y-6">
            {/* Steuerberater Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Steuerberater-Daten
                </CardTitle>
                <CardDescription>
                  Kontaktdaten Ihres Steuerberaters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="accountant-name">Name *</Label>
                  <Input
                    id="accountant-name"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    placeholder="Dr. Hans Steuer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountant-email">Email *</Label>
                  <Input
                    id="accountant-email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    placeholder="steuer@kanzlei.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountant-company">Kanzlei / Firma</Label>
                  <Input
                    id="accountant-company"
                    value={settings.company}
                    onChange={(e) => setSettings({ ...settings, company: e.target.value })}
                    placeholder="Steuerkanzlei Mustermann"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountant-address">Adresse</Label>
                  <Textarea
                    id="accountant-address"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    placeholder="Steuerstraße 123&#10;12345 Musterstadt"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountant-phone">Telefon</Label>
                  <Input
                    id="accountant-phone"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    placeholder="+49 123 456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountant-tax">Steuernummer</Label>
                  <Input
                    id="accountant-tax"
                    value={settings.taxNumber}
                    onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                    placeholder="123/456/78900"
                  />
                </div>

                <Button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  variant="outline"
                  className="w-full"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Speichere...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Einstellungen speichern
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Mail className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-2">Email-Versand</p>
                    <p className="text-xs">
                      Die Dokumente werden über Ihre hinterlegten SMTP-Einstellungen versendet.
                      Diese können Sie unter <strong>Admin → Einstellungen → Email</strong> konfigurieren.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
