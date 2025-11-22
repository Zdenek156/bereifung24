'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Vacation {
  id: string
  startDate: string
  endDate: string
  reason?: string
}

interface Employee {
  id: string
  name: string
}

export default function VacationManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [workshopVacations, setWorkshopVacations] = useState<Vacation[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [employeeVacations, setEmployeeVacations] = useState<Vacation[]>([])
  const [hasCalendar, setHasCalendar] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Workshop vacation form
  const [workshopStartDate, setWorkshopStartDate] = useState('')
  const [workshopEndDate, setWorkshopEndDate] = useState('')
  const [workshopReason, setWorkshopReason] = useState('')

  // Employee vacation form
  const [employeeStartDate, setEmployeeStartDate] = useState('')
  const [employeeEndDate, setEmployeeEndDate] = useState('')
  const [employeeReason, setEmployeeReason] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'WORKSHOP') {
      router.push('/login')
      return
    }

    fetchData()
  }, [session, status, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [vacationsRes, employeesRes] = await Promise.all([
        fetch('/api/workshop/vacations'),
        fetch('/api/workshop/employees')
      ])

      if (vacationsRes.ok) {
        const data = await vacationsRes.json()
        setWorkshopVacations(data.vacations || [])
        setHasCalendar(data.hasCalendar || false)
      }

      if (employeesRes.ok) {
        const data = await employeesRes.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployeeVacations = async (employeeId: string) => {
    try {
      const response = await fetch(`/api/workshop/employees/${employeeId}/vacations`)
      if (response.ok) {
        const data = await response.json()
        setEmployeeVacations(data.vacations || [])
      }
    } catch (error) {
      console.error('Error fetching employee vacations:', error)
    }
  }

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    if (employeeId) {
      fetchEmployeeVacations(employeeId)
    } else {
      setEmployeeVacations([])
    }
  }

  const handleAddWorkshopVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!workshopStartDate || !workshopEndDate) {
      alert('Bitte Start- und Enddatum auswählen')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/workshop/vacations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: workshopStartDate,
          endDate: workshopEndDate,
          reason: workshopReason
        })
      })

      if (response.ok) {
        setWorkshopStartDate('')
        setWorkshopEndDate('')
        setWorkshopReason('')
        fetchData()
        alert('Urlaubszeit erfolgreich hinzugefügt')
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Hinzufügen der Urlaubszeit')
      }
    } catch (error) {
      console.error('Error adding vacation:', error)
      alert('Fehler beim Hinzufügen der Urlaubszeit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteWorkshopVacation = async (vacationId: string) => {
    if (!confirm('Möchten Sie diese Urlaubszeit wirklich löschen?')) return

    try {
      const response = await fetch(`/api/workshop/vacations?id=${vacationId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchData()
        alert('Urlaubszeit erfolgreich gelöscht')
      } else {
        alert('Fehler beim Löschen der Urlaubszeit')
      }
    } catch (error) {
      console.error('Error deleting vacation:', error)
      alert('Fehler beim Löschen der Urlaubszeit')
    }
  }

  const handleAddEmployeeVacation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedEmployee) {
      alert('Bitte Mitarbeiter auswählen')
      return
    }

    if (!employeeStartDate || !employeeEndDate) {
      alert('Bitte Start- und Enddatum auswählen')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/workshop/employees/${selectedEmployee}/vacations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: employeeStartDate,
          endDate: employeeEndDate,
          reason: employeeReason
        })
      })

      if (response.ok) {
        setEmployeeStartDate('')
        setEmployeeEndDate('')
        setEmployeeReason('')
        fetchEmployeeVacations(selectedEmployee)
        alert('Urlaubszeit erfolgreich hinzugefügt')
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Hinzufügen der Urlaubszeit')
      }
    } catch (error) {
      console.error('Error adding employee vacation:', error)
      alert('Fehler beim Hinzufügen der Urlaubszeit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteEmployeeVacation = async (vacationId: string) => {
    if (!confirm('Möchten Sie diese Urlaubszeit wirklich löschen?')) return

    try {
      const response = await fetch(
        `/api/workshop/employees/${selectedEmployee}/vacations?vacationId=${vacationId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        fetchEmployeeVacations(selectedEmployee)
        alert('Urlaubszeit erfolgreich gelöscht')
      } else {
        alert('Fehler beim Löschen der Urlaubszeit')
      }
    } catch (error) {
      console.error('Error deleting employee vacation:', error)
      alert('Fehler beim Löschen der Urlaubszeit')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Urlaubsplanung</h1>
          <p className="text-gray-600">
            Verwalten Sie Betriebsurlaube und Mitarbeiter-Abwesenheiten
          </p>
        </div>

        {/* Calendar Status */}
        <div className={`mb-6 p-4 rounded-lg border-2 ${hasCalendar ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-center">
            {hasCalendar ? (
              <>
                <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-semibold text-green-900">Google Kalender verbunden</p>
                  <p className="text-sm text-green-700">Urlaubszeiten werden automatisch bei der Terminvergabe berücksichtigt</p>
                </div>
              </>
            ) : (
              <>
                <svg className="w-6 h-6 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-900">Kein Kalender verbunden</p>
                  <p className="text-sm text-yellow-700">
                    Verbinden Sie Ihren Google Kalender in den{' '}
                    <a href="/dashboard/workshop/settings" className="underline hover:text-yellow-900">Einstellungen</a>
                    {' '}für automatische Terminverwaltung
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Workshop Vacations */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Betriebsurlaub
            </h2>

            <form onSubmit={handleAddWorkshopVacation} className="mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Von
                  </label>
                  <input
                    type="date"
                    value={workshopStartDate}
                    onChange={(e) => setWorkshopStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bis
                  </label>
                  <input
                    type="date"
                    value={workshopEndDate}
                    onChange={(e) => setWorkshopEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grund (optional)
                  </label>
                  <input
                    type="text"
                    value={workshopReason}
                    onChange={(e) => setWorkshopReason(e.target.value)}
                    placeholder="z.B. Betriebsferien, Umbau, Feiertage"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Wird hinzugefügt...' : 'Urlaubszeit hinzufügen'}
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Geplante Betriebsurlaube</h3>
              {workshopVacations.length === 0 ? (
                <p className="text-gray-500 text-sm">Keine Betriebsurlaube eingetragen</p>
              ) : (
                workshopVacations.map((vacation) => (
                  <div
                    key={vacation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                      </p>
                      {vacation.reason && (
                        <p className="text-sm text-gray-600">{vacation.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteWorkshopVacation(vacation.id)}
                      className="text-red-600 hover:text-red-800 p-2"
                      title="Löschen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Employee Vacations */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mitarbeiter-Urlaub
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mitarbeiter auswählen
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => handleEmployeeChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Mitarbeiter wählen --</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedEmployee && (
              <>
                <form onSubmit={handleAddEmployeeVacation} className="mb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Von
                      </label>
                      <input
                        type="date"
                        value={employeeStartDate}
                        onChange={(e) => setEmployeeStartDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bis
                      </label>
                      <input
                        type="date"
                        value={employeeEndDate}
                        onChange={(e) => setEmployeeEndDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grund (optional)
                      </label>
                      <input
                        type="text"
                        value={employeeReason}
                        onChange={(e) => setEmployeeReason(e.target.value)}
                        placeholder="z.B. Urlaub, Krankheit, Fortbildung"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Wird hinzugefügt...' : 'Urlaubszeit hinzufügen'}
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Geplante Urlaube</h3>
                  {employeeVacations.length === 0 ? (
                    <p className="text-gray-500 text-sm">Keine Urlaube eingetragen</p>
                  ) : (
                    employeeVacations.map((vacation) => (
                      <div
                        key={vacation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {formatDate(vacation.startDate)} - {formatDate(vacation.endDate)}
                          </p>
                          {vacation.reason && (
                            <p className="text-sm text-gray-600">{vacation.reason}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteEmployeeVacation(vacation.id)}
                          className="text-red-600 hover:text-red-800 p-2"
                          title="Löschen"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {!selectedEmployee && employees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>Keine Mitarbeiter vorhanden</p>
                <p className="text-sm mt-2">
                  <a href="/dashboard/workshop/settings" className="text-primary-600 hover:text-primary-700 underline">
                    Mitarbeiter in den Einstellungen hinzufügen
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
