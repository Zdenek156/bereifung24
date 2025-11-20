'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AlignmentPage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: 'MEASUREMENT' as 'MEASUREMENT' | 'ADJUSTMENT' | 'BOTH',
    hasSymptoms: false,
    symptoms: [] as string[],
    additionalNotes: '',
    needByDate: ''
  })

  const handleSymptomToggle = (symptom: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/tire-requests/alignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        router.push('/dashboard/customer?success=alignment')
      } else {
        const data = await res.json()
        setError(data.error || 'Fehler beim Erstellen der Anfrage')
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/dashboard/customer/select-service"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Zurück zur Service-Auswahl
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Achsvermessung Anfrage</h1>
          <p className="mt-2 text-lg text-gray-600">
            Fahrwerk vermessen und optimal einstellen lassen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">Was ist eine Achsvermessung?</p>
                <p>Die Achsvermessung (Spureinstellung) sorgt für optimalen Reifenverschleiß, besseres Fahrverhalten und erhöhte Sicherheit. Empfohlen nach Stoßdämpferwechsel, Unfällen oder bei ungleichmäßigem Reifenverschleiß.</p>
              </div>
            </div>
          </div>

          {/* Fahrzeugauswahl - Optional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fahrzeug auswählen <span className="text-gray-500">(optional)</span>
            </label>
            <select
              value={formData.vehicleId}
              onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Fahrzeug auswählen...</option>
            </select>
            <p className="mt-2 text-sm text-gray-500">
              Sie können die Anfrage auch ohne Fahrzeugauswahl erstellen
            </p>
          </div>

          {/* Service-Art */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Welchen Service benötigen Sie?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.serviceType === 'MEASUREMENT' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="MEASUREMENT"
                  checked={formData.serviceType === 'MEASUREMENT'}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Nur Vermessung</p>
                <p className="text-sm text-gray-600 text-center">Zustand prüfen</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.serviceType === 'ADJUSTMENT' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="ADJUSTMENT"
                  checked={formData.serviceType === 'ADJUSTMENT'}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Nur Einstellung</p>
                <p className="text-sm text-gray-600 text-center">Werte korrigieren</p>
              </label>

              <label className={`flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                formData.serviceType === 'BOTH' ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  name="serviceType"
                  value="BOTH"
                  checked={formData.serviceType === 'BOTH'}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value as any })}
                  className="mb-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
                />
                <p className="font-semibold text-gray-900">Vermessung + Einstellung</p>
                <p className="text-sm text-gray-600 text-center">Komplett-Service</p>
              </label>
            </div>
          </div>

          {/* Symptome */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Gibt es Auffälligkeiten?</h2>
            <label className="flex items-center gap-3 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.hasSymptoms}
                onChange={(e) => setFormData({ ...formData, hasSymptoms: e.target.checked, symptoms: [] })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-gray-900">Ja, ich habe Probleme festgestellt</span>
            </label>

            {formData.hasSymptoms && (
              <div className="space-y-3 ml-7">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes('pulling')}
                    onChange={() => handleSymptomToggle('pulling')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="block font-medium text-gray-900">Fahrzeug zieht zur Seite</span>
                    <span className="block text-sm text-gray-600">Auto weicht beim Geradeausfahren ab</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes('uneven_wear')}
                    onChange={() => handleSymptomToggle('uneven_wear')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="block font-medium text-gray-900">Ungleichmäßiger Reifenverschleiß</span>
                    <span className="block text-sm text-gray-600">Reifen nutzen sich einseitig ab</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes('vibration')}
                    onChange={() => handleSymptomToggle('vibration')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="block font-medium text-gray-900">Vibrationen im Lenkrad</span>
                    <span className="block text-sm text-gray-600">Lenkrad vibriert bei höheren Geschwindigkeiten</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.symptoms.includes('crooked_steering')}
                    onChange={() => handleSymptomToggle('crooked_steering')}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="block font-medium text-gray-900">Schiefes Lenkrad</span>
                    <span className="block text-sm text-gray-600">Lenkrad steht schief bei Geradeausfahrt</span>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Benötigt bis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Benötigt bis (optional)
            </label>
            <input
              type="date"
              value={formData.needByDate}
              onChange={(e) => setFormData({ ...formData, needByDate: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Zusätzliche Anmerkungen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zusätzliche Anmerkungen (optional)
            </label>
            <textarea
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={4}
              placeholder="z.B. kürzlich durchgeführte Reparaturen, Unfall, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Link
              href="/dashboard/customer/select-service"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wird erstellt...' : 'Anfrage erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
