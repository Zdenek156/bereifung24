'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, User } from 'lucide-react'

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  // Close chat when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      })

      if (response.ok) {
        setSent(true)
        setName('')
        setEmail('')
        setMessage('')
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setIsOpen(false)
          setSent(false)
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Senden')
      }
    } catch (err) {
      setError('Netzwerkfehler. Bitte versuchen Sie es später erneut.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Chat Button - Fixed bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-2xl transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-300"
        aria-label="Live Chat öffnen"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
            {/* Pulse animation */}
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          ref={chatRef}
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300"
        >
          {/* Header */}
          <div className="bg-primary-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Bereifung24 Support</h3>
                  <div className="flex items-center gap-2 text-sm text-primary-100">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span>Offline</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
                aria-label="Chat schließen"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="p-4 flex flex-col max-h-[500px]">
            {!sent ? (
              <>
                {/* Offline Message */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex-shrink-0">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">
                        Aktuell kein Mitarbeiter verfügbar
                      </p>
                      <p className="text-xs text-yellow-800">
                        Hinterlassen Sie uns eine Nachricht und wir melden uns schnellstmöglich bei Ihnen!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ihr Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="Max Mustermann"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-Mail Adresse *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="max@beispiel.de"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ihre Nachricht *
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                        placeholder="Wie können wir Ihnen helfen?"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 flex-shrink-0">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={sending || !name || !email || !message}
                    className="mt-3 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    {sending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Nachricht senden
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success Message */
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Nachricht gesendet!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Wir melden uns schnellstmöglich bei Ihnen.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500">
            Wir antworten in der Regel innerhalb von 24 Stunden
          </div>
        </div>
      )}
    </>
  )
}
