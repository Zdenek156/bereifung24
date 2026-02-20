'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface TirePricingBySize {
  id: string
  rimSize: number
  vehicleType: 'AUTO' | 'MOTO'
  fixedMarkup: number
  percentMarkup: number
  includeVat: boolean
  enabled: boolean
}

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

interface TirePricingForm {
  [key: string]: {
    fixedMarkup: number
    percentMarkup: number
    includeVat: boolean
    enabled: boolean
  }
}

export default function PricingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTirePricing, setSavingTirePricing] = useState(false)
  const [tirePricingBySize, setTirePricingBySize] = useState<TirePricingBySize[]>([])
  
  // Form state for tire pricing (all sizes at once)
  const [tirePricingForm, setTirePricingForm] = useState<TirePricingForm>({})
  
  // Template values for "Apply to all"
  const [autoTemplate, setAutoTemplate] = useState({ fixedMarkup: 0, percentMarkup: 0, includeVat: false, enabled: true })
  const [motoTemplate, setMotoTemplate] = useState({ fixedMarkup: 0, percentMarkup: 0, includeVat: false, enabled: true })
  
  // Expanded sizes state
  const [expandedAutoSizes, setExpandedAutoSizes] = useState<Set<number>>(new Set())
  const [expandedMotoSizes, setExpandedMotoSizes] = useState<Set<number>>(new Set())
  
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
      const [settingsResponse, tirePricingResponse] = await Promise.all([
        fetch('/api/workshop/pricing-settings'),
        fetch('/api/workshop/tire-pricing')
      ])
      
      if (settingsResponse.ok) {
        const data = await settingsResponse.json()
        if (data.settings) {
          // Ensure all fields have default values
          setSettings({
            ...data.settings,
            batteryManualPricing: data.settings.batteryManualPricing ?? true,
            batteryFixedMarkup: data.settings.batteryFixedMarkup ?? 0,
            batteryPercentMarkup: data.settings.batteryPercentMarkup ?? 0,
            batteryIncludeVat: data.settings.batteryIncludeVat ?? false,
            brakeManualPricing: data.settings.brakeManualPricing ?? true,
            brakeFixedMarkup: data.settings.brakeFixedMarkup ?? 0,
            brakePercentMarkup: data.settings.brakePercentMarkup ?? 0,
            brakeIncludeVat: data.settings.brakeIncludeVat ?? false,
            serviceManualPricing: data.settings.serviceManualPricing ?? true,
            serviceFixedMarkup: data.settings.serviceFixedMarkup ?? 0,
            servicePercentMarkup: data.settings.servicePercentMarkup ?? 0,
            serviceIncludeVat: data.settings.serviceIncludeVat ?? false
          })
        }
      }
      
      if (tirePricingResponse.ok) {
        const data = await tirePricingResponse.json()
        if (data.success && data.data) {
          setTirePricingBySize(data.data)
          // Initialize form with existing data
          const formData: TirePricingForm = {}
          data.data.forEach((pricing: TirePricingBySize) => {
            const key = `${pricing.vehicleType}-${pricing.rimSize}`
            formData[key] = {
              fixedMarkup: pricing.fixedMarkup,
              percentMarkup: pricing.percentMarkup,
              includeVat: pricing.includeVat,
              enabled: pricing.enabled ?? true
            }
          })
          setTirePricingForm(formData)
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
      // Add default values for service fields if they don't exist
      const dataToSave = {
        ...settings,
        serviceManualPricing: settings.serviceManualPricing ?? true,
        serviceFixedMarkup: settings.serviceFixedMarkup ?? 0,
        servicePercentMarkup: settings.servicePercentMarkup ?? 0,
        serviceIncludeVat: settings.serviceIncludeVat ?? false
      }
      
      console.log('Sending data:', dataToSave)
      
      const response = await fetch('/api/workshop/pricing-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave)
      })

      if (response.ok) {
        alert('Einstellungen erfolgreich gespeichert!')
      } else {
        const error = await response.json()
        console.error('Validation error:', error)
        alert(`Fehler beim Speichern: ${error.error || 'Unbekannter Fehler'}\n${error.details ? JSON.stringify(error.details) : ''}`)
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

  const updateTirePricingFormValue = (vehicleType: 'AUTO' | 'MOTO', rimSize: number, field: 'fixedMarkup' | 'percentMarkup' | 'includeVat' | 'enabled', value: number | boolean) => {
    const key = `${vehicleType}-${rimSize}`
    setTirePricingForm(prev => ({
      ...prev,
      [key]: {
        ...prev[key] || { fixedMarkup: 0, percentMarkup: 0, includeVat: false, enabled: true },
        [field]: value
      }
    }))
  }

  const applyToAll = (vehicleType: 'AUTO' | 'MOTO') => {
    const template = vehicleType === 'AUTO' ? autoTemplate : motoTemplate
    const newForm: TirePricingForm = { ...tirePricingForm }
    
    for (let size = 13; size <= 23; size++) {
      const key = `${vehicleType}-${size}`
      newForm[key] = { ...template }
    }
    
    setTirePricingForm(newForm)
  }

  const handleSaveTirePricing = async () => {
    setSavingTirePricing(true)
    try {
      const updates = []
      
      for (const [key, values] of Object.entries(tirePricingForm)) {
        const [vehicleType, rimSizeStr] = key.split('-')
        const rimSize = parseInt(rimSizeStr)
        
        // Only save if values are set (not all zeros)
        if (values.fixedMarkup > 0 || values.percentMarkup > 0) {
          updates.push({
            rimSize,
            vehicleType,
            ...values
          })
        }
      }

      // Save all at once
      const promises = updates.map(update =>
        fetch('/api/workshop/tire-pricing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update)
        })
      )

      await Promise.all(promises)
      
      // Refresh data
      const response = await fetch('/api/workshop/tire-pricing')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setTirePricingBySize(data.data)
        }
      }

      alert('Reifenpreise erfolgreich gespeichert!')
    } catch (error) {
      console.error('Error saving tire pricing:', error)
      alert('Fehler beim Speichern der Reifenpreise')
    } finally {
      setSavingTirePricing(false)
    }
  }

  const getTirePricingValue = (vehicleType: 'AUTO' | 'MOTO', rimSize: number) => {
    const key = `${vehicleType}-${rimSize}`
    return tirePricingForm[key] || { fixedMarkup: 0, percentMarkup: 0, includeVat: false, enabled: true }
  }

  const toggleSize = (vehicleType: 'AUTO' | 'MOTO', size: number) => {
    if (vehicleType === 'AUTO') {
      setExpandedAutoSizes(prev => {
        const newSet = new Set(prev)
        if (newSet.has(size)) {
          newSet.delete(size)
        } else {
          newSet.add(size)
        }
        return newSet
      })
    } else {
      setExpandedMotoSizes(prev => {
        const newSet = new Set(prev)
        if (newSet.has(size)) {
          newSet.delete(size)
        } else {
          newSet.add(size)
        }
        return newSet
      })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Link
              href="/dashboard/workshop"
              className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Preiskalkulation</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Automatische Berechnung von Reifen- und Servicepreisen</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Informationsbox */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">So funktioniert die Preiskalkulation für Buchungen</h3>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                <p className="font-medium">Bei Buchungen werden die Einkaufspreise automatisch über Ihre Datenbank oder API-Schnittstelle von Ihrem Großhändler abgerufen. Das System berechnet dann automatisch den Verkaufspreis für Ihre Kunden basierend auf:</p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li><strong>Fester Aufschlag:</strong> Fixer Betrag in € der zum Einkaufspreis addiert wird (z.B. 3 € pro Reifen für Handling und Lagerung)</li>
                  <li><strong>Prozentualer Aufschlag:</strong> Ihre Gewinnmarge in % auf den Zwischenpreis (z.B. 7% Marge)</li>
                  <li><strong>MwSt.:</strong> Wählen Sie diese Option, wenn Ihre Großhändler-Preise bereits MwSt. enthalten oder wenn die Verkaufspreise mit 19% Mehrwertsteuer angezeigt werden sollen</li>
                </ul>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mt-3 border border-blue-200 dark:border-blue-700">
                  <p className="font-semibold mb-1">Beispielrechnung:</p>
                  <p>Einkaufspreis (EK vom Großhändler): <strong>100,00 €</strong></p>
                  <p>+ Fester Aufschlag: <strong>3,00 €</strong> = 103,00 €</p>
                  <p>+ Prozentualer Aufschlag 7%: <strong>7,21 €</strong> = 110,21 €</p>
                  <p className="text-xs mt-2 text-gray-600 dark:text-gray-400">Mit MwSt.: 110,21 € × 1,19 = <strong className="text-primary-600">131,15 €</strong></p>
                </div>
                <p className="mt-3 text-xs"><strong>Tipp:</strong> Sie können für jede Zollgröße (13" - 23") individuelle Aufschläge festlegen und bestimmte Größen deaktivieren, die Sie nicht montieren können.</p>
              </div>
            </div>
          </div>
        </div>
        {/* Tire Pricing by Rim Size */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Reifenpreise nach Zollgröße
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Individuelle Aufschläge für verschiedene Felgengrößen (13" - 23")
            </p>
          </div>
          <div className="p-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Hinweis:</strong> Diese Einstellungen überschreiben die allgemeinen PKW/Motorrad-Einstellungen für spezifische Felgengrößen. 
                    Nutzen Sie "Auf alle anwenden" um schnell alle Größen mit dem gleichen Aufschlag zu konfigurieren.
                  </p>
                </div>
              </div>
            </div>

            {/* PKW Tire Pricing by Size */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  PKW-Reifen (Auto)
                </h3>
              </div>

              {/* Template for "Apply to All" */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border-2 border-primary-200 dark:border-primary-800">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Vorlage für alle PKW-Größen</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fest (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={autoTemplate.fixedMarkup || ''}
                      onChange={(e) => setAutoTemplate({ ...autoTemplate, fixedMarkup: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prozent (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={autoTemplate.percentMarkup || ''}
                      onChange={(e) => setAutoTemplate({ ...autoTemplate, percentMarkup: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoTemplate.includeVat}
                        onChange={(e) => setAutoTemplate({ ...autoTemplate, includeVat: e.target.checked })}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="ml-2 text-xs font-medium text-gray-900 dark:text-white">Mit MwSt.</span>
                    </label>
                  </div>
                  <div>
                    <button
                      onClick={() => applyToAll('AUTO')}
                      className="w-full px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                      Auf alle anwenden
                    </button>
                  </div>
                </div>
              </div>

              {/* List of tire sizes */}
              <div className="space-y-2">
                {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(size => {
                  const values = getTirePricingValue('AUTO', size)
                  const isExpanded = expandedAutoSizes.has(size)
                  const hasValue = values.enabled && (values.fixedMarkup > 0 || values.percentMarkup > 0)
                  return (
                    <div key={`auto-${size}`} className={`border rounded-lg ${hasValue ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300 dark:border-primary-700' : 'border-gray-200 dark:border-gray-700'} ${!values.enabled ? 'opacity-50' : ''}`}>
                      {/* Header row with size, enabled checkbox, and expand button */}
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={values.enabled}
                              onChange={(e) => updateTirePricingFormValue('AUTO', size, 'enabled', e.target.checked)}
                              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 font-bold text-lg text-gray-900 dark:text-white">{size}"</span>
                          </label>
                          {!values.enabled && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">(deaktiviert)</span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSize('AUTO', size)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded"
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Einklappen
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Konfigurieren
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && values.enabled && (
                        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fest (€)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={values.fixedMarkup || ''}
                                onChange={(e) => updateTirePricingFormValue('AUTO', size, 'fixedMarkup', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prozent (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={values.percentMarkup || ''}
                                onChange={(e) => updateTirePricingFormValue('AUTO', size, 'percentMarkup', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={values.includeVat}
                                  onChange={(e) => updateTirePricingFormValue('AUTO', size, 'includeVat', e.target.checked)}
                                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                                />
                                <span className="ml-2 text-xs font-medium text-gray-900 dark:text-white">Mit MwSt.</span>
                              </label>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="text-xs">Beispiel (100€):</span>
                              <div className="font-bold text-primary-600 dark:text-primary-400">
                                {calculateExample(100, false, values.fixedMarkup, values.percentMarkup, values.includeVat).toFixed(2)} €
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Motorrad Tire Pricing by Size */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Motorradreifen
                </h3>
              </div>

              {/* Template for "Apply to All" */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4 border-2 border-orange-200 dark:border-orange-800">
                <div className="flex items-center mb-3">
                  <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-gray-900 dark:text-white">Vorlage für alle Motorrad-Größen</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fest (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={motoTemplate.fixedMarkup || ''}
                      onChange={(e) => setMotoTemplate({ ...motoTemplate, fixedMarkup: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prozent (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={motoTemplate.percentMarkup || ''}
                      onChange={(e) => setMotoTemplate({ ...motoTemplate, percentMarkup: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={motoTemplate.includeVat}
                        onChange={(e) => setMotoTemplate({ ...motoTemplate, includeVat: e.target.checked })}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="ml-2 text-xs font-medium text-gray-900 dark:text-white">Mit MwSt.</span>
                    </label>
                  </div>
                  <div>
                    <button
                      onClick={() => applyToAll('MOTO')}
                      className="w-full px-4 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      Auf alle anwenden
                    </button>
                  </div>
                </div>
              </div>

              {/* List of tire sizes */}
              <div className="space-y-2">
                {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(size => {
                  const values = getTirePricingValue('MOTO', size)
                  const isExpanded = expandedMotoSizes.has(size)
                  const hasValue = values.enabled && (values.fixedMarkup > 0 || values.percentMarkup > 0)
                  return (
                    <div key={`moto-${size}`} className={`border rounded-lg ${hasValue ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' : 'border-gray-200 dark:border-gray-700'} ${!values.enabled ? 'opacity-50' : ''}`}>
                      {/* Header row with size, enabled checkbox, and expand button */}
                      <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={values.enabled}
                              onChange={(e) => updateTirePricingFormValue('MOTO', size, 'enabled', e.target.checked)}
                              className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <span className="ml-2 font-bold text-lg text-gray-900 dark:text-white">{size}"</span>
                          </label>
                          {!values.enabled && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">(deaktiviert)</span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSize('MOTO', size)}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded"
                        >
                          {isExpanded ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Einklappen
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Konfigurieren
                            </>
                          )}
                        </button>
                      </div>

                      {/* Expanded content */}
                      {isExpanded && values.enabled && (
                        <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fest (€)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={values.fixedMarkup || ''}
                                onChange={(e) => updateTirePricingFormValue('MOTO', size, 'fixedMarkup', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Prozent (%)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={values.percentMarkup || ''}
                                onChange={(e) => updateTirePricingFormValue('MOTO', size, 'percentMarkup', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={values.includeVat}
                                  onChange={(e) => updateTirePricingFormValue('MOTO', size, 'includeVat', e.target.checked)}
                                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <span className="ml-2 text-xs font-medium text-gray-900 dark:text-white">Mit MwSt.</span>
                              </label>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="text-xs">Beispiel (150€):</span>
                              <div className="font-bold text-orange-600 dark:text-orange-400">
                                {calculateExample(150, false, values.fixedMarkup, values.percentMarkup, values.includeVat).toFixed(2)} €
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Save Button for Tire Pricing */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSaveTirePricing}
                disabled={savingTirePricing}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {savingTirePricing ? 'Speichern...' : 'Reifenpreise speichern'}
              </button>
            </div>
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
