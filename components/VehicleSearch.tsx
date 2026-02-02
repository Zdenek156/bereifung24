'use client'

import { useState, useEffect } from 'react'
import { Car } from 'lucide-react'

interface VehicleData {
  make: string
  model: string
  year: number
  fuelType?: string
}

interface VehicleSearchProps {
  onVehicleSelect: (vehicle: VehicleData) => void
  initialData?: VehicleData
  className?: string
}

export default function VehicleSearch({ onVehicleSelect, initialData, className = '' }: VehicleSearchProps) {
  const [makes, setMakes] = useState<string[]>([])
  const [selectedMake, setSelectedMake] = useState(initialData?.make || '')
  const [model, setModel] = useState(initialData?.model || '')
  const [year, setYear] = useState<string>(initialData?.year?.toString() || '')
  const [error, setError] = useState('')
  const [makesLoading, setMakesLoading] = useState(false)

  // Load car makes on mount
  useEffect(() => {
    const loadMakes = async () => {
      setMakesLoading(true)
      try {
        const res = await fetch('/api/vehicles/makes')
        if (res.ok) {
          const data = await res.json()
          setMakes(data.makes || [])
        }
      } catch (err) {
        console.error('Failed to load makes:', err)
      } finally {
        setMakesLoading(false)
      }
    }
    loadMakes()
  }, [])

  const handleSubmit = () => {
    if (!selectedMake || !model || !year) {
      setError('Bitte alle Felder ausfüllen')
      return
    }

    const yearNum = parseInt(year)
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 1) {
      setError('Bitte gültiges Baujahr eingeben')
      return
    }

    onVehicleSelect({
      make: selectedMake,
      model: model.trim(),
      year: yearNum
    })
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Car className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Fahrzeugdaten eingeben</h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Hinweis:</strong> Bitte geben Sie die Fahrzeugdaten manuell ein.
        </p>
      </div>

      <div className="space-y-4">
        {/* Hersteller Dropdown */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Hersteller *
          </label>
          <select
            value={selectedMake}
            onChange={(e) => {
              setSelectedMake(e.target.value)
              setError('')
            }}
            disabled={makesLoading}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">
              {makesLoading ? 'Lädt...' : 'Hersteller wählen...'}
            </option>
            {makes.map((make) => (
              <option key={make} value={make}>
                {make}
              </option>
            ))}
          </select>
        </div>

        {/* Modell */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Modell *
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => {
              setModel(e.target.value)
              setError('')
            }}
            placeholder="z.B. Golf, 3er, A4"
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Baujahr */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Baujahr *
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => {
              setYear(e.target.value)
              setError('')
            }}
            placeholder="z.B. 2020"
            min="1900"
            max={new Date().getFullYear() + 1}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedMake || !model || !year}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Car className="h-4 w-4" />
          Fahrzeug übernehmen
        </button>
      </div>
    </div>
  )
}
