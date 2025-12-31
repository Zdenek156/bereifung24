'use client'

import { useState } from 'react'

export const dynamic = 'force-dynamic'

export default function InfluencerHomePage() {
  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    platform: '',
    channelName: '',
    channelUrl: '',
    followers: '',
    message: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitMessage(null)

    try {
      const response = await fetch('/api/influencer/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        setSubmitMessage({
          type: 'error',
          text: data.error || 'Ein Fehler ist aufgetreten'
        })
        return
      }
      
      setSubmitMessage({
        type: 'success',
        text: 'Vielen Dank für Ihre Bewerbung! Wir melden uns innerhalb von 2-3 Werktagen bei Ihnen.'
      })
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        platform: '',
        channelName: '',
        channelUrl: '',
        followers: '',
        message: ''
      })
      
      setTimeout(() => {
        setShowApplicationForm(false)
        setSubmitMessage(null)
      }, 3000)
      
    } catch (error) {
      console.error('Application error:', error)
      setSubmitMessage({
        type: 'error',
        text: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie uns unter partner@bereifung24.de'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Bereifung24 Partner-Programm
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Verdienen Sie Provisionen als Influencer! Empfehlen Sie Deutschlands führende Reifen-Plattform und profitieren Sie von attraktiven Vergütungen.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="/influencer/login"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
            >
              Partner Login
            </a>
            <button
              onClick={() => setShowApplicationForm(true)}
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Jetzt bewerben
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Attraktive Provisionen</h3>
            <p className="text-gray-600">
              Verdienen Sie für jede Registrierung und jeden abgeschlossenen Deal über Ihren Link
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Live-Dashboard</h3>
            <p className="text-gray-600">
              Verfolgen Sie Ihre Clicks, Conversions und Einnahmen in Echtzeit
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Schnelle Auszahlung</h3>
            <p className="text-gray-600">
              Fordern Sie Ihre Provisionen ab €50 an und erhalten Sie Ihr Geld innerhalb von 7-14 Tagen
            </p>
          </div>
        </div>

        {/* Commission Rates */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Unsere Vergütungsmodelle</h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Wir bieten faire und transparente Provisionen. Die genauen Konditionen werden individuell mit jedem Partner vereinbart.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
              <div className="text-4xl font-bold text-blue-600 mb-2">💰</div>
              <div className="text-gray-900 font-semibold text-lg mb-2">CPM-Vergütung</div>
              <div className="text-gray-600 text-sm mb-2">pro 1000 Views</div>
              <div className="text-gray-500 text-xs">Verfolgen Sie Ihre Reichweite</div>
            </div>

            <div className="border-2 border-blue-500 rounded-xl p-6 text-center bg-blue-50">
              <div className="text-4xl font-bold text-blue-600 mb-2">🎯</div>
              <div className="text-gray-900 font-semibold text-lg mb-2">Pro Registrierung</div>
              <div className="text-gray-600 text-sm mb-2">Für jeden neuen Kunden</div>
              <div className="text-gray-500 text-xs">Jeder neue Kunde zählt</div>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6 text-center hover:border-blue-500 transition-colors">
              <div className="text-4xl font-bold text-blue-600 mb-2">✅</div>
              <div className="text-gray-900 font-semibold text-lg mb-2">Pro Deal</div>
              <div className="text-gray-600 text-sm mb-2">Bei abgeschlossenem Auftrag</div>
              <div className="text-gray-500 text-xs">Bei erfolgreicher Vermittlung</div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Die genauen Provisionsätze werden individuell vereinbart und richten sich nach Ihrer Reichweite und Zielgruppe.
          </p>
        </div>

        {/* How it works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">So funktioniert's</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Bewerben</h3>
              <p className="text-sm text-gray-600">Kontaktieren Sie uns und werden Sie Partner</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Link erhalten</h3>
              <p className="text-sm text-gray-600">Sie bekommen Ihren persönlichen Tracking-Link</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Promoten</h3>
              <p className="text-sm text-gray-600">Teilen Sie Bereifung24 mit Ihrer Community</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">Verdienen</h3>
              <p className="text-sm text-gray-600">Erhalten Sie Provisionen für jeden Erfolg</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Bereit durchzustarten?</h2>
          <p className="text-xl mb-8 opacity-90">
            Werden Sie Teil unseres Partner-Netzwerks und verdienen Sie mit jedem vermittelten Kunden
          </p>
          <button
            onClick={() => setShowApplicationForm(true)}
            className="inline-block px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            Jetzt bewerben
          </button>
        </div>

        {/* Application Form Modal */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Jetzt als Partner bewerben</h2>
                  <button
                    onClick={() => {
                      setShowApplicationForm(false)
                      setSubmitMessage(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {submitMessage && (
                  <div className={`mb-6 p-4 rounded-lg ${
                    submitMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-800' 
                      : 'bg-red-50 border border-red-200 text-red-800'
                  }`}>
                    {submitMessage.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ihr Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        E-Mail-Adresse *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="max@beispiel.de"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plattform *
                      </label>
                      <select
                        required
                        value={formData.platform}
                        onChange={(e) => setFormData({...formData, platform: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Bitte wählen</option>
                        <option value="YOUTUBE">YouTube</option>
                        <option value="INSTAGRAM">Instagram</option>
                        <option value="TIKTOK">TikTok</option>
                        <option value="FACEBOOK">Facebook</option>
                        <option value="TWITTER">Twitter/X</option>
                        <option value="WEBSITE">Website/Blog</option>
                        <option value="OTHER">Andere</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Follower/Abonnenten
                      </label>
                      <input
                        type="text"
                        value={formData.followers}
                        onChange={(e) => setFormData({...formData, followers: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="z.B. 50.000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kanal Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.channelName}
                        onChange={(e) => setFormData({...formData, channelName: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kanal URL *
                      </label>
                      <input
                        type="url"
                        required
                        value={formData.channelUrl}
                        onChange={(e) => setFormData({...formData, channelUrl: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nachricht (optional)
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Erzählen Sie uns kurz über sich und Ihren Kanal..."
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowApplicationForm(false)
                        setSubmitMessage(null)
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Wird gesendet...' : 'Bewerbung absenden'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600">
          <p className="mb-2">© {new Date().getFullYear()} Bereifung24. Alle Rechte vorbehalten.</p>
          <div className="flex gap-6 justify-center text-sm">
            <a href="/agb" className="hover:text-blue-600">AGB</a>
            <a href="/datenschutz" className="hover:text-blue-600">Datenschutz</a>
            <a href="/impressum" className="hover:text-blue-600">Impressum</a>
          </div>
        </div>
      </div>
    </div>
  )
}
