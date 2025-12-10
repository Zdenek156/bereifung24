'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface PricingSettings {
  id: string
  // Auto Reifen
  autoManualPricing: boolean
  autoFixedMarkup: number
  autoPercentMarkup: number
  autoIncludeVat: boolean
  // Motorrad Reifen
  motoManualPricing: boolean
  motoFixedMarkup: number
  motoPercentMarkup: number
  motoIncludeVat: boolean
  // Batterie
  batteryManualPricing: boolean
  batteryFixedMarkup: number
  batteryPercentMarkup: number
  batteryIncludeVat: boolean
  // Bremsen
  brakeManualPricing: boolean
  brakeFixedMarkup: number
  brakePercentMarkup: number
  brakeIncludeVat: boolean
  // Andere Services
  serviceManualPricing: boolean
  serviceFixedMarkup: number
  servicePercentMarkup: number
  serviceIncludeVat: boolean
}

export default function PricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<PricingSettings>({
    id: '',
    autoManualPricing: true,
    autoFixedMarkup: 0,
    autoPercentMarkup: 0,
    autoIncludeVat: false,
    motoManualPricing: true,
    motoFixedMarkup: 0,
    motoPercentMarkup: 0,
    motoIncludeVat: false,
    batteryManualPricing: true,
    batteryFixedMarkup: 0,
    batteryPercentMarkup: 0,
    batteryIncludeVat: false,
    brakeManualPricing: true,
    brakeFixedMarkup: 0,
    brakePercentMarkup: 0,
    brakeIncludeVat: false,
    serviceManualPricing: true,
    serviceFixedMarkup: 0,
    servicePercentMarkup: 0,
    serviceIncludeVat: false
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'WORKSHOP') {
      router.push('/dashboard')
      return
    }
    fetchSettings()
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/workshop/pricing-settings')
      if (response.ok) {
        const data = await response.json()
        if (data.settings) {
          setSettings(data.settings)
        }
      }
    } catch (error) {
      console.error('Error fetching pricing settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/workshop/pricing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        alert('Einstellungen erfolgreich gespeichert!')
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }

  const calculateExample = (costPrice: number, manual: boolean, fixed: number, percent: number, includeVat: boolean) => {
    if (manual) return costPrice
    
    let sellingPrice = costPrice + fixed
    sellingPrice = sellingPrice * (1 + percent / 100)
    
    if (includeVat) {
      sellingPrice = sellingPrice * 1.19
    }
    
    return sellingPrice
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link
              href="/dashboard/workshop"
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Preiskalkulation</h1>
              <p className="mt-1 text-sm text-gray-600">Automatische Berechnung von Reifen- und Servicepreisen</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informationsbox */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">So funktioniert die Preiskalkulation</h3>
              <div className="text-sm text-blue-800 space-y-2">
                <p><strong>Manuelle Preiseingabe:</strong> Sie geben selbst die Brutto-Preise in Ihre Angebote ein. Keine automatische Berechnung.</p>
                <p><strong>Automatische Kalkulation:</strong> Sie geben Ihren Einkaufspreis ein, und das System berechnet automatisch den Verkaufspreis basierend auf:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Fester Aufschlag:</strong> Fixer Betrag in € der zum Einkaufspreis addiert wird (z.B. 20 € pro Reifen)</li>
                  <li><strong>Prozentualer Aufschlag:</strong> Prozentuale Marge auf den Zwischenpreis (z.B. 15% auf Einkaufspreis + fester Aufschlag)</li>
                  <li><strong>MwSt.:</strong> Wählen Sie, ob die berechneten Preise mit oder ohne 19% Mehrwertsteuer im Angebot angezeigt werden</li>
                </ul>
                <p className="mt-3"><strong>Beispielrechnung:</strong> Einkaufspreis 80€, Fester Aufschlag 20€, Prozentualer Aufschlag 19%, ohne MwSt. = <strong>(80 + 20) × 1,19 = 119€</strong></p>
                <p>Mit MwSt.: <strong>119€ × 1,19 = 141,61€</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* Auto Reifen */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              PKW-Reifen (Auto)
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoManualPricing}
                  onChange={(e) => setSettings({ ...settings, autoManualPricing: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  Preise manuell im Angebot eingeben (keine automatische Kalkulation)
                </span>
              </label>
            </div>

            {!settings.autoManualPricing && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fester Aufschlag (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.autoFixedMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, autoFixedMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 20.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prozentualer Aufschlag (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.autoPercentMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, autoPercentMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 19"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.autoIncludeVat}
                      onChange={(e) => setSettings({ ...settings, autoIncludeVat: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Preise im Angebot <strong>mit MwSt.</strong> (19%) anzeigen
                    </span>
                  </label>
                  <p className="ml-8 text-xs text-gray-600 mt-1">
                    Wenn deaktiviert, werden Preise ohne MwSt. angezeigt
                  </p>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Beispielrechnung:</p>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Einkaufspreis: <strong>100,00 €</strong></p>
                    <p className="text-sm text-gray-600">Verkaufspreis: <strong className="text-primary-600">{calculateExample(100, settings.autoManualPricing, settings.autoFixedMarkup, settings.autoPercentMarkup, settings.autoIncludeVat).toFixed(2)} €</strong></p>
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.autoIncludeVat ? 'inkl. MwSt.' : 'zzgl. MwSt.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Motorrad Reifen */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Motorradreifen
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.motoManualPricing}
                  onChange={(e) => setSettings({ ...settings, motoManualPricing: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  Preise manuell im Angebot eingeben (keine automatische Kalkulation)
                </span>
              </label>
            </div>

            {!settings.motoManualPricing && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fester Aufschlag (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.motoFixedMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, motoFixedMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 25.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prozentualer Aufschlag (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.motoPercentMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, motoPercentMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 19"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.motoIncludeVat}
                      onChange={(e) => setSettings({ ...settings, motoIncludeVat: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Preise im Angebot <strong>mit MwSt.</strong> (19%) anzeigen
                    </span>
                  </label>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Beispielrechnung:</p>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Einkaufspreis: <strong>150,00 €</strong></p>
                    <p className="text-sm text-gray-600">Verkaufspreis: <strong className="text-orange-600">{calculateExample(150, settings.motoManualPricing, settings.motoFixedMarkup, settings.motoPercentMarkup, settings.motoIncludeVat).toFixed(2)} €</strong></p>
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.motoIncludeVat ? 'inkl. MwSt.' : 'zzgl. MwSt.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Batterie */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Batterie-Service
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.batteryManualPricing}
                  onChange={(e) => setSettings({ ...settings, batteryManualPricing: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  Preise manuell im Angebot eingeben (keine automatische Kalkulation)
                </span>
              </label>
            </div>

            {!settings.batteryManualPricing && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fester Aufschlag (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.batteryFixedMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, batteryFixedMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 15.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prozentualer Aufschlag (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.batteryPercentMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, batteryPercentMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 25"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.batteryIncludeVat}
                      onChange={(e) => setSettings({ ...settings, batteryIncludeVat: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Preise im Angebot <strong>mit MwSt.</strong> (19%) anzeigen
                    </span>
                  </label>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Beispielrechnung:</p>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Einkaufspreis: <strong>80,00 €</strong></p>
                    <p className="text-sm text-gray-600">Verkaufspreis: <strong className="text-green-600">{calculateExample(80, settings.batteryManualPricing, settings.batteryFixedMarkup, settings.batteryPercentMarkup, settings.batteryIncludeVat).toFixed(2)} €</strong></p>
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.batteryIncludeVat ? 'inkl. MwSt.' : 'zzgl. MwSt.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bremsen */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Bremsen-Service
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.brakeManualPricing}
                  onChange={(e) => setSettings({ ...settings, brakeManualPricing: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  Preise manuell im Angebot eingeben (keine automatische Kalkulation)
                </span>
              </label>
            </div>

            {!settings.brakeManualPricing && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fester Aufschlag (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.brakeFixedMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, brakeFixedMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 30.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prozentualer Aufschlag (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.brakePercentMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, brakePercentMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 30"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.brakeIncludeVat}
                      onChange={(e) => setSettings({ ...settings, brakeIncludeVat: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Preise im Angebot <strong>mit MwSt.</strong> (19%) anzeigen
                    </span>
                  </label>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Beispielrechnung:</p>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Einkaufspreis: <strong>120,00 €</strong></p>
                    <p className="text-sm text-gray-600">Verkaufspreis: <strong className="text-red-600">{calculateExample(120, settings.brakeManualPricing, settings.brakeFixedMarkup, settings.brakePercentMarkup, settings.brakeIncludeVat).toFixed(2)} €</strong></p>
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.brakeIncludeVat ? 'inkl. MwSt.' : 'zzgl. MwSt.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Andere Services */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Andere Services (Reparatur, Wuchten, Achsvermessung, etc.)
            </h2>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.serviceManualPricing}
                  onChange={(e) => setSettings({ ...settings, serviceManualPricing: e.target.checked })}
                  className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="ml-3 text-sm font-medium text-gray-900">
                  Preise manuell im Angebot eingeben (keine automatische Kalkulation)
                </span>
              </label>
            </div>

            {!settings.serviceManualPricing && (
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fester Aufschlag (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={settings.serviceFixedMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, serviceFixedMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 10.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prozentualer Aufschlag (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.servicePercentMarkup || ''}
                      onChange={(e) => setSettings({ ...settings, servicePercentMarkup: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="z.B. 19"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.serviceIncludeVat}
                      onChange={(e) => setSettings({ ...settings, serviceIncludeVat: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">
                      Preise im Angebot <strong>mit MwSt.</strong> (19%) anzeigen
                    </span>
                  </label>
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Beispielrechnung:</p>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-sm text-gray-600">Einkaufspreis: <strong>50,00 €</strong></p>
                    <p className="text-sm text-gray-600">Verkaufspreis: <strong className="text-indigo-600">{calculateExample(50, settings.serviceManualPricing, settings.serviceFixedMarkup, settings.servicePercentMarkup, settings.serviceIncludeVat).toFixed(2)} €</strong></p>
                    <p className="text-xs text-gray-500 mt-1">
                      {settings.serviceIncludeVat ? 'inkl. MwSt.' : 'zzgl. MwSt.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/dashboard/workshop"
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichern...' : 'Einstellungen speichern'}
          </button>
        </div>
      </main>
    </div>
  )
}
