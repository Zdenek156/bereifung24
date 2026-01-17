'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import BackButton from '@/components/BackButton'

interface NotificationSetting {
  id: string
  email: string
  name: string | null
  notifyCustomerRegistration: boolean
  notifyWorkshopRegistration: boolean
  notifyInfluencerApplication: boolean
}

interface B24Employee {
  id: string
  firstName: string
  lastName: string
  user: {
    email: string
  }
}

export default function AdminNotificationSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [employees, setEmployees] = useState<B24Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
      return
    }

    fetchSettings()
    fetchEmployees()
  }, [session, status, router])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/notification-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/admin/b24-employees')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data.employees || [])
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    }
  }

  const addNotificationSetting = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEmployeeId) return

    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId)
    if (!selectedEmployee) return

    setSaving(true)
    try {
      const response = await fetch('/api/admin/notification-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: selectedEmployee.user.email,
          name: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        }),
      })

      if (response.ok) {
        setSelectedEmployeeId('')
        setShowAddForm(false)
        fetchSettings()
      } else {
        const error = await response.json()
        alert(error.error || 'Fehler beim Hinzufügen')
      }
    } catch (error) {
      console.error('Error adding setting:', error)
      alert('Fehler beim Hinzufügen')
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = async (id: string, field: string, value: boolean) => {
    // Optimistisches Update - sofort im UI aktualisieren
    setSettings(prevSettings => 
      prevSettings.map(setting => 
        setting.id === id ? { ...setting, [field]: value } : setting
      )
    )

    try {
      const response = await fetch('/api/admin/notification-settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          [field]: value,
        }),
      })

      if (!response.ok) {
        // Bei Fehler zurücksetzen
        fetchSettings()
        alert('Fehler beim Aktualisieren')
      }
    } catch (error) {
      console.error('Error updating setting:', error)
      // Bei Fehler zurücksetzen
      fetchSettings()
      alert('Fehler beim Aktualisieren')
    }
  }

  const deleteSetting = async (id: string, email: string) => {
    const confirmed = window.confirm(
      `Möchten Sie die Benachrichtigungseinstellungen für "${email}" wirklich löschen?`
    )
    
    if (!confirmed) return

    try {
      const response = await fetch('/api/admin/notification-settings', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        fetchSettings()
      } else {
        alert('Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Error deleting setting:', error)
      alert('Fehler beim Löschen')
    }
  }

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="mb-2">
                <BackButton />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Benachrichtigungseinstellungen
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Verwalten Sie, wer Benachrichtigungen über neue Registrierungen erhält
              </p>
            </div>
            <button
              onClick={() => {
                fetch('/api/auth/signout', { method: 'POST' })
                router.push('/login')
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Abmelden
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add New Setting */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Benachrichtigungs-Empfänger
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                {showAddForm ? 'Abbrechen' : '+ Empfänger hinzufügen'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <form onSubmit={addNotificationSetting} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    B24-Mitarbeiter auswählen *
                  </label>
                  <select
                    required
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">-- Bitte Mitarbeiter auswählen --</option>
                    {employees.map(emp => {
                      // Check if employee is already in notification settings
                      const alreadyAdded = settings.some(s => s.email === emp.user.email)
                      return (
                        <option 
                          key={emp.id} 
                          value={emp.id}
                          disabled={alreadyAdded}
                        >
                          {emp.firstName} {emp.lastName} ({emp.user.email})
                          {alreadyAdded ? ' - Bereits hinzugefügt' : ''}
                        </option>
                      )
                    })}
                  </select>
                  {employees.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      Keine B24-Mitarbeiter gefunden. Bitte zuerst Mitarbeiter in der <Link href="/admin/b24-employees" className="text-primary-600 hover:text-primary-700 font-medium">Mitarbeiter-Verwaltung</Link> anlegen.
                    </p>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Wird hinzugefügt...' : 'Hinzufügen'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Settings List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : settings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              Noch keine Benachrichtigungs-Empfänger hinzugefügt.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Fügen Sie E-Mail-Adressen hinzu, um Benachrichtigungen über neue Registrierungen zu erhalten.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {settings.map((setting) => (
              <div key={setting.id} className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {setting.name || setting.email}
                      </h3>
                      {setting.name && (
                        <p className="text-sm text-gray-600">{setting.email}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteSetting(setting.id, setting.email)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Entfernen
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Kunden-Registrierungen</p>
                        <p className="text-sm text-gray-600">
                          Benachrichtigung erhalten, wenn sich ein neuer Kunde registriert
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.notifyCustomerRegistration}
                          onChange={(e) =>
                            updateSetting(setting.id, 'notifyCustomerRegistration', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Werkstatt-Registrierungen</p>
                        <p className="text-sm text-gray-600">
                          Benachrichtigung erhalten, wenn sich eine neue Werkstatt registriert
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.notifyWorkshopRegistration}
                          onChange={(e) =>
                            updateSetting(setting.id, 'notifyWorkshopRegistration', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Influencer-Bewerbungen</p>
                        <p className="text-sm text-gray-600">
                          Benachrichtigung erhalten, wenn sich ein Influencer bewirbt
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.notifyInfluencerApplication}
                          onChange={(e) =>
                            updateSetting(setting.id, 'notifyInfluencerApplication', e.target.checked)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Hinweis zu Benachrichtigungen
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Bei Kunden-Registrierung wird automatisch eine E-Mail an alle aktivierten Empfänger gesendet</li>
                  <li>Bei Werkstatt-Registrierung wird eine E-Mail gesendet, damit diese manuell freigeschaltet werden kann</li>
                  <li>Sie können für jeden Empfänger individuell auswählen, welche Benachrichtigungen er erhalten soll</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
