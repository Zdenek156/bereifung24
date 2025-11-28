'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

type Vehicle = {
  id: string
  vehicleType?: string
  make: string
  model: string
  year: number
  licensePlate?: string
  vin?: string
  nextInspectionDate?: string
  inspectionReminder?: boolean
  inspectionReminderDays?: number
  summerTires?: {
    width: number
    aspectRatio: number
    diameter: number
    loadIndex?: number
    speedRating?: string
    hasDifferentSizes?: boolean
    rearWidth?: number
    rearAspectRatio?: number
    rearDiameter?: number
    rearLoadIndex?: number
    rearSpeedRating?: string
  }
  winterTires?: {
    width: number
    aspectRatio: number
    diameter: number
    loadIndex?: number
    speedRating?: string
    hasDifferentSizes?: boolean
    rearWidth?: number
    rearAspectRatio?: number
    rearDiameter?: number
    rearLoadIndex?: number
    rearSpeedRating?: string
  }
  allSeasonTires?: {
    width: number
    aspectRatio: number
    diameter: number
    loadIndex?: number
    speedRating?: string
    hasDifferentSizes?: boolean
    rearWidth?: number
    rearAspectRatio?: number
    rearDiameter?: number
    rearLoadIndex?: number
    rearSpeedRating?: string
  }
  createdAt: string
}

