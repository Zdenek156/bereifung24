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
          // Populate templates from saved general settings
          setAutoTemplate({
            fixedMarkup: data.settings.autoFixedMarkup ?? 0,
            percentMarkup: data.settings.autoPercentMarkup ?? 0,
            includeVat: data.settings.autoIncludeVat ?? false,
            enabled: true,
          })
          setMotoTemplate({
            fixedMarkup: data.settings.motoFixedMarkup ?? 0,
            percentMarkup: data.settings.motoPercentMarkup ?? 0,
            includeVat: data.settings.motoIncludeVat ?? false,
            enabled: true,
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
    if (tirePricingForm[key]) return tirePricingForm[key]
    // Fall back to general template settings when no per-size record exists
    if (vehicleType === 'AUTO') {
      return { fixedMarkup: settings.autoFixedMarkup ?? 0, percentMarkup: settings.autoPercentMarkup ?? 0, includeVat: settings.autoIncludeVat ?? false, enabled: true }
    }
    return { fixedMarkup: settings.motoFixedMarkup ?? 0, percentMarkup: settings.motoPercentMarkup ?? 0, includeVat: settings.motoIncludeVat ?? false, enabled: true }
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
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Preiskalkulation</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Automatische Berechnung von Reifen- und Servicepreisen</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Compact Info Banner */}
        <div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 px-4 py-3 mb-6">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-medium">EK vom Großhändler → <strong>+ Fest (€)</strong> → <strong>+ Prozent (%)</strong> → optional <strong>+ 19% MwSt.</strong> = Verkaufspreis</p>
            <p className="text-blue-500 dark:text-blue-400">Beispiel: 100€ EK + 3€ fest + 7% = 110,21€ · Mit MwSt: 131,15€ · Pro Zollgröße individuell einstellbar</p>
          </div>
        </div>

        {/* Tire Pricing by Rim Size */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-white">Reifenpreise nach Zollgröße</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Individuelle Aufschläge 13" – 23" · Überschreibt allgemeine Einstellungen</p>
              </div>
            </div>
            <button
              onClick={handleSaveTirePricing}
              disabled={savingTirePricing}
              className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingTirePricing ? 'Speichern...' : '💾 Speichern'}
            </button>
          </div>
          <div className="p-6 space-y-8">

            {/* ── PKW Section ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🚗</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">PKW-Reifen</h3>
              </div>

              {/* Template Row */}
              <div className="grid grid-cols-[1fr_100px_100px_80px_auto] gap-2 items-center mb-3 bg-primary-50 dark:bg-primary-900/10 rounded-xl px-4 py-3 border border-primary-200 dark:border-primary-800">
                <span className="text-xs font-bold text-primary-700 dark:text-primary-300 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Vorlage für alle
                </span>
                <div className="relative">
                  <input type="number" step="0.01" min="0" value={autoTemplate.fixedMarkup || ''}
                    onChange={(e) => setAutoTemplate({ ...autoTemplate, fixedMarkup: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-2 pr-6 py-1.5 text-sm border border-primary-200 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-white" placeholder="0" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                </div>
                <div className="relative">
                  <input type="number" step="0.1" min="0" max="100" value={autoTemplate.percentMarkup || ''}
                    onChange={(e) => setAutoTemplate({ ...autoTemplate, percentMarkup: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-2 pr-6 py-1.5 text-sm border border-primary-200 dark:border-primary-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-white" placeholder="0" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                </div>
                <button type="button" onClick={() => setAutoTemplate({ ...autoTemplate, includeVat: !autoTemplate.includeVat })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 mx-auto ${autoTemplate.includeVat ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${autoTemplate.includeVat ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <button onClick={() => applyToAll('AUTO')}
                  className="px-3 py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium whitespace-nowrap">
                  Alle ▸
                </button>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-[1fr_100px_100px_80px_90px] gap-2 px-4 mb-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Größe</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fest (€)</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Prozent</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">MwSt.</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">VK (100€)</span>
              </div>

              {/* Size Rows */}
              <div className="space-y-1">
                {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(size => {
                  const values = getTirePricingValue('AUTO', size)
                  const hasValue = values.enabled && (values.fixedMarkup > 0 || values.percentMarkup > 0)
                  const vk = calculateExample(100, false, values.fixedMarkup, values.percentMarkup, values.includeVat)
                  return (
                    <div key={`auto-${size}`}
                      className={`grid grid-cols-[1fr_100px_100px_80px_90px] gap-2 items-center px-4 py-2 rounded-lg transition-all ${
                        !values.enabled ? 'opacity-40 bg-gray-50 dark:bg-gray-800/50' :
                        hasValue ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}>
                      {/* Size + Toggle */}
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateTirePricingFormValue('AUTO', size, 'enabled', !values.enabled)}
                          className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${values.enabled ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${values.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className={`font-bold text-sm ${values.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{size}"</span>
                      </div>
                      {/* Fixed */}
                      <div className="relative">
                        <input type="number" step="0.01" min="0" value={values.fixedMarkup || ''} disabled={!values.enabled}
                          onChange={(e) => updateTirePricingFormValue('AUTO', size, 'fixedMarkup', parseFloat(e.target.value) || 0)}
                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:text-gray-400" placeholder="0" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                      </div>
                      {/* Percent */}
                      <div className="relative">
                        <input type="number" step="0.1" min="0" max="100" value={values.percentMarkup || ''} disabled={!values.enabled}
                          onChange={(e) => updateTirePricingFormValue('AUTO', size, 'percentMarkup', parseFloat(e.target.value) || 0)}
                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:text-gray-400" placeholder="0" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                      </div>
                      {/* VAT Toggle */}
                      <div className="flex justify-center">
                        <button type="button" disabled={!values.enabled}
                          onClick={() => updateTirePricingFormValue('AUTO', size, 'includeVat', !values.includeVat)}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-40 ${values.includeVat ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${values.includeVat ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      {/* Calculated Price */}
                      <div className="text-right">
                        <span className={`text-sm font-bold ${values.enabled && hasValue ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}`}>
                          {values.enabled ? `${vk.toFixed(2)} €` : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* ── Motorrad Section ── */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🏍️</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Motorradreifen</h3>
              </div>

              {/* Template Row */}
              <div className="grid grid-cols-[1fr_100px_100px_80px_auto] gap-2 items-center mb-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl px-4 py-3 border border-orange-200 dark:border-orange-800">
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Vorlage für alle
                </span>
                <div className="relative">
                  <input type="number" step="0.01" min="0" value={motoTemplate.fixedMarkup || ''}
                    onChange={(e) => setMotoTemplate({ ...motoTemplate, fixedMarkup: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-2 pr-6 py-1.5 text-sm border border-orange-200 dark:border-orange-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 dark:text-white" placeholder="0" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                </div>
                <div className="relative">
                  <input type="number" step="0.1" min="0" max="100" value={motoTemplate.percentMarkup || ''}
                    onChange={(e) => setMotoTemplate({ ...motoTemplate, percentMarkup: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-2 pr-6 py-1.5 text-sm border border-orange-200 dark:border-orange-700 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 dark:text-white" placeholder="0" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                </div>
                <button type="button" onClick={() => setMotoTemplate({ ...motoTemplate, includeVat: !motoTemplate.includeVat })}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 mx-auto ${motoTemplate.includeVat ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform duration-200 ${motoTemplate.includeVat ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <button onClick={() => applyToAll('MOTO')}
                  className="px-3 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium whitespace-nowrap">
                  Alle ▸
                </button>
              </div>

              {/* Column Headers */}
              <div className="grid grid-cols-[1fr_100px_100px_80px_90px] gap-2 px-4 mb-1">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Größe</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Fest (€)</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Prozent</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center">MwSt.</span>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right">VK (150€)</span>
              </div>

              {/* Size Rows */}
              <div className="space-y-1">
                {[13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(size => {
                  const values = getTirePricingValue('MOTO', size)
                  const hasValue = values.enabled && (values.fixedMarkup > 0 || values.percentMarkup > 0)
                  const vk = calculateExample(150, false, values.fixedMarkup, values.percentMarkup, values.includeVat)
                  return (
                    <div key={`moto-${size}`}
                      className={`grid grid-cols-[1fr_100px_100px_80px_90px] gap-2 items-center px-4 py-2 rounded-lg transition-all ${
                        !values.enabled ? 'opacity-40 bg-gray-50 dark:bg-gray-800/50' :
                        hasValue ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                      }`}>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => updateTirePricingFormValue('MOTO', size, 'enabled', !values.enabled)}
                          className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200 ${values.enabled ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${values.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                        <span className={`font-bold text-sm ${values.enabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>{size}"</span>
                      </div>
                      <div className="relative">
                        <input type="number" step="0.01" min="0" value={values.fixedMarkup || ''} disabled={!values.enabled}
                          onChange={(e) => updateTirePricingFormValue('MOTO', size, 'fixedMarkup', parseFloat(e.target.value) || 0)}
                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:text-gray-400" placeholder="0" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">€</span>
                      </div>
                      <div className="relative">
                        <input type="number" step="0.1" min="0" max="100" value={values.percentMarkup || ''} disabled={!values.enabled}
                          onChange={(e) => updateTirePricingFormValue('MOTO', size, 'percentMarkup', parseFloat(e.target.value) || 0)}
                          className="w-full pl-2 pr-6 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 bg-white dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700/50 disabled:text-gray-400" placeholder="0" />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">%</span>
                      </div>
                      <div className="flex justify-center">
                        <button type="button" disabled={!values.enabled}
                          onClick={() => updateTirePricingFormValue('MOTO', size, 'includeVat', !values.includeVat)}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 disabled:opacity-40 ${values.includeVat ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${values.includeVat ? 'translate-x-4' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-bold ${values.enabled && hasValue ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                          {values.enabled ? `${vk.toFixed(2)} €` : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/dashboard/workshop"
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-sm transition-colors"
          >
            Abbrechen
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-medium text-sm shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Speichern...' : '💾 Einstellungen speichern'}
          </button>
        </div>
      </main>
    </div>
  )
}
