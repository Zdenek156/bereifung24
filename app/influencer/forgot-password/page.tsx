'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function InfluencerForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch('/api/influencer/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Fehler beim Versenden der E-Mail')
        setLoading(false)
        return
      }

      setSuccess(true)
      setEmail('')
    } catch (err) {
      console.error('Password reset request error:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bereifung24</h1>
          <p className="text-lg text-gray-600">Influencer Portal</p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <Link 
              href="/influencer/login"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
            >
              ← Zurück zum Login
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Passwort vergessen?</h2>
          <p className="text-gray-600 mb-6">
            Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
              <p className="font-medium mb-2">✅ E-Mail versendet!</p>
              <p className="text-sm mb-3">
                Falls ein Account mit dieser E-Mail-Adresse existiert, haben wir Ihnen einen Link zum Zurücksetzen des Passworts gesendet.
              </p>
              <p className="text-sm">
                Bitte überprüfen Sie Ihren Posteingang (und Spam-Ordner).
              </p>
              <div className="mt-4 pt-4 border-t border-green-200">
                <p className="text-sm font-medium mb-2">Nächste Schritte:</p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Öffnen Sie die E-Mail</li>
                  <li>Klicken Sie auf den Link</li>
                  <li>Setzen Sie Ihr neues Passwort</li>
                </ol>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  E-Mail-Adresse
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="deine@email.de"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Die E-Mail-Adresse Ihres Influencer-Accounts
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gesendet...' : 'Reset-Link senden'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <strong>Sicherheitshinweis:</strong> Der Link ist 1 Stunde gültig.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Benötigen Sie Hilfe?{' '}
            <a href="mailto:support@bereifung24.de" className="text-blue-600 hover:text-blue-800 font-medium">
              support@bereifung24.de
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
