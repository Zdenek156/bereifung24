'use client'

import { useRouter } from 'next/navigation'
import { MapPin, Car, Archive } from 'lucide-react'

interface TireStorageItem {
  id: string
  workshopId: string
  workshopName: string
  workshopSlug: string | null
  workshopAddress: string
  vehicleName: string
  vehiclePlate: string
  storedTireType: string
  storedSince: string
}

interface TireStorageCardProps {
  tireStorage: TireStorageItem[]
  loading: boolean
}

export default function TireStorageCard({ tireStorage, loading }: TireStorageCardProps) {
  const router = useRouter()

  if (loading) return null
  if (!tireStorage || tireStorage.length === 0) return null

  return (
    <div className="mb-6">
      <div className={`grid ${tireStorage.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
        {tireStorage.map((item) => (
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

                  {/* Stored since */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Eingelagert seit {new Date(item.storedSince).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    // Navigate to booking flow for this specific workshop
                    const slug = item.workshopSlug || item.workshopId
                    router.push(`/workshop/${slug}`)
                  }}
                  className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium text-center"
                >
                  Räderwechsel bei {item.workshopName} buchen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
