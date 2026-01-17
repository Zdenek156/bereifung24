'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

export default function FahrtenbuchPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [stats, setStats] = useState({ monthKm: 0, businessKm: 0, tripCount: 0 })
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    vehicleId: '', date: '', startKm: '', endKm: '', startLocation: '', endLocation: '', purpose: '', tripType: 'BUSINESS', customerName: '', notes: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    else if (session?.user) fetchData()
  }, [status, session, router])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/employee/trips')
      if (res.ok) {
        const data = await res.json()
        setVehicles(data.vehicles)
        setTrips(data.trips)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/employee/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        alert('Fahrt eingetragen!')
        setShowForm(false)
        setFormData({ vehicleId: '', date: '', startKm: '', endKm: '', startLocation: '', endLocation: '', purpose: '', tripType: 'BUSINESS', customerName: '', notes: '' })
        fetchData()
      }
    } catch (error) {
      alert('Fehler beim Eintragen')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div>Lade...</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Fahrtenbuch</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Monat gesamt</div>
            <div className="text-2xl font-bold text-blue-600">{stats.monthKm} km</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Geschäftlich</div>
            <div className="text-2xl font-bold text-green-600">{stats.businessKm} km</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Fahrten</div>
            <div className="text-2xl font-bold text-gray-900">{stats.tripCount}</div>
          </div>
        </div>

        <button onClick={() => setShowForm(!showForm)} className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {showForm ? 'Abbrechen' : '+ Neue Fahrt'}
        </button>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <select value={formData.vehicleId} onChange={(e) => setFormData({...formData, vehicleId: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Fahrzeug wählen</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.licensePlate} - {v.make} {v.model}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="px-3 py-2 border rounded-lg" required />
                <select value={formData.tripType} onChange={(e) => setFormData({...formData, tripType: e.target.value})} className="px-3 py-2 border rounded-lg">
                  <option value="BUSINESS">Geschäftlich</option>
                  <option value="PRIVATE">Privat</option>
                  <option value="COMMUTE">Arbeitsweg</option>
                </select>
                <input type="number" placeholder="Start-KM" value={formData.startKm} onChange={(e) => setFormData({...formData, startKm: e.target.value})} className="px-3 py-2 border rounded-lg" required />
                <input type="number" placeholder="End-KM" value={formData.endKm} onChange={(e) => setFormData({...formData, endKm: e.target.value})} className="px-3 py-2 border rounded-lg" required />
                <input placeholder="Von" value={formData.startLocation} onChange={(e) => setFormData({...formData, startLocation: e.target.value})} className="px-3 py-2 border rounded-lg" required />
                <input placeholder="Nach" value={formData.endLocation} onChange={(e) => setFormData({...formData, endLocation: e.target.value})} className="px-3 py-2 border rounded-lg" required />
              </div>
              <input placeholder="Zweck der Fahrt" value={formData.purpose} onChange={(e) => setFormData({...formData, purpose: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required />
              <input placeholder="Kunde (optional)" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Eintragen</button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Fahrten (letzte 30 Tage)</h2></div>
          <div className="divide-y">
            {trips.length === 0 ? <div className="px-6 py-8 text-center text-gray-500">Keine Fahrten vorhanden</div> : trips.map((trip) => (
              <div key={trip.id} className="px-6 py-4">
                <div className="flex justify-between">
                  <div>
                    <div className="font-medium">{trip.vehicle.licensePlate} - {trip.startLocation}  {trip.endLocation}</div>
                    <div className="text-sm text-gray-600">{new Date(trip.date).toLocaleDateString('de-DE')}  {trip.distanceKm} km  {trip.tripType === 'BUSINESS' ? ' Geschäftlich' : trip.tripType === 'PRIVATE' ? ' Privat' : ' Arbeitsweg'}</div>
                    <div className="text-sm text-gray-500">{trip.purpose}</div>
                  </div>
                  <div className="text-sm text-gray-500">{trip.startKm} - {trip.endKm} km</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
