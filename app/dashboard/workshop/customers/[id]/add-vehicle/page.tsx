'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BackButton from '@/components/BackButton'

export default function AddVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const customerId = params?.id as string

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [licensePlate, setLicensePlate] = useState('')
  const [vin, setVin] = useState('')
  const [manufacturer, setManufacturer] = useState('')
  const [model, setModel] = useState('')
  const [modelYear, setModelYear] = useState('')
  const [color, setColor] = useState('')
  const [engineType, setEngineType] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [transmission, setTransmission] = useState('')
  const [displacement, setDisplacement] = useState('')
  const [power, setPower] = useState('')
  const [frontTireSize, setFrontTireSize] = useState('')
  const [rearTireSize, setRearTireSize] = useState('')
  const [wheelSize, setWheelSize] = useState('')
  const [currentMileage, setCurrentMileage] = useState('')
  const [firstRegistration, setFirstRegistration] = useState('')
  const [nextInspection, setNextInspection] = useState('')
  const [notes, setNotes] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!manufacturer || !model) {
      setError('Hersteller und Modell sind erforderlich')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/workshop/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId,
          licensePlate: licensePlate || null,
          vin: vin || null,
          manufacturer,
          model,
          modelYear: modelYear ? parseInt(modelYear) : null,
          color: color || null,
          engineType: engineType || null,
          fuelType: fuelType || null,
          transmission: transmission || null,
          displacement: displacement ? parseInt(displacement) : null,
          power: power ? parseInt(power) : null,
          frontTireSize: frontTireSize || null,
          rearTireSize: rearTireSize || null,
          wheelSize: wheelSize || null,
          currentMileage: currentMileage ? parseInt(currentMileage) : null,
          firstRegistration: firstRegistration || null,
          nextInspection: nextInspection || null,
          notes: notes || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Erstellen des Fahrzeugs')
      }

      router.push(`/dashboard/workshop/customers/${customerId}?tab=vehicles`)
    } catch (error) {
      console.error('Error creating vehicle:', error)
      setError(error instanceof Error ? error.message : 'Fehler beim Erstellen')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Neues Fahrzeug hinzufügen</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* Fahrzeug-Identifikation */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Fahrzeug-Identifikation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kennzeichen
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="B-XX 1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  FIN/VIN
                </label>
                <input
                  type="text"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="WVWZZZ1JZ3W386752"
                  maxLength={17}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Basis-Informationen */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basis-Informationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hersteller *
                </label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="z.B. Volkswagen"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Modell *
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="z.B. Golf"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Baujahr
                </label>
                <input
                  type="number"
                  value={modelYear}
                  onChange={(e) => setModelYear(e.target.value)}
                  placeholder="2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farbe
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="z.B. Schwarz"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Technische Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Technische Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kraftstoffart
                </label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Bitte wählen</option>
                  <option value="Benzin">Benzin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Elektro">Elektro</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                  <option value="Erdgas">Erdgas (CNG)</option>
                  <option value="Autogas">Autogas (LPG)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Getriebe
                </label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Bitte wählen</option>
                  <option value="Schaltgetriebe">Schaltgetriebe</option>
                  <option value="Automatik">Automatik</option>
                  <option value="Halbautomatik">Halbautomatik</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hubraum (ccm)
                </label>
                <input
                  type="number"
                  value={displacement}
                  onChange={(e) => setDisplacement(e.target.value)}
                  placeholder="1984"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leistung (kW)
                </label>
                <input
                  type="number"
                  value={power}
                  onChange={(e) => setPower(e.target.value)}
                  placeholder="110"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Reifen-Informationen */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Reifen-Informationen</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reifengröße Vorne
                </label>
                <input
                  type="text"
                  value={frontTireSize}
                  onChange={(e) => setFrontTireSize(e.target.value)}
                  placeholder="205/55R16"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reifengröße Hinten
                </label>
                <input
                  type="text"
                  value={rearTireSize}
                  onChange={(e) => setRearTireSize(e.target.value)}
                  placeholder="225/45R17"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Felgengröße
                </label>
                <input
                  type="text"
                  value={wheelSize}
                  onChange={(e) => setWheelSize(e.target.value)}
                  placeholder="16 Zoll"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Kilometerstand & Termine */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Kilometerstand & Termine</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aktueller Kilometerstand
                </label>
                <input
                  type="number"
                  value={currentMileage}
                  onChange={(e) => setCurrentMileage(e.target.value)}
                  placeholder="50000"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Erstzulassung
                </label>
                <input
                  type="date"
                  value={firstRegistration}
                  onChange={(e) => setFirstRegistration(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nächster TÜV/HU
                </label>
                <input
                  type="date"
                  value={nextInspection}
                  onChange={(e) => setNextInspection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Besonderheiten, Schäden, etc..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/workshop/customers/${customerId}`)}
              disabled={saving}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichere...' : 'Fahrzeug hinzufügen'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
