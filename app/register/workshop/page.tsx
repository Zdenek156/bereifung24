'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WorkshopRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    phone: '',
    website: '',
    street: '',
    zipCode: '',
    city: '',
    taxId: '',
    description: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    if (password.length < 8) errors.push('Mindestens 8 Zeichen')
    if (!/[A-Z]/.test(password)) errors.push('Mindestens 1 Großbuchstabe')
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Mindestens 1 Sonderzeichen')
    return errors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })

    // Live-Validierung für Passwort
    if (name === 'password') {
      setPasswordErrors(validatePassword(value))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!termsAccepted) {
      setError('Bitte akzeptieren Sie die AGB und Datenschutzbestimmungen')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    const pwdErrors = validatePassword(formData.password)
    if (pwdErrors.length > 0) {
      setError('Passwort erfüllt nicht alle Anforderungen: ' + pwdErrors.join(', '))
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register/workshop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          companyName: formData.companyName,
          phone: formData.phone,
          website: formData.website || undefined,
          street: formData.street,
          zipCode: formData.zipCode,
          city: formData.city,
          taxId: formData.taxId || undefined,
          description: formData.description || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Ein Fehler ist aufgetreten')
        setLoading(false)
        return
      }

      // Track affiliate conversion on registration
      if (data.userId && data.workshopId) {
        try {
          await fetch('/api/affiliate/convert', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: data.userId,
              workshopId: data.workshopId
            })
          })
        } catch (trackError) {
          console.error('[AFFILIATE] Track error on workshop registration:', trackError)
        }
      }

      // Success
      alert(
        'Registrierung erfolgreich!\n\n' +
        'Ihre Werkstatt wird nun von unserem Team geprüft.\n' +
        'Sie erhalten eine E-Mail, sobald Ihr Account freigeschaltet wurde.'
      )
      router.push('/login')
    } catch (err) {
      setError('Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-2xl shadow-2xl">
        <div className="mb-8">
          <h2 className="text-4xl font-extrabold text-gray-900 text-center">
            Werkstatt registrieren
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Bereits registriert?{' '}
            <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Jetzt anmelden
            </Link>
          </p>
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Nach der Registrierung prüft unser Team Ihre Angaben. 
              Sie erhalten eine E-Mail, sobald Ihr Account freigeschaltet wurde.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Firmendaten</h3>
            
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                Firmenname *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                required
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Mustermann KFZ-Service GmbH"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  Vorname (Ansprechpartner) *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Max"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nachname (Ansprechpartner) *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0123 456789"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                  Website (optional)
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://ihre-werkstatt.de"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung (optional)
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Beschreiben Sie Ihre Werkstatt und Ihre Leistungen..."
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Adresse</h3>
            
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">
                Straße & Hausnummer *
              </label>
              <input
                type="text"
                id="street"
                name="street"
                required
                value={formData.street}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Musterstraße 123"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                  PLZ *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  required
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="12345"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  Stadt *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Musterstadt"
                />
              </div>
            </div>
          </div>

          {/* Login Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Zugangsdaten</h3>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Adresse *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="kontakt@ihre-werkstatt.de"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.password && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium text-gray-700">Passwort muss enthalten:</p>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordErrors.includes('Mindestens 8 Zeichen') ? (
                      <span className="text-red-600">❌ Mindestens 8 Zeichen</span>
                    ) : (
                      <span className="text-green-600">✅ Mindestens 8 Zeichen</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordErrors.includes('Mindestens 1 Großbuchstabe') ? (
                      <span className="text-red-600">❌ Mindestens 1 Großbuchstabe</span>
                    ) : (
                      <span className="text-green-600">✅ Mindestens 1 Großbuchstabe</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {passwordErrors.includes('Mindestens 1 Sonderzeichen') ? (
                      <span className="text-red-600">❌ Mindestens 1 Sonderzeichen (!@#$%^&*...)</span>
                    ) : (
                      <span className="text-green-600">✅ Mindestens 1 Sonderzeichen</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>

              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Passwort wiederholen *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          </div>

          {/* Terms & Submit */}
          <div className="space-y-4 pt-4">
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
                Ich akzeptiere die <Link href="/agb" target="_blank" className="text-primary-600 hover:text-primary-500">AGB</Link> und <Link href="/datenschutz" target="_blank" className="text-primary-600 hover:text-primary-500">Datenschutzbestimmungen</Link>. 
                Ich stimme der Provisionszahlung pro erfolgreich vermitteltem Auftrag zu.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 border border-transparent text-lg font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Registrierung läuft...' : 'Jetzt registrieren'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Zurück zur Startseite
          </Link>
        </div>
      </div>
    </div>
  )
}
