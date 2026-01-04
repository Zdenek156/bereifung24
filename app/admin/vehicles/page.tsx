'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Vehicle {
  id: string
  licensePlate: string
  make: string
  model: string
  year?: number
  vin?: string
  currentKm: number
  isActive: boolean
  assignedTo?: {
    firstName: string
    lastName: string
  }
  _count: {
    trips: number
  }
}

interface Employee {
  id: string
  firstName: string
  lastName: string
}

export default function VehiclesAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ licensePlate: '', make: '', model: '', year: '', vin: '', currentKm: '0', assignedToId: '' })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [status, session, router])

  const fetchData = async () => {
    try {
      const [vehiclesRes, employeesRes] = await Promise.all([
        fetch('/api/admin/vehicles'),
        fetch('/api/admin/b24-employees')
      ])
      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json()
        setVehicles(data.vehicles)
      }
      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data.employees)
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
      const res = await fetch('/api/admin/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        alert('Fahrzeug angelegt!')
        setShowForm(false)
        setFormData({ licensePlate: '', make: '', model: '', year: '', vin: '', currentKm: '0', assignedToId: '' })
        fetchData()
      }
    } catch (error) {
      alert('Fehler beim Anlegen')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div>Lade...</div></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700 mb-2 inline-block"> Admin Dashboard</Link>
          <h1 className="text-2xl font-bold text-gray-900">Firmenfahrzeuge</h1>
          <p className="text-sm text-gray-600">Verwaltung der Firmenfahrzeuge</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <button onClick={() => setShowForm(!showForm)} className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          {showForm ? 'Abbrechen' : '+ Neues Fahrzeug'}
        </button>

        {showForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Neues Fahrzeug anlegen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="Kennzeichen *" value={formData.licensePlate} onChange={(e) => setFormData({...formData, licensePlate: e.target.value})} className="px-3 py-2 border rounded-lg" required />
                <input placeholder="Marke *" value={formData.make} onChange={(e) => setFormData({...formData, make: e.target.value})} className="px-3 py-2 border rounded-lg" required />
                <input placeholder="Modell *" value={formData.model} onChange={(e) => setFormData({...formData, model: e.target.value})} className="px-3 py-2 border rounded-lg" required />
                <input type="number" placeholder="Baujahr" value={formData.year} onChange={(e) => setFormData({...formData, year: e.target.value})} className="px-3 py-2 border rounded-lg" />
                <input placeholder="FIN/VIN" value={formData.vin} onChange={(e) => setFormData({...formData, vin: e.target.value})} className="px-3 py-2 border rounded-lg" />
                <input type="number" placeholder="Aktueller KM-Stand" value={formData.currentKm} onChange={(e) => setFormData({...formData, currentKm: e.target.value})} className="px-3 py-2 border rounded-lg" />
              </div>
              <select value={formData.assignedToId} onChange={(e) => setFormData({...formData, assignedToId: e.target.value})} className="w-full px-3 py-2 border rounded-lg">
                <option value="">Kein Mitarbeiter zugeordnet</option>
                {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>)}
              </select>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Fahrzeug anlegen</button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold">Alle Fahrzeuge ({vehicles.length})</h2></div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kennzeichen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fahrzeug</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KM-Stand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zugeordnet</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fahrten</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vehicles.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Keine Fahrzeuge vorhanden</td></tr>
                ) : vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{vehicle.licensePlate}</td>
                    <td className="px-6 py-4">{vehicle.make} {vehicle.model} {vehicle.year && `(${vehicle.year})`}</td>
                    <td className="px-6 py-4">{vehicle.currentKm.toLocaleString()} km</td>
                    <td className="px-6 py-4">{vehicle.assignedTo ? `${vehicle.assignedTo.firstName} ${vehicle.assignedTo.lastName}` : '-'}</td>
                    <td className="px-6 py-4">{vehicle._count.trips}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${vehicle.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {vehicle.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
