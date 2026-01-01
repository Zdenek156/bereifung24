'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Ungültiger Reset-Link. Bitte fordern Sie einen neuen an.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!token) {
      setError('Ungültiger Reset-Link')
      return
    }

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
      const res = await fetch('/api/influencer/auth/reset-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token,
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Bereifung24</h1>
          <p className="text-lg text-gray-600">Influencer Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <Link 
              href="/influencer/login"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
            >
              ← Zurück zum Login
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Neues Passwort setzen</h2>
          <p className="text-gray-600 mb-6">
            Geben Sie Ihr neues Passwort ein.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
              <p className="font-medium mb-2">✅ Passwort erfolgreich geändert!</p>
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

          {!success && token && (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                disabled={loading || !token}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird gespeichert...' : 'Passwort ändern'}
              </button>
            </form>
          )}

          {!token && (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Der Reset-Link ist ungültig.</p>
              <Link 
                href="/influencer/forgot-password"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Neuen Reset-Link anfordern →
              </Link>
            </div>
          )}
        </div>

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

export default function InfluencerResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-600">Lädt...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
