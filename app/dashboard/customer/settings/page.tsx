'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/contexts/ThemeContext'

interface UserProfile {
  firstName: string
  lastName: string
  email: string
  phone: string
  street: string
  zipCode: string
  city: string
  customerType: 'PRIVATE' | 'BUSINESS'
  companyName: string
  taxId: string
}

export default function CustomerSettings() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [formData, setFormData] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    zipCode: '',
    city: '',
    customerType: 'PRIVATE',
    companyName: '',
    taxId: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'CUSTOMER') {
      router.push('/dashboard')
      return
    }

    loadProfile()
  }, [session, status, router])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          street: data.street || '',
          zipCode: data.zipCode || '',
          city: data.city || '',
          customerType: data.customerType || 'PRIVATE',
          companyName: data.companyName || '',
          taxId: data.taxId || ''
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      // Validation
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setMessage({ type: 'error', text: 'Bitte Vor- und Nachname eingeben' })
        setSaving(false)
        return
      }

      if (!formData.phone.trim()) {
        setMessage({ type: 'error', text: 'Bitte Telefonnummer eingeben' })
        setSaving(false)
        return
      }

      if (!formData.street.trim() || !formData.zipCode.trim() || !formData.city.trim()) {
        setMessage({ type: 'error', text: 'Bitte vollständige Adresse eingeben' })
        setSaving(false)
        return
      }

      if (formData.customerType === 'BUSINESS' && !formData.companyName.trim()) {
        setMessage({ type: 'error', text: 'Bitte Firmenname eingeben' })
        setSaving(false)
        return
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Einstellungen erfolgreich gespeichert!' })
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/dashboard/customer')
        }, 1000)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Fehler beim Speichern' })
        setSaving(false)
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      setMessage({ type: 'error', text: 'Fehler beim Speichern der Einstellungen' })
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ ACCOUNT ENDGÜLTIG LÖSCHEN ⚠️\n\n' +
      'Möchten Sie Ihren Account wirklich dauerhaft löschen?\n\n' +
      'Folgendes wird gelöscht:\n' +
      '• Alle Ihre persönlichen Daten\n' +
      '• Alle Ihre Anfragen und Angebote\n' +
      '• Alle Ihre Fahrzeuge\n' +
      '• Alle Ihre Buchungen\n\n' +
      '⚠️ Diese Aktion kann NICHT rückgängig gemacht werden!\n' +
      '⚠️ Ihre E-Mail-Adresse wird gesperrt und kann nicht erneut verwendet werden!\n\n' +
      'Sind Sie sicher?'
    )

    if (!confirmed) return

    const doubleConfirm = window.confirm(
      '⚠️ LETZTE WARNUNG ⚠️\n\n' +
      'Sind Sie WIRKLICH sicher?\n\n' +
      'Nach dieser Aktion:\n' +
      '• Können Sie sich nicht mehr einloggen\n' +
      '• Sind alle Ihre Daten unwiderruflich gelöscht\n' +
      '• Kann Ihre E-Mail-Adresse nicht wiederverwendet werden\n\n' +
      'Klicken Sie OK, um Ihren Account ENDGÜLTIG zu löschen.'
    )

    if (!doubleConfirm) return

    setDeleting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/profile', {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Ihr Account wurde erfolgreich gelöscht. Sie werden nun ausgeloggt.')
        // Logout and redirect
        window.location.href = '/api/auth/signout?callbackUrl=/'
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Fehler beim Löschen des Accounts' })
        setDeleting(false)
      }
    } catch (error) {
      console.error('Failed to delete account:', error)
      setMessage({ type: 'error', text: 'Fehler beim Löschen des Accounts' })
      setDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/customer"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Persönliche Daten & Einstellungen</h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Ihre Daten für die Rechnungsstellung</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 transition-colors">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' 
                : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Display Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Darstellung</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? (
                      <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Dark Mode</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {theme === 'dark' ? 'Dunkles Design aktiviert' : 'Helles Design aktiviert'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Customer Type */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Kundenart</h3>
              <div className="flex gap-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="customerType"
                    value="PRIVATE"
                    checked={formData.customerType === 'PRIVATE'}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as 'PRIVATE' | 'BUSINESS' })}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Privatkunde</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="customerType"
                    value="BUSINESS"
                    checked={formData.customerType === 'BUSINESS'}
                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value as 'PRIVATE' | 'BUSINESS' })}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Gewerblicher Kunde</span>
                </label>
              </div>
            </div>

            {/* Business Information (conditional) */}
            {formData.customerType === 'BUSINESS' && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Firmendaten</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Firmenname <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Ihre Firma GmbH"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Steuernummer / USt-IdNr (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="DE123456789"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Persönliche Daten</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vorname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Max"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nachname <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Mustermann"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    E-Mail
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">E-Mail kann nicht geändert werden</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefonnummer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Adresse</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Straße & Hausnummer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Musterstraße 123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Postleitzahl <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stadt <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Musterstadt"
                  />
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weitere Einstellungen</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/customer/weather-alert"
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Wetter-Erinnerung</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reifenwechsel-Benachrichtigungen bei Temperaturänderungen</div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Wichtig für die Rechnungsstellung</p>
                  <p>Diese Daten werden verwendet, damit Werkstätten die Rechnung oder den Beleg auf Ihren Namen bzw. Ihre Firma ausstellen können.</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 justify-end border-t border-gray-200 dark:border-gray-700 pt-6">
              <Link
                href="/dashboard/customer"
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Speichern...' : 'Einstellungen speichern'}
              </button>
            </div>
          </form>

          {/* Delete Account Section */}
          <div className="mt-12 pt-8 border-t border-red-200 dark:border-red-800">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-400 mb-2">Gefahrenzone</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Einmal gelöscht, können Sie Ihren Account nicht wiederherstellen. Bitte seien Sie sicher.
            </p>
            
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-400 mb-2">Account endgültig löschen</h4>
                  <p className="text-sm text-red-800 dark:text-red-300 mb-4">
                    Alle Ihre Daten werden unwiderruflich gelöscht. Dies umfasst alle Anfragen, Angebote, Buchungen, Fahrzeuge und persönlichen Informationen. 
                    Ihre E-Mail-Adresse wird gesperrt und kann nicht erneut verwendet werden.
                  </p>
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {deleting ? 'Wird gelöscht...' : 'Account endgültig löschen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
