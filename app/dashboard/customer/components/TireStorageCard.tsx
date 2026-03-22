'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { MapPin, Car, Archive } from 'lucide-react'

interface TireStorageItem {
  id: string
  workshopId: string
  workshopName: string
  workshopSlug: string | null
  workshopAddress: string
  vehicleId: string
  vehicleName: string
  vehiclePlate: string
  storedTireType: string
  storedSince: string
  storageLocation?: string | null
}

interface TireStorageCardProps {
  tireStorage: TireStorageItem[]
  loading: boolean
  compact?: boolean
}

export default function TireStorageCard({ tireStorage, loading, compact }: TireStorageCardProps) {
  const router = useRouter()
  const [options, setOptions] = useState<Record<string, { balancing: boolean; storage: boolean }>>({})

  if (loading) {
    if (compact) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
        </div>
      )
    }
    return null
  }

  if (!tireStorage || tireStorage.length === 0) {
    if (compact) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <Archive className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Keine eingelagerten Reifen</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Reifen werden nach einem Räderwechsel bei einer Partnerwerkstatt hier angezeigt.
          </p>
        </div>
      )
    }
    return null
  }

  // Compact mode: show only first storage item in a card
  if (compact) {
    const item = tireStorage[0]
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex flex-col">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Archive className="h-4 w-4 text-amber-600" />
          Eingelagerte Reifen
          {tireStorage.length > 1 && (
            <span className="text-xs font-normal text-gray-500">({tireStorage.length})</span>
          )}
        </h3>

        <div className="space-y-2 flex-1">
          {tireStorage.slice(0, 2).map((s) => (
            <div key={s.id} className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-100 dark:border-amber-800">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white mb-1">
                {s.storedTireType === 'Winterreifen' ? '❄️' : '☀️'} {s.storedTireType}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <Car className="h-3 w-3" />
                {s.vehicleName} {s.vehiclePlate && `(${s.vehiclePlate})`}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <MapPin className="h-3 w-3" />
                {s.workshopName}
              </div>
              {s.storageLocation && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  📦 Lagerort: <span className="font-medium text-gray-700 dark:text-gray-300">{s.storageLocation}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => {
            const slug = item.workshopSlug || item.workshopId
            router.push(`/workshop/${slug}?service=WHEEL_CHANGE&fromStorageBookingId=${item.id}&vehicleId=${item.vehicleId}`)
          }}
          className="mt-3 w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium text-center"
        >
          Räderwechsel buchen
        </button>
      </div>
    )
  }

  const getOptions = (id: string) => options[id] || { balancing: false, storage: false }
  const toggleOption = (id: string, key: 'balancing' | 'storage') => {
    setOptions(prev => ({
      ...prev,
      [id]: { ...getOptions(id), [key]: !getOptions(id)[key] }
    }))
  }

  return (
    <div className="mb-6">
      <div className={`grid ${tireStorage.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
        {tireStorage.map((item) => {
          const opts = getOptions(item.id)
          return (
          <div
            key={item.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">
                  Ihre eingelagerten Reifen
                </h3>
                
                <div className="space-y-1.5 mb-3">
                  {/* Tire type */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Reifen:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.storedTireType === 'Winterreifen' ? '❄️' : '☀️'} {item.storedTireType}
                    </span>
                  </div>

                  {/* Vehicle */}
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.vehicleName} {item.vehiclePlate && `(${item.vehiclePlate})`}
                    </span>
                  </div>

                  {/* Workshop */}
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.workshopName}
                    </span>
                  </div>

                  {/* Address */}
                  {item.workshopAddress && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 pl-5">
                      {item.workshopAddress}
                    </div>
                  )}

                  {/* Storage Location */}
                  {item.storageLocation && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-base">📦</span>
                      <span className="text-gray-500 dark:text-gray-400">Lagerort:</span>
                      <span className="font-medium text-gray-900 dark:text-white">{item.storageLocation}</span>
                    </div>
                  )}

                  {/* Stored since */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Eingelagert seit {new Date(item.storedSince).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* Options: Auswuchten + Einlagerung */}
                <div className="space-y-1.5 mb-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={opts.balancing}
                      onChange={() => toggleOption(item.id, 'balancing')}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Auswuchten</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={opts.storage}
                      onChange={() => toggleOption(item.id, 'storage')}
                      className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Neue Einlagerung (abgenommene Reifen)</span>
                  </label>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    const slug = item.workshopSlug || item.workshopId
                    const params = new URLSearchParams({
                      service: 'WHEEL_CHANGE',
                      fromStorageBookingId: item.id,
                      vehicleId: item.vehicleId
                    })
                    if (opts.balancing) params.set('balancing', 'true')
                    if (opts.storage) params.set('storage', 'true')
                    router.push(`/workshop/${slug}?${params.toString()}`)
                  }}
                  className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium text-center"
                >
                  Räderwechsel bei {item.workshopName} buchen
                </button>
              </div>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )
}
