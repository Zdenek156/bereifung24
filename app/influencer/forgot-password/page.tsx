'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function InfluencerForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen lang sein')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/influencer/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.toLowerCase().trim(),
          newPassword 
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Fehler beim Zurücksetzen des Passworts')
        setLoading(false)
        return
      }

      setSuccess(true)
      setEmail('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      console.error('Password reset error:', err)
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

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <Link 
              href="/influencer/login"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
            >
              ← Zurück zum Login
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Passwort zurücksetzen</h2>
          <p className="text-gray-600 mb-6">
            Geben Sie Ihre E-Mail-Adresse und ein neues Passwort ein.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
              <p className="font-medium mb-2">✅ Passwort erfolgreich zurückgesetzt!</p>
              <p className="text-sm">
                Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
              </p>
              <Link 
                href="/influencer/login"
                className="inline-block mt-3 text-green-700 hover:text-green-900 font-medium text-sm"
              >
                Zum Login →
              </Link>
            </div>
          )}

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

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Neues Passwort
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Mindestens 8 Zeichen"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Passwort bestätigen
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Passwort wiederholen"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <strong>Hinweis:</strong> Das Passwort wird sofort geändert, ohne E-Mail-Bestätigung.
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
