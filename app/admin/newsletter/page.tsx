'use client'

import { useState } from 'react'
import BackButton from '@/components/BackButton'
import Link from 'next/link'

type RecipientGroup = 'workshops_no_revenue' | 'workshops_with_revenue' | 'customers_no_requests' | 'customers_with_pending_offers' | 'all_customers' | 'all_employees'

export default function AdminNewsletterPage() {
  const [recipientGroup, setRecipientGroup] = useState<RecipientGroup>('all_customers')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [testSuccess, setTestSuccess] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<{
    recipientCount: number
    recipientList: string[]
  } | null>(null)

  const recipientOptions = [
    { value: 'workshops_no_revenue', label: 'Werkstätten ohne Umsatz', icon: '💤' },
    { value: 'workshops_with_revenue', label: 'Werkstätten mit Umsatz', icon: '🏭' },
    { value: 'customers_no_requests', label: 'Kunden ohne Anfragen', icon: '📝' },
    { value: 'customers_with_pending_offers', label: 'Kunden mit offenen Angeboten', icon: '⏳' },
    { value: 'all_customers', label: 'Alle Kunden', icon: '👥' },
    { value: 'all_employees', label: 'Alle Mitarbeiter', icon: '👔' }
  ]

  const fetchRecipientStats = async (group: RecipientGroup) => {
    try {
      const response = await fetch(`/api/admin/email/recipients?group=${group}`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleGroupChange = (group: RecipientGroup) => {
    setRecipientGroup(group)
    fetchRecipientStats(group)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    
    if (!subject.trim() || !message.trim()) {
      setError('Bitte füllen Sie alle Felder aus')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientGroup,
          subject,
          message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Fehler beim Senden der E-Mails')
        setLoading(false)
        return
      }

      setSuccess(true)
      setSubject('')
      setMessage('')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  const handleTestEmail = async () => {
    setError('')
    setTestSuccess(false)
    
    if (!testEmail.trim()) {
      setError('Bitte geben Sie eine Test-E-Mail-Adresse ein')
      return
    }

    if (!subject.trim() || !message.trim()) {
      setError('Bitte füllen Sie Betreff und Nachricht aus')
      return
    }

    setTestLoading(true)

    try {
      const response = await fetch('/api/admin/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail,
          subject,
          message
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Fehler beim Senden der Test-E-Mail')
        setTestLoading(false)
        return
      }

      setTestSuccess(true)
      setTimeout(() => setTestSuccess(false), 5000)
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4">
            <BackButton />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter</h1>
          <p className="text-gray-600 mt-2">Senden Sie Nachrichten und Updates an Ihre Nutzer</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">E-Mails erfolgreich versendet!</span>
            </div>
          </div>
        )}

        {/* Test Email Success */}
        {testSuccess && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-6 py-4 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Test-E-Mail erfolgreich versendet!</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Group Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Empfängergruppe
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipientOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleGroupChange(option.value as RecipientGroup)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      recipientGroup === option.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{option.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        {stats && recipientGroup === option.value && (
                          <div className="text-sm text-gray-600 mt-1">
                            {stats.recipientCount} Empfänger
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {stats && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>{stats.recipientCount}</strong> Empfänger werden diese E-Mail erhalten
                  </p>
                </div>
              )}
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Betreff
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Neue Features auf Bereifung24"
                required
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Nachricht
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ihre Nachricht an die Empfänger..."
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Die Nachricht wird als HTML-formatierte E-Mail versendet.
              </p>
            </div>

            {/* Test Email Section */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">🧪 Test-E-Mail versenden</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="test@example.com"
                />
                <button
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testLoading || !subject.trim() || !message.trim()}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {testLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sende...
                    </span>
                  ) : (
                    'Test senden'
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Senden Sie eine Test-E-Mail, um die Vorschau zu prüfen bevor Sie an alle versenden
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                {stats ? (
                  <span>
                    📧 Wird an <strong>{stats.recipientCount}</strong> Empfänger gesendet
                  </span>
                ) : (
                  <span>Wählen Sie eine Empfängergruppe aus</span>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !stats}
                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Wird gesendet...
                  </span>
                ) : (
                  'E-Mail senden'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Hinweise zum E-Mail-Versand</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• E-Mails werden im Hintergrund versendet</li>
            <li>• Alle E-Mails werden mit dem Bereifung24-Branding versendet</li>
            <li>• Empfänger können sich vom Newsletter abmelden</li>
            <li>• Der Versand kann einige Minuten dauern bei vielen Empfängern</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