export default function VehiclesPage() {
  const { data: session, status } = useSession()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchVehicles()
    }
  }, [status])

  const fetchVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles')
      if (res.ok) {
        const data = await res.json()
        setVehicles(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Fahrzeuge:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteVehicle = async (vehicleId: string) => {
    if (!confirm('Möchten Sie dieses Fahrzeug wirklich löschen?')) return

    try {
      const res = await fetch(`/api/vehicles/${vehicleId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setVehicles(vehicles.filter(v => v.id !== vehicleId))
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {/* Zurück Button */}
          <a
            href="/dashboard/customer"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zum Dashboard
          </a>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meine Fahrzeuge</h1>
              <p className="text-gray-600 mt-2">
                Verwalten Sie Ihre Fahrzeuge und Reifengrößen
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Fahrzeug hinzufügen
            </button>
          </div>
        </div>

        {/* Vehicles Grid */}
        {vehicles.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Noch keine Fahrzeuge
            </h3>
            <p className="text-gray-600 mb-6">
              Fügen Sie Ihr erstes Fahrzeug hinzu, um schneller Reifenanfragen zu erstellen
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Erstes Fahrzeug hinzufügen
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Vehicle Header */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-3xl">
                      {vehicle.vehicleType === 'MOTORCYCLE' ? '🏍️' : '🚗'}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingVehicle(vehicle)}
                        className="text-white/80 hover:text-white transition-colors"
                        title="Bearbeiten"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteVehicle(vehicle.id)}
                        className="text-white/80 hover:text-white transition-colors"
                        title="Löschen"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold">{vehicle.make} {vehicle.model}</h3>
                  <p className="text-white/80">Baujahr {vehicle.year}</p>
                  {vehicle.licensePlate && (
                    <p className="text-white/90 font-mono mt-2 text-sm">
                      {vehicle.licensePlate}
                    </p>
                  )}
                </div>

                {/* Tire Sizes */}
                <div className="p-6 space-y-4">
                  {vehicle.summerTires && (
                    <div className="border-l-4 border-yellow-400 pl-4">
                      <div className="flex items-center mb-1">
                        {vehicle.vehicleType === 'MOTORCYCLE' ? (
                          <>
                            <span className="text-2xl mr-2">🏍️</span>
                            <span className="font-semibold text-gray-700">Reifengrößen</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl mr-2">☀️</span>
                            <span className="font-semibold text-gray-700">Sommerreifen</span>
                          </>
                        )}
                      </div>
                      <p className="text-lg font-mono text-gray-900">
                        {vehicle.summerTires.hasDifferentSizes ? (
                          <>
                            <span className="text-sm text-gray-600">Vorne: </span>
                            {vehicle.summerTires.width}/{vehicle.summerTires.aspectRatio} R{vehicle.summerTires.diameter}
                            {vehicle.summerTires.loadIndex && ` ${vehicle.summerTires.loadIndex}`}
                            {vehicle.summerTires.speedRating && vehicle.summerTires.speedRating}
                            <br />
                            <span className="text-sm text-gray-600">Hinten: </span>
                            {vehicle.summerTires.rearWidth}/{vehicle.summerTires.rearAspectRatio} R{vehicle.summerTires.rearDiameter}
                            {vehicle.summerTires.rearLoadIndex && ` ${vehicle.summerTires.rearLoadIndex}`}
                            {vehicle.summerTires.rearSpeedRating && vehicle.summerTires.rearSpeedRating}
                          </>
                        ) : (
                          <>
                            {vehicle.summerTires.width}/{vehicle.summerTires.aspectRatio} R{vehicle.summerTires.diameter}
                            {vehicle.summerTires.loadIndex && ` ${vehicle.summerTires.loadIndex}`}
                            {vehicle.summerTires.speedRating && vehicle.summerTires.speedRating}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {vehicle.winterTires && vehicle.vehicleType !== 'MOTORCYCLE' && (
                    <div className="border-l-4 border-blue-400 pl-4">
                      <div className="flex items-center mb-1">
                        <span className="text-2xl mr-2">❄️</span>
                        <span className="font-semibold text-gray-700">Winterreifen</span>
                      </div>
                      <p className="text-lg font-mono text-gray-900">
                        {vehicle.winterTires.hasDifferentSizes ? (
                          <>
                            <span className="text-sm text-gray-600">Vorne: </span>
                            {vehicle.winterTires.width}/{vehicle.winterTires.aspectRatio} R{vehicle.winterTires.diameter}
                            {vehicle.winterTires.loadIndex && ` ${vehicle.winterTires.loadIndex}`}
                            {vehicle.winterTires.speedRating && vehicle.winterTires.speedRating}
                            <br />
                            <span className="text-sm text-gray-600">Hinten: </span>
                            {vehicle.winterTires.rearWidth}/{vehicle.winterTires.rearAspectRatio} R{vehicle.winterTires.rearDiameter}
                            {vehicle.winterTires.rearLoadIndex && ` ${vehicle.winterTires.rearLoadIndex}`}
                            {vehicle.winterTires.rearSpeedRating && vehicle.winterTires.rearSpeedRating}
                          </>
                        ) : (
                          <>
                            {vehicle.winterTires.width}/{vehicle.winterTires.aspectRatio} R{vehicle.winterTires.diameter}
                            {vehicle.winterTires.loadIndex && ` ${vehicle.winterTires.loadIndex}`}
                            {vehicle.winterTires.speedRating && vehicle.winterTires.speedRating}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {vehicle.allSeasonTires && vehicle.vehicleType !== 'MOTORCYCLE' && (
                    <div className="border-l-4 border-green-400 pl-4">
                      <div className="flex items-center mb-1">
                        <span className="text-2xl mr-2">🌤️</span>
                        <span className="font-semibold text-gray-700">Ganzjahresreifen</span>
                      </div>
                      <p className="text-lg font-mono text-gray-900">
                        {vehicle.allSeasonTires.hasDifferentSizes ? (
                          <>
                            <span className="text-sm text-gray-600">Vorne: </span>
                            {vehicle.allSeasonTires.width}/{vehicle.allSeasonTires.aspectRatio} R{vehicle.allSeasonTires.diameter}
                            {vehicle.allSeasonTires.loadIndex && ` ${vehicle.allSeasonTires.loadIndex}`}
                            {vehicle.allSeasonTires.speedRating && vehicle.allSeasonTires.speedRating}
                            <br />
                            <span className="text-sm text-gray-600">Hinten: </span>
                            {vehicle.allSeasonTires.rearWidth}/{vehicle.allSeasonTires.rearAspectRatio} R{vehicle.allSeasonTires.rearDiameter}
                            {vehicle.allSeasonTires.rearLoadIndex && ` ${vehicle.allSeasonTires.rearLoadIndex}`}
                            {vehicle.allSeasonTires.rearSpeedRating && vehicle.allSeasonTires.rearSpeedRating}
                          </>
                        ) : (
                          <>
                            {vehicle.allSeasonTires.width}/{vehicle.allSeasonTires.aspectRatio} R{vehicle.allSeasonTires.diameter}
                            {vehicle.allSeasonTires.loadIndex && ` ${vehicle.allSeasonTires.loadIndex}`}
                            {vehicle.allSeasonTires.speedRating && vehicle.allSeasonTires.speedRating}
                          </>
                        )}
                      </p>
                    </div>
                  )}

                  {!vehicle.summerTires && !vehicle.winterTires && !vehicle.allSeasonTires && (
                    <p className="text-gray-500 text-sm italic">
                      {vehicle.vehicleType === 'MOTORCYCLE'
                        ? 'Noch keine Motorrad-Reifengrößen hinterlegt'
                        : 'Noch keine Reifengrößen hinterlegt'}
                    </p>
                  )}

                  {/* VIN Display */}
                  {vehicle.vin && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">VIN:</span> {vehicle.vin}
                      </p>
                    </div>
                  )}

                  {/* Inspection Date Display */}
                  {vehicle.nextInspectionDate && (
                    <div className={`${vehicle.vin ? '' : 'mt-4 pt-4 border-t border-gray-200'}`}>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Nächster TÜV:</span>{' '}
                        {new Date(vehicle.nextInspectionDate).toLocaleDateString('de-DE', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                        {vehicle.inspectionReminder && (
                          <span className="ml-2 text-xs text-primary-600">
                            🔔 {vehicle.inspectionReminderDays} Tage Erinnerung
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Vehicle Modal */}
        {showModal && (
          <AddVehicleModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchVehicles()
            }}
          />
        )}

        {/* Edit Vehicle Modal */}
        {editingVehicle && (
          <EditVehicleModal
            vehicle={editingVehicle}
            onClose={() => setEditingVehicle(null)}
            onSuccess={() => {
              setEditingVehicle(null)
              fetchVehicles()
            }}
          />
        )}
      </div>
    </div>
  )
}

// Edit Vehicle Modal Component  
function EditVehicleModal({ vehicle, onClose, onSuccess }: { vehicle: Vehicle, onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicleType: vehicle.vehicleType || 'CAR',
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    licensePlate: vehicle.licensePlate || '',
    vin: vehicle.vin || '',
    nextInspectionDate: vehicle.nextInspectionDate ? new Date(vehicle.nextInspectionDate).toISOString().substring(0, 7) : '',
    inspectionReminder: vehicle.inspectionReminder || false,
    inspectionReminderDays: (vehicle.inspectionReminderDays || 30).toString(),
    // Summer Tires
    hasSummerTires: !!vehicle.summerTires,
    summerDifferentSizes: vehicle.summerTires?.hasDifferentSizes || false,
    summerWidth: vehicle.summerTires?.width.toString() || '',
    summerAspectRatio: vehicle.summerTires?.aspectRatio.toString() || '',
    summerDiameter: vehicle.summerTires?.diameter.toString() || '',
    summerLoadIndex: vehicle.summerTires?.loadIndex?.toString() || '',
    summerSpeedRating: vehicle.summerTires?.speedRating || '',
    summerRearWidth: vehicle.summerTires?.rearWidth?.toString() || '',
    summerRearAspectRatio: vehicle.summerTires?.rearAspectRatio?.toString() || '',
    summerRearDiameter: vehicle.summerTires?.rearDiameter?.toString() || '',
    summerRearLoadIndex: vehicle.summerTires?.rearLoadIndex?.toString() || '',
    summerRearSpeedRating: vehicle.summerTires?.rearSpeedRating || '',
    // Winter Tires
    hasWinterTires: !!vehicle.winterTires,
    winterDifferentSizes: vehicle.winterTires?.hasDifferentSizes || false,
    winterWidth: vehicle.winterTires?.width.toString() || '',
    winterAspectRatio: vehicle.winterTires?.aspectRatio.toString() || '',
    winterDiameter: vehicle.winterTires?.diameter.toString() || '',
    winterLoadIndex: vehicle.winterTires?.loadIndex?.toString() || '',
    winterSpeedRating: vehicle.winterTires?.speedRating || '',
    winterRearWidth: vehicle.winterTires?.rearWidth?.toString() || '',
    winterRearAspectRatio: vehicle.winterTires?.rearAspectRatio?.toString() || '',
    winterRearDiameter: vehicle.winterTires?.rearDiameter?.toString() || '',
    winterRearLoadIndex: vehicle.winterTires?.rearLoadIndex?.toString() || '',
    winterRearSpeedRating: vehicle.winterTires?.rearSpeedRating || '',
    // All Season Tires
    hasAllSeasonTires: !!vehicle.allSeasonTires,
    allSeasonDifferentSizes: vehicle.allSeasonTires?.hasDifferentSizes || false,
    allSeasonWidth: vehicle.allSeasonTires?.width.toString() || '',
    allSeasonAspectRatio: vehicle.allSeasonTires?.aspectRatio.toString() || '',
    allSeasonDiameter: vehicle.allSeasonTires?.diameter.toString() || '',
    allSeasonLoadIndex: vehicle.allSeasonTires?.loadIndex?.toString() || '',
    allSeasonSpeedRating: vehicle.allSeasonTires?.speedRating || '',
    allSeasonRearWidth: vehicle.allSeasonTires?.rearWidth?.toString() || '',
    allSeasonRearAspectRatio: vehicle.allSeasonTires?.rearAspectRatio?.toString() || '',
    allSeasonRearDiameter: vehicle.allSeasonTires?.rearDiameter?.toString() || '',
    allSeasonRearLoadIndex: vehicle.allSeasonTires?.rearLoadIndex?.toString() || '',
    allSeasonRearSpeedRating: vehicle.allSeasonTires?.rearSpeedRating || '',
  })

  // Dynamische Reifengrößen basierend auf Fahrzeugtyp
  const TIRE_WIDTHS = formData.vehicleType === 'MOTORCYCLE' 
    ? [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400]
    : [135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325]
  
  const ASPECT_RATIOS = formData.vehicleType === 'MOTORCYCLE'
    ? [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
    : [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
  
  const DIAMETERS = formData.vehicleType === 'MOTORCYCLE'
    ? [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
    : [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
  
  // Complete load index mapping for both motorcycles and cars
  const LOAD_INDEX_MAP: Record<number, number> = {
    30: 106, 31: 109, 32: 112, 33: 115, 34: 118, 35: 121, 36: 125, 37: 128, 38: 132, 39: 136, 40: 140, 41: 145, 42: 150, 43: 155, 44: 160,
    45: 165, 46: 170, 47: 175, 48: 180, 49: 185, 50: 190, 51: 195, 52: 200, 53: 206, 54: 212, 55: 218, 56: 224, 57: 230, 58: 236, 59: 243,
    60: 250, 61: 257, 62: 265, 63: 272, 64: 280, 65: 290, 66: 300, 67: 307, 68: 315, 69: 325, 70: 335, 71: 345, 72: 355, 73: 365, 74: 375,
    75: 387, 76: 400, 77: 412, 78: 425, 79: 437, 80: 450, 81: 462, 82: 475, 83: 487, 84: 500, 85: 515, 86: 530, 87: 545, 88: 560, 89: 580,
    90: 600, 91: 615, 92: 630, 93: 650, 94: 670, 95: 690, 96: 710, 97: 730, 98: 750, 99: 775, 100: 800, 101: 825, 102: 850, 103: 875, 104: 900,
    105: 925, 106: 950, 107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150, 114: 1180, 115: 1215, 116: 1250, 117: 1285,
    118: 1320, 119: 1360, 120: 1400, 121: 1450, 122: 1500, 123: 1550, 124: 1600, 125: 1650, 126: 1700, 127: 1750, 128: 1800, 129: 1850, 130: 1900,
    131: 1950, 132: 2000, 133: 2060, 134: 2120, 135: 2180, 136: 2240, 137: 2300, 138: 2360, 139: 2430, 140: 2500, 141: 2575, 142: 2650, 143: 2725,
    144: 2800, 145: 2900, 146: 3000, 147: 3075, 148: 3150, 149: 3250, 150: 3350
  }
  
  // Dynamic load indices based on vehicle type
  const LOAD_INDICES = formData.vehicleType === 'MOTORCYCLE'
    ? Array.from({ length: 121 }, (_, i) => i + 30) // 30-150
    : Array.from({ length: 51 }, (_, i) => i + 75) // 75-125
  const SPEED_RATING_MAP: Record<string, number> = {
    L: 120, M: 130, N: 140, P: 150, Q: 160, R: 170, S: 180, T: 190, U: 200, H: 210, V: 240, W: 270, Y: 300, ZR: 240
  }
  const SPEED_RATINGS = Object.keys(SPEED_RATING_MAP)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Grundlegende Validierung
      if (!formData.make || !formData.model) {
        alert('Bitte Hersteller und Modell angeben')
        setLoading(false)
        return
      }
      
      if (!formData.year || formData.year < 1980 || formData.year > new Date().getFullYear() + 1) {
        alert('Bitte ein gültiges Baujahr angeben')
        setLoading(false)
        return
      }

      // Prüfe ob mindestens ein Reifentyp ausgewählt ist
      if (!formData.hasSummerTires && !formData.hasWinterTires && !formData.hasAllSeasonTires) {
        alert('Bitte mindestens einen Reifentyp auswählen')
        setLoading(false)
        return
      }

      // Validierung Sommerreifen
      if (formData.hasSummerTires) {
        if (!formData.summerWidth || !formData.summerAspectRatio || !formData.summerDiameter) {
          alert('Bitte alle Dimensionen für Sommerreifen angeben')
          setLoading(false)
          return
        }
        if (formData.summerDifferentSizes) {
          if (!formData.summerRearWidth || !formData.summerRearAspectRatio || !formData.summerRearDiameter) {
            alert('Bitte alle Hinterreifen-Dimensionen für Sommerreifen angeben')
            setLoading(false)
            return
          }
        }
      }

      // Validierung Winterreifen
      if (formData.hasWinterTires) {
        if (!formData.winterWidth || !formData.winterAspectRatio || !formData.winterDiameter) {
          alert('Bitte alle Dimensionen für Winterreifen angeben')
          setLoading(false)
          return
        }
        if (formData.winterDifferentSizes) {
          if (!formData.winterRearWidth || !formData.winterRearAspectRatio || !formData.winterRearDiameter) {
            alert('Bitte alle Hinterreifen-Dimensionen für Winterreifen angeben')
            setLoading(false)
            return
          }
        }
      }

      // Validierung Ganzjahresreifen
      if (formData.hasAllSeasonTires) {
        if (!formData.allSeasonWidth || !formData.allSeasonAspectRatio || !formData.allSeasonDiameter) {
          alert('Bitte alle Dimensionen für Ganzjahresreifen angeben')
          setLoading(false)
          return
        }
        if (formData.allSeasonDifferentSizes) {
          if (!formData.allSeasonRearWidth || !formData.allSeasonRearAspectRatio || !formData.allSeasonRearDiameter) {
            alert('Bitte alle Hinterreifen-Dimensionen für Ganzjahresreifen angeben')
            setLoading(false)
            return
          }
        }
      }

      const payload: any = {
        vehicleType: formData.vehicleType,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        licensePlate: formData.licensePlate || undefined,
      }

      if (formData.hasSummerTires && formData.summerWidth && formData.summerAspectRatio && formData.summerDiameter) {
        payload.summerTires = {
          width: parseInt(formData.summerWidth),
          aspectRatio: parseInt(formData.summerAspectRatio),
          diameter: parseInt(formData.summerDiameter),
          loadIndex: formData.summerLoadIndex ? parseInt(formData.summerLoadIndex) : undefined,
          speedRating: formData.summerSpeedRating || undefined,
          hasDifferentSizes: formData.summerDifferentSizes,
          rearWidth: formData.summerDifferentSizes && formData.summerRearWidth ? parseInt(formData.summerRearWidth) : undefined,
          rearAspectRatio: formData.summerDifferentSizes && formData.summerRearAspectRatio ? parseInt(formData.summerRearAspectRatio) : undefined,
          rearDiameter: formData.summerDifferentSizes && formData.summerRearDiameter ? parseInt(formData.summerRearDiameter) : undefined,
          rearLoadIndex: formData.summerDifferentSizes && formData.summerRearLoadIndex ? parseInt(formData.summerRearLoadIndex) : undefined,
          rearSpeedRating: formData.summerDifferentSizes && formData.summerRearSpeedRating ? formData.summerRearSpeedRating : undefined,
        }
      }

      if (formData.hasWinterTires && formData.winterWidth && formData.winterAspectRatio && formData.winterDiameter) {
        payload.winterTires = {
          width: parseInt(formData.winterWidth),
          aspectRatio: parseInt(formData.winterAspectRatio),
          diameter: parseInt(formData.winterDiameter),
          loadIndex: formData.winterLoadIndex ? parseInt(formData.winterLoadIndex) : undefined,
          speedRating: formData.winterSpeedRating || undefined,
          hasDifferentSizes: formData.winterDifferentSizes,
          rearWidth: formData.winterDifferentSizes && formData.winterRearWidth ? parseInt(formData.winterRearWidth) : undefined,
          rearAspectRatio: formData.winterDifferentSizes && formData.winterRearAspectRatio ? parseInt(formData.winterRearAspectRatio) : undefined,
          rearDiameter: formData.winterDifferentSizes && formData.winterRearDiameter ? parseInt(formData.winterRearDiameter) : undefined,
          rearLoadIndex: formData.winterDifferentSizes && formData.winterRearLoadIndex ? parseInt(formData.winterRearLoadIndex) : undefined,
          rearSpeedRating: formData.winterDifferentSizes && formData.winterRearSpeedRating ? formData.winterRearSpeedRating : undefined,
        }
      }

      if (formData.hasAllSeasonTires && formData.allSeasonWidth && formData.allSeasonAspectRatio && formData.allSeasonDiameter) {
        payload.allSeasonTires = {
          width: parseInt(formData.allSeasonWidth),
          aspectRatio: parseInt(formData.allSeasonAspectRatio),
          diameter: parseInt(formData.allSeasonDiameter),
          loadIndex: formData.allSeasonLoadIndex ? parseInt(formData.allSeasonLoadIndex) : undefined,
          speedRating: formData.allSeasonSpeedRating || undefined,
          hasDifferentSizes: formData.allSeasonDifferentSizes,
          rearWidth: formData.allSeasonDifferentSizes && formData.allSeasonRearWidth ? parseInt(formData.allSeasonRearWidth) : undefined,
          rearAspectRatio: formData.allSeasonDifferentSizes && formData.allSeasonRearAspectRatio ? parseInt(formData.allSeasonRearAspectRatio) : undefined,
          rearDiameter: formData.allSeasonDifferentSizes && formData.allSeasonRearDiameter ? parseInt(formData.allSeasonRearDiameter) : undefined,
          rearLoadIndex: formData.allSeasonDifferentSizes && formData.allSeasonRearLoadIndex ? parseInt(formData.allSeasonRearLoadIndex) : undefined,
          rearSpeedRating: formData.allSeasonDifferentSizes && formData.allSeasonRearSpeedRating ? formData.allSeasonRearSpeedRating : undefined,
        }
      }

      // Add VIN and inspection fields
      if (formData.vin) {
        payload.vin = formData.vin
      }
      if (formData.nextInspectionDate) {
        payload.nextInspectionDate = formData.nextInspectionDate
        payload.inspectionReminder = formData.inspectionReminder || false
        if (formData.inspectionReminder && formData.inspectionReminderDays) {
          payload.inspectionReminderDays = parseInt(formData.inspectionReminderDays.toString())
        }
      }

      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Fahrzeug bearbeiten</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body - Same as AddVehicleModal */}
          <div className="px-6 py-6 space-y-6">
            {/* Vehicle Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fahrzeugdaten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fahrzeugtyp *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="CAR">🚗 Auto</option>
                    <option value="MOTORCYCLE">🏍️ Motorrad</option>
                    <option value="TRAILER">🚚 Anhänger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hersteller *
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder={formData.vehicleType === 'MOTORCYCLE' ? 'z.B. Yamaha' : formData.vehicleType === 'TRAILER' ? 'z.B. Humbaur' : 'z.B. Volkswagen'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modell *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder={formData.vehicleType === 'MOTORCYCLE' ? 'z.B. MT-07' : formData.vehicleType === 'TRAILER' ? 'z.B. HA 752513' : 'z.B. Golf'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baujahr *
                  </label>
                  <input
                    type="number"
                    name="year"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kennzeichen (optional)
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="z.B. B-XY 1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fahrzeug-Identifizierungsnummer (VIN) (optional)
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder="z.B. WDB1234567890"
                    maxLength={17}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nächster TÜV-Termin (optional)
                  </label>
                  <input
                    type="month"
                    name="nextInspectionDate"
                    value={formData.nextInspectionDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Monat und Jahr des nächsten TÜV-Termins</p>
                </div>

                {formData.nextInspectionDate && (
                  <>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="inspectionReminderEdit"
                          name="inspectionReminder"
                          checked={formData.inspectionReminder}
                          onChange={handleChange}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="inspectionReminderEdit" className="ml-3 text-sm font-medium text-gray-700">
                          Erinnerung vor TÜV-Termin erhalten
                        </label>
                      </div>
                    </div>

                    {formData.inspectionReminder && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tage vor TÜV-Termin
                        </label>
                        <select
                          name="inspectionReminderDays"
                          value={formData.inspectionReminderDays}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="7">7 Tage vorher</option>
                          <option value="14">14 Tage vorher</option>
                          <option value="30">30 Tage vorher</option>
                          <option value="60">60 Tage vorher</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Summer Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasSummerTires"
                  name="hasSummerTires"
                  checked={formData.hasSummerTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">☀️</span>
                  Sommerreifen
                </label>
              </div>

              {formData.hasSummerTires && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                    <select name="summerWidth" value={formData.summerWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                    <select name="summerAspectRatio" value={formData.summerAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                    <select name="summerDiameter" value={formData.summerDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                    <select name="summerLoadIndex" value={formData.summerLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Optional</option>
                      {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                    <select name="summerSpeedRating" value={formData.summerSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Optional</option>
                      {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Winter Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasWinterTires"
                  name="hasWinterTires"
                  checked={formData.hasWinterTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasWinterTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">❄️</span>
                  Winterreifen
                </label>
              </div>

              {formData.hasWinterTires && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                    <select name="winterWidth" value={formData.winterWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                    <select name="winterAspectRatio" value={formData.winterAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                    <select name="winterDiameter" value={formData.winterDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                    <select name="winterLoadIndex" value={formData.winterLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Optional</option>
                      {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                    <select name="winterSpeedRating" value={formData.winterSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Optional</option>
                      {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* All Season Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasAllSeasonTires"
                  name="hasAllSeasonTires"
                  checked={formData.hasAllSeasonTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasAllSeasonTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">🌤️</span>
                  Ganzjahresreifen
                </label>
              </div>

              {formData.hasAllSeasonTires && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 ml-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                    <select name="allSeasonWidth" value={formData.allSeasonWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                    <select name="allSeasonAspectRatio" value={formData.allSeasonAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                    <select name="allSeasonDiameter" value={formData.allSeasonDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Wählen</option>
                      {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                    <select name="allSeasonLoadIndex" value={formData.allSeasonLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Optional</option>
                      {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                    <select name="allSeasonSpeedRating" value={formData.allSeasonSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                      <option value="">Optional</option>
                      {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Add Vehicle Modal Component
function AddVehicleModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    vehicleType: 'CAR',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    licensePlate: '',
    vin: '',
    nextInspectionDate: '',
    inspectionReminder: false,
    inspectionReminderDays: '30',
    // Summer Tires
    hasSummerTires: false,
    summerDifferentSizes: false,
    summerWidth: '',
    summerAspectRatio: '',
    summerDiameter: '',
    summerLoadIndex: '',
    summerSpeedRating: '',
    summerRearWidth: '',
    summerRearAspectRatio: '',
    summerRearDiameter: '',
    summerRearLoadIndex: '',
    summerRearSpeedRating: '',
    // Winter Tires
    hasWinterTires: false,
    winterDifferentSizes: false,
    winterWidth: '',
    winterAspectRatio: '',
    winterDiameter: '',
    winterLoadIndex: '',
    winterSpeedRating: '',
    winterRearWidth: '',
    winterRearAspectRatio: '',
    winterRearDiameter: '',
    winterRearLoadIndex: '',
    winterRearSpeedRating: '',
    // All Season Tires
    hasAllSeasonTires: false,
    allSeasonDifferentSizes: false,
    allSeasonWidth: '',
    allSeasonAspectRatio: '',
    allSeasonDiameter: '',
    allSeasonLoadIndex: '',
    allSeasonSpeedRating: '',
    allSeasonRearWidth: '',
    allSeasonRearAspectRatio: '',
    allSeasonRearDiameter: '',
    allSeasonRearLoadIndex: '',
    allSeasonRearSpeedRating: '',
  })

  // Dynamische Reifengrößen basierend auf Fahrzeugtyp
  const TIRE_WIDTHS = formData.vehicleType === 'MOTORCYCLE' 
    ? [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390, 400]
    : [135, 145, 155, 165, 175, 185, 195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325, 335, 345, 355, 365, 375, 385, 395]
  
  const ASPECT_RATIOS = formData.vehicleType === 'MOTORCYCLE'
    ? [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]
    : [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85]
  
  const DIAMETERS = formData.vehicleType === 'MOTORCYCLE'
    ? [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
    : [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]
  
  // Complete load index mapping for both motorcycles and cars
  const LOAD_INDEX_MAP: Record<number, number> = {
    30: 106, 31: 109, 32: 112, 33: 115, 34: 118, 35: 121, 36: 125, 37: 128, 38: 132, 39: 136, 40: 140, 41: 145, 42: 150, 43: 155, 44: 160,
    45: 165, 46: 170, 47: 175, 48: 180, 49: 185, 50: 190, 51: 195, 52: 200, 53: 206, 54: 212, 55: 218, 56: 224, 57: 230, 58: 236, 59: 243,
    60: 250, 61: 257, 62: 265, 63: 272, 64: 280, 65: 290, 66: 300, 67: 307, 68: 315, 69: 325, 70: 335, 71: 345, 72: 355, 73: 365, 74: 375,
    75: 387, 76: 400, 77: 412, 78: 425, 79: 437, 80: 450, 81: 462, 82: 475, 83: 487, 84: 500, 85: 515, 86: 530, 87: 545, 88: 560, 89: 580,
    90: 600, 91: 615, 92: 630, 93: 650, 94: 670, 95: 690, 96: 710, 97: 730, 98: 750, 99: 775, 100: 800, 101: 825, 102: 850, 103: 875, 104: 900,
    105: 925, 106: 950, 107: 975, 108: 1000, 109: 1030, 110: 1060, 111: 1090, 112: 1120, 113: 1150, 114: 1180, 115: 1215, 116: 1250, 117: 1285,
    118: 1320, 119: 1360, 120: 1400, 121: 1450, 122: 1500, 123: 1550, 124: 1600, 125: 1650, 126: 1700, 127: 1750, 128: 1800, 129: 1850, 130: 1900,
    131: 1950, 132: 2000, 133: 2060, 134: 2120, 135: 2180, 136: 2240, 137: 2300, 138: 2360, 139: 2430, 140: 2500, 141: 2575, 142: 2650, 143: 2725,
    144: 2800, 145: 2900, 146: 3000, 147: 3075, 148: 3150, 149: 3250, 150: 3350
  }
  
  // Dynamic load indices based on vehicle type
  const LOAD_INDICES = formData.vehicleType === 'MOTORCYCLE'
    ? Array.from({ length: 121 }, (_, i) => i + 30) // 30-150
    : Array.from({ length: 51 }, (_, i) => i + 75) // 75-125
  const SPEED_RATING_MAP: Record<string, number> = {
    L: 120, M: 130, N: 140, P: 150, Q: 160, R: 170, S: 180, T: 190, U: 200, H: 210, V: 240, W: 270, Y: 300, ZR: 240
  }
  const SPEED_RATINGS = Object.keys(SPEED_RATING_MAP)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Grundlegende Validierung
      if (!formData.make || !formData.model) {
        alert('Bitte Hersteller und Modell angeben')
        setLoading(false)
        return
      }
      
      if (!formData.year || formData.year < 1980 || formData.year > new Date().getFullYear() + 1) {
        alert('Bitte ein gültiges Baujahr angeben')
        setLoading(false)
        return
      }

      // Prüfe ob mindestens ein Reifentyp ausgewählt ist
      if (!formData.hasSummerTires && !formData.hasWinterTires && !formData.hasAllSeasonTires) {
        alert('Bitte mindestens einen Reifentyp auswählen')
        setLoading(false)
        return
      }

      // Validierung Sommerreifen
      if (formData.hasSummerTires) {
        if (!formData.summerWidth || !formData.summerAspectRatio || !formData.summerDiameter) {
          alert('Bitte alle Dimensionen für Sommerreifen angeben')
          setLoading(false)
          return
        }
        if (formData.summerDifferentSizes) {
          if (!formData.summerRearWidth || !formData.summerRearAspectRatio || !formData.summerRearDiameter) {
            alert('Bitte alle Hinterreifen-Dimensionen für Sommerreifen angeben')
            setLoading(false)
            return
          }
        }
      }

      // Validierung Winterreifen
      if (formData.hasWinterTires) {
        if (!formData.winterWidth || !formData.winterAspectRatio || !formData.winterDiameter) {
          alert('Bitte alle Dimensionen für Winterreifen angeben')
          setLoading(false)
          return
        }
        if (formData.winterDifferentSizes) {
          if (!formData.winterRearWidth || !formData.winterRearAspectRatio || !formData.winterRearDiameter) {
            alert('Bitte alle Hinterreifen-Dimensionen für Winterreifen angeben')
            setLoading(false)
            return
          }
        }
      }

      // Validierung Ganzjahresreifen
      if (formData.hasAllSeasonTires) {
        if (!formData.allSeasonWidth || !formData.allSeasonAspectRatio || !formData.allSeasonDiameter) {
          alert('Bitte alle Dimensionen für Ganzjahresreifen angeben')
          setLoading(false)
          return
        }
        if (formData.allSeasonDifferentSizes) {
          if (!formData.allSeasonRearWidth || !formData.allSeasonRearAspectRatio || !formData.allSeasonRearDiameter) {
            alert('Bitte alle Hinterreifen-Dimensionen für Ganzjahresreifen angeben')
            setLoading(false)
            return
          }
        }
      }

      const payload: any = {
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        licensePlate: formData.licensePlate || undefined,
      }

      if (formData.hasSummerTires && formData.summerWidth && formData.summerAspectRatio && formData.summerDiameter) {
        payload.summerTires = {
          width: parseInt(formData.summerWidth),
          aspectRatio: parseInt(formData.summerAspectRatio),
          diameter: parseInt(formData.summerDiameter),
          loadIndex: formData.summerLoadIndex ? parseInt(formData.summerLoadIndex) : undefined,
          speedRating: formData.summerSpeedRating || undefined,
          hasDifferentSizes: formData.summerDifferentSizes,
          rearWidth: formData.summerDifferentSizes && formData.summerRearWidth ? parseInt(formData.summerRearWidth) : undefined,
          rearAspectRatio: formData.summerDifferentSizes && formData.summerRearAspectRatio ? parseInt(formData.summerRearAspectRatio) : undefined,
          rearDiameter: formData.summerDifferentSizes && formData.summerRearDiameter ? parseInt(formData.summerRearDiameter) : undefined,
          rearLoadIndex: formData.summerDifferentSizes && formData.summerRearLoadIndex ? parseInt(formData.summerRearLoadIndex) : undefined,
          rearSpeedRating: formData.summerDifferentSizes && formData.summerRearSpeedRating ? formData.summerRearSpeedRating : undefined,
        }
      }

      if (formData.hasWinterTires && formData.winterWidth && formData.winterAspectRatio && formData.winterDiameter) {
        payload.winterTires = {
          width: parseInt(formData.winterWidth),
          aspectRatio: parseInt(formData.winterAspectRatio),
          diameter: parseInt(formData.winterDiameter),
          loadIndex: formData.winterLoadIndex ? parseInt(formData.winterLoadIndex) : undefined,
          speedRating: formData.winterSpeedRating || undefined,
          hasDifferentSizes: formData.winterDifferentSizes,
          rearWidth: formData.winterDifferentSizes && formData.winterRearWidth ? parseInt(formData.winterRearWidth) : undefined,
          rearAspectRatio: formData.winterDifferentSizes && formData.winterRearAspectRatio ? parseInt(formData.winterRearAspectRatio) : undefined,
          rearDiameter: formData.winterDifferentSizes && formData.winterRearDiameter ? parseInt(formData.winterRearDiameter) : undefined,
          rearLoadIndex: formData.winterDifferentSizes && formData.winterRearLoadIndex ? parseInt(formData.winterRearLoadIndex) : undefined,
          rearSpeedRating: formData.winterDifferentSizes && formData.winterRearSpeedRating ? formData.winterRearSpeedRating : undefined,
        }
      }

      if (formData.hasAllSeasonTires && formData.allSeasonWidth && formData.allSeasonAspectRatio && formData.allSeasonDiameter) {
        payload.allSeasonTires = {
          width: parseInt(formData.allSeasonWidth),
          aspectRatio: parseInt(formData.allSeasonAspectRatio),
          diameter: parseInt(formData.allSeasonDiameter),
          loadIndex: formData.allSeasonLoadIndex ? parseInt(formData.allSeasonLoadIndex) : undefined,
          speedRating: formData.allSeasonSpeedRating || undefined,
          hasDifferentSizes: formData.allSeasonDifferentSizes,
          rearWidth: formData.allSeasonDifferentSizes && formData.allSeasonRearWidth ? parseInt(formData.allSeasonRearWidth) : undefined,
          rearAspectRatio: formData.allSeasonDifferentSizes && formData.allSeasonRearAspectRatio ? parseInt(formData.allSeasonRearAspectRatio) : undefined,
          rearDiameter: formData.allSeasonDifferentSizes && formData.allSeasonRearDiameter ? parseInt(formData.allSeasonRearDiameter) : undefined,
          rearLoadIndex: formData.allSeasonDifferentSizes && formData.allSeasonRearLoadIndex ? parseInt(formData.allSeasonRearLoadIndex) : undefined,
          rearSpeedRating: formData.allSeasonDifferentSizes && formData.allSeasonRearSpeedRating ? formData.allSeasonRearSpeedRating : undefined,
        }
      }

      // Add vehicle type
      payload.vehicleType = formData.vehicleType

      // Add VIN and inspection fields
      if (formData.vin) {
        payload.vin = formData.vin
      }
      if (formData.nextInspectionDate) {
        payload.nextInspectionDate = formData.nextInspectionDate
        payload.inspectionReminder = formData.inspectionReminder || false
        if (formData.inspectionReminder && formData.inspectionReminderDays) {
          payload.inspectionReminderDays = parseInt(formData.inspectionReminderDays.toString())
        }
      }

      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Fehler:', error)
      alert('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Fahrzeug hinzufügen</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6">
            {/* Vehicle Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fahrzeugdaten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fahrzeugtyp *
                  </label>
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="CAR">🚗 Auto</option>
                    <option value="MOTORCYCLE">🏍️ Motorrad</option>
                    <option value="TRAILER">🚚 Anhänger</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hersteller *
                  </label>
                  <input
                    type="text"
                    name="make"
                    value={formData.make}
                    onChange={handleChange}
                    placeholder={formData.vehicleType === 'MOTORCYCLE' ? 'z.B. Yamaha' : formData.vehicleType === 'TRAILER' ? 'z.B. Humbaur' : 'z.B. Volkswagen'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modell *
                  </label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    placeholder={formData.vehicleType === 'MOTORCYCLE' ? 'z.B. MT-07' : formData.vehicleType === 'TRAILER' ? 'z.B. HA 752513' : 'z.B. Golf'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Baujahr *
                  </label>
                  <input
                    type="number"
                    name="year"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kennzeichen (optional)
                  </label>
                  <input
                    type="text"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    placeholder="z.B. B-XY 1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fahrzeug-Identifizierungsnummer (VIN) (optional)
                  </label>
                  <input
                    type="text"
                    name="vin"
                    value={formData.vin}
                    onChange={handleChange}
                    placeholder="z.B. WDB1234567890"
                    maxLength={17}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nächster TÜV-Termin (optional)
                  </label>
                  <input
                    type="month"
                    name="nextInspectionDate"
                    value={formData.nextInspectionDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Monat und Jahr des nächsten TÜV-Termins</p>
                </div>

                {formData.nextInspectionDate && (
                  <>
                    <div className="col-span-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="inspectionReminderAdd"
                          name="inspectionReminder"
                          checked={formData.inspectionReminder}
                          onChange={handleChange}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="inspectionReminderAdd" className="ml-3 text-sm font-medium text-gray-700">
                          Erinnerung vor TÜV-Termin erhalten
                        </label>
                      </div>
                    </div>

                    {formData.inspectionReminder && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tage vor TÜV-Termin
                        </label>
                        <select
                          name="inspectionReminderDays"
                          value={formData.inspectionReminderDays}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="7">7 Tage vorher</option>
                          <option value="14">14 Tage vorher</option>
                          <option value="30">30 Tage vorher</option>
                          <option value="60">60 Tage vorher</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Summer Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasSummerTires"
                  name="hasSummerTires"
                  checked={formData.hasSummerTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasSummerTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">☀️</span>
                  Sommerreifen
                </label>
              </div>

              {formData.hasSummerTires && (
                <div className="ml-8 space-y-4">
                  {formData.summerDifferentSizes && (
                    <h4 className="text-md font-medium text-gray-800">Vorderreifen</h4>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                      <select name="summerWidth" value={formData.summerWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                      <select name="summerAspectRatio" value={formData.summerAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                      <select name="summerDiameter" value={formData.summerDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                      <select name="summerLoadIndex" value={formData.summerLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Optional</option>
                        {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                      <select name="summerSpeedRating" value={formData.summerSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Optional</option>
                        {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="summerDifferentSizes"
                      name="summerDifferentSizes"
                      checked={formData.summerDifferentSizes}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="summerDifferentSizes" className="ml-2 text-sm font-medium text-gray-700">
                      Unterschiedliche Größen vorne/hinten (Mischbereifung)
                    </label>
                  </div>

                  {formData.summerDifferentSizes && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-800">Hinterreifen</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                          <select name="summerRearWidth" value={formData.summerRearWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                          <select name="summerRearAspectRatio" value={formData.summerRearAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                          <select name="summerRearDiameter" value={formData.summerRearDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                          <select name="summerRearLoadIndex" value={formData.summerRearLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Optional</option>
                            {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                          <select name="summerRearSpeedRating" value={formData.summerRearSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Optional</option>
                            {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Winter Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasWinterTires"
                  name="hasWinterTires"
                  checked={formData.hasWinterTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasWinterTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">❄️</span>
                  Winterreifen
                </label>
              </div>

              {formData.hasWinterTires && (
                <div className="ml-8 space-y-4">
                  {formData.winterDifferentSizes && (
                    <h4 className="text-md font-medium text-gray-800">Vorderreifen</h4>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                      <select name="winterWidth" value={formData.winterWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                      <select name="winterAspectRatio" value={formData.winterAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                      <select name="winterDiameter" value={formData.winterDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                      <select name="winterLoadIndex" value={formData.winterLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Optional</option>
                        {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                      <select name="winterSpeedRating" value={formData.winterSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Optional</option>
                        {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="winterDifferentSizes"
                      name="winterDifferentSizes"
                      checked={formData.winterDifferentSizes}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="winterDifferentSizes" className="ml-2 text-sm font-medium text-gray-700">
                      Unterschiedliche Größen vorne/hinten (Mischbereifung)
                    </label>
                  </div>

                  {formData.winterDifferentSizes && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-800">Hinterreifen</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                          <select name="winterRearWidth" value={formData.winterRearWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                          <select name="winterRearAspectRatio" value={formData.winterRearAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                          <select name="winterRearDiameter" value={formData.winterRearDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                          <select name="winterRearLoadIndex" value={formData.winterRearLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Optional</option>
                            {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                          <select name="winterRearSpeedRating" value={formData.winterRearSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Optional</option>
                            {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* All Season Tires */}
            <div className="border-t pt-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasAllSeasonTires"
                  name="hasAllSeasonTires"
                  checked={formData.hasAllSeasonTires}
                  onChange={handleChange}
                  className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="hasAllSeasonTires" className="ml-3 text-lg font-semibold text-gray-900 flex items-center">
                  <span className="text-2xl mr-2">🌤️</span>
                  Ganzjahresreifen
                </label>
              </div>

              {formData.hasAllSeasonTires && (
                <div className="ml-8 space-y-4">
                  {formData.allSeasonDifferentSizes && (
                    <h4 className="text-md font-medium text-gray-800">Vorderreifen</h4>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                      <select name="allSeasonWidth" value={formData.allSeasonWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                      <select name="allSeasonAspectRatio" value={formData.allSeasonAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                      <select name="allSeasonDiameter" value={formData.allSeasonDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Wählen</option>
                        {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                      <select name="allSeasonLoadIndex" value={formData.allSeasonLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Optional</option>
                        {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                      <select name="allSeasonSpeedRating" value={formData.allSeasonSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="">Optional</option>
                        {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="allSeasonDifferentSizes"
                      name="allSeasonDifferentSizes"
                      checked={formData.allSeasonDifferentSizes}
                      onChange={handleChange}
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allSeasonDifferentSizes" className="ml-2 text-sm font-medium text-gray-700">
                      Unterschiedliche Größen vorne/hinten (Mischbereifung)
                    </label>
                  </div>

                  {formData.allSeasonDifferentSizes && (
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-800">Hinterreifen</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Breite (mm) *</label>
                          <select name="allSeasonRearWidth" value={formData.allSeasonRearWidth} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {TIRE_WIDTHS.map(w => <option key={w} value={w}>{w}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Querschnitt (%) *</label>
                          <select name="allSeasonRearAspectRatio" value={formData.allSeasonRearAspectRatio} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {ASPECT_RATIOS.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Zoll *</label>
                          <select name="allSeasonRearDiameter" value={formData.allSeasonRearDiameter} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Wählen</option>
                            {DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tragfähigkeit</label>
                          <select name="allSeasonRearLoadIndex" value={formData.allSeasonRearLoadIndex} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Optional</option>
                            {LOAD_INDICES.map(li => <option key={li} value={li}>{li} ({LOAD_INDEX_MAP[li]} kg)</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Geschwindigkeit</label>
                          <select name="allSeasonRearSpeedRating" value={formData.allSeasonRearSpeedRating} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="">Optional</option>
                            {SPEED_RATINGS.map(sr => <option key={sr} value={sr}>{sr} ({SPEED_RATING_MAP[sr]} km/h)</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird gespeichert...' : 'Fahrzeug speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
