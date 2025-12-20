'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DatePicker from '@/components/DatePicker'

interface TimeSlot {
  time: string
  available: boolean
}

export default function CreateAppointmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  // Optionale Felder
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [vehicleInfo, setVehicleInfo] = useState('')
  const [notes, setNotes] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Lade verfügbare Zeitslots wenn Datum ausgewählt wurde
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots()
    }
  }, [selectedDate])

  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    setError('')
    
    try {
      const response = await fetch(`/api/workshop/available-slots?date=${selectedDate}`)
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der verfügbaren Zeiten')
      }
      
      const data = await response.json()
      setAvailableSlots(data.slots || [])
    } catch (err: any) {
      console.error('Error loading slots:', err)
      setError(err.message || 'Fehler beim Laden der verfügbaren Zeiten')
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedDate || !selectedTime) {
      setError('Bitte wählen Sie ein Datum und eine Uhrzeit aus')
      return
    }
    
    setSubmitting(true)
    setError('')
    
    try {
      const response = await fetch('/api/workshop/create-manual-appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime,
          customerName: customerName.trim() || null,
          customerPhone: customerPhone.trim() || null,
          customerEmail: customerEmail.trim() || null,
          serviceDescription: serviceDescription.trim() || null,
          vehicleInfo: vehicleInfo.trim() || null,
          notes: notes.trim() || null,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Erstellen des Termins')
      }
      
      // Erfolgreich - zur Terminübersicht weiterleiten
      router.push('/dashboard/workshop/appointments')
    } catch (err: any) {
      console.error('Error creating appointment:', err)
      setError(err.message || 'Fehler beim Erstellen des Termins')
    } finally {
      setSubmitting(false)
    }
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/workshop"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Zurück zum Dashboard
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Termin erstellen</h1>
              <p className="mt-1 text-sm text-gray-600">
                Tragen Sie manuell einen neuen Termin ein
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datum & Zeit Auswahl */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Datum & Uhrzeit</h2>
              
              {/* Datum */}
              <div>
                <DatePicker
                  selectedDate={selectedDate}
                  onChange={setSelectedDate}
                  minDate={minDate}
                  label="Datum"
                  required
                />
              </div>

              {/* Uhrzeit */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uhrzeit <span className="text-red-500">*</span>
                  </label>
                  
                  {loadingSlots ? (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      <p className="mt-2 text-sm text-gray-600">Lade verfügbare Zeiten...</p>
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                            selectedTime === slot.time
                              ? 'border-primary-600 bg-primary-50 text-primary-700'
                              : slot.available
                              ? 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                              : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                      Keine verfügbaren Zeitslots für dieses Datum
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Zusätzliche Informationen <span className="text-sm font-normal text-gray-500">(Optional)</span>
              </h2>

              {/* Kunden-Informationen */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Kundeninformationen</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Max Mustermann"
                    />
                  </div>

                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="max@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Service-Informationen */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-gray-700">Service-Informationen</h3>
                
                <div>
                  <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Service-Beschreibung
                  </label>
                  <textarea
                    id="serviceDescription"
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="z.B. Reifenwechsel, Ölwechsel, Inspektion..."
                  />
                </div>
              </div>

              {/* Fahrzeug-Informationen */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-gray-700">Fahrzeuginformationen</h3>
                
                <div>
                  <label htmlFor="vehicleInfo" className="block text-sm font-medium text-gray-700 mb-1">
                    Fahrzeug
                  </label>
                  <input
                    type="text"
                    id="vehicleInfo"
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="z.B. VW Golf, B-AB 1234 oder Hersteller/Modell"
                  />
                </div>
              </div>

              {/* Notizen */}
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-medium text-gray-700">Notizen</h3>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Interne Notizen
                  </label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Zusätzliche Informationen oder Hinweise..."
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Link
                href="/dashboard/workshop/appointments"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={submitting || !selectedDate || !selectedTime}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Wird erstellt...
                  </>
                ) : (
                  'Termin erstellen'
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
