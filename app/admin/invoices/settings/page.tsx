'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Upload, Trash2, Save } from 'lucide-react'
import Link from 'next/link'
import BackButton from '@/components/BackButton'

interface Settings {
  id: string
  companyName: string
  companyStreet?: string
  companyZip?: string
  companyCity?: string
  companyCountry: string
  taxId?: string
  taxNumber?: string
  registerCourt?: string
  registerNumber?: string
  managingDirector?: string
  email?: string
  phone?: string
  website: string
  bankName?: string
  iban?: string
  bic?: string
  gocardlessCreditorId?: string
  logoUrl?: string
  footerText?: string
}

export default function InvoiceSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/invoices/settings')
      if (response.ok) {
        const result = await response.json()
        setSettings(result.data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/invoices/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        alert('Einstellungen gespeichert!')
      } else {
        alert('Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/admin/invoices/settings/upload-logo', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const result = await response.json()
        setSettings({ ...settings!, logoUrl: result.data.logoUrl })
        alert('Logo hochgeladen!')
      } else {
        alert('Fehler beim Upload')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Fehler beim Upload')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleDeleteLogo = async () => {
    if (!confirm('Logo wirklich löschen?')) return

    try {
      const response = await fetch('/api/admin/invoices/settings/upload-logo', {
        method: 'DELETE'
      })

      if (response.ok) {
        setSettings({ ...settings!, logoUrl: undefined })
        alert('Logo gelöscht!')
      }
    } catch (error) {
      console.error('Error deleting logo:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Einstellungen...</div>
        </div>
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold">Rechnungseinstellungen</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Speichere...' : 'Speichern'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Firmenlogo</h2>
          <div className="space-y-4">
            {settings.logoUrl && (
              <div className="flex items-center gap-4">
                <img src={settings.logoUrl} alt="Logo" className="h-20 object-contain border p-2 rounded" />
                <Button variant="destructive" size="sm" onClick={handleDeleteLogo}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </Button>
              </div>
            )}
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
                <div className="inline-flex items-center px-4 py-2 border rounded hover:bg-gray-50">
                  <Upload className="h-4 w-4 mr-2" />
                  {uploadingLogo ? 'Uploading...' : 'Logo hochladen'}
                </div>
              </label>
              <p className="text-sm text-gray-600 mt-2">PNG, JPG oder SVG. Max 2MB.</p>
            </div>
          </div>
        </Card>

        {/* Company Data */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Firmendaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Firmenname *</label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Straße & Hausnummer</label>
              <input
                type="text"
                value={settings.companyStreet || ''}
                onChange={(e) => setSettings({ ...settings, companyStreet: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PLZ</label>
              <input
                type="text"
                value={settings.companyZip || ''}
                onChange={(e) => setSettings({ ...settings, companyZip: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stadt</label>
              <input
                type="text"
                value={settings.companyCity || ''}
                onChange={(e) => setSettings({ ...settings, companyCity: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-Mail</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefon</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="text"
                value={settings.website}
                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Geschäftsführung</label>
              <input
                type="text"
                value={settings.managingDirector || ''}
                onChange={(e) => setSettings({ ...settings, managingDirector: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </Card>

        {/* Tax Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Steuerdaten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">USt-IdNr.</label>
              <input
                type="text"
                value={settings.taxId || ''}
                onChange={(e) => setSettings({ ...settings, taxId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Steuernummer</label>
              <input
                type="text"
                value={settings.taxNumber || ''}
                onChange={(e) => setSettings({ ...settings, taxNumber: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registergericht</label>
              <input
                type="text"
                value={settings.registerCourt || ''}
                onChange={(e) => setSettings({ ...settings, registerCourt: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registernummer</label>
              <input
                type="text"
                value={settings.registerNumber || ''}
                onChange={(e) => setSettings({ ...settings, registerNumber: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </Card>

        {/* Bank Info */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Bankverbindung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Bankname</label>
              <input
                type="text"
                value={settings.bankName || ''}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">IBAN</label>
              <input
                type="text"
                value={settings.iban || ''}
                onChange={(e) => setSettings({ ...settings, iban: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">BIC</label>
              <input
                type="text"
                value={settings.bic || ''}
                onChange={(e) => setSettings({ ...settings, bic: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">GoCardless Gläubiger-ID</label>
              <input
                type="text"
                value={settings.gocardlessCreditorId || ''}
                onChange={(e) => setSettings({ ...settings, gocardlessCreditorId: e.target.value })}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>
        </Card>

        {/* Footer */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Fußzeile (optional)</h2>
          <textarea
            value={settings.footerText || ''}
            onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder="z.B. zusätzliche rechtliche Hinweise"
          />
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Speichere...' : 'Alle Änderungen speichern'}
        </Button>
      </div>
    </div>
  )
}
