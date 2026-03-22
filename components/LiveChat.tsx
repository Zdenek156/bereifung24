'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, User, Bot, ArrowLeft, Sparkles } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

interface DisplayMessage {
  role: 'user' | 'assistant'
  text: string
}

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<'chat' | 'contact'>('chat')
  // AI Chat state
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showContactButton, setShowContactButton] = useState(false)
  // Contact form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contactMessage, setContactMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const chatRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

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

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input after loading
  useEffect(() => {
    if (!chatLoading && messages.length > 0 && mode === 'chat') {
      chatInputRef.current?.focus()
    }
  }, [chatLoading])

  const sendChatMessage = async (overrideText?: string) => {
    const text = (overrideText || chatInput).trim()
    if (!text || chatLoading) return

    setChatInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setChatLoading(true)

    // Show contact button if user asks for human support
    const lowerText = text.toLowerCase()
    if (lowerText.includes('mitarbeiter') || lowerText.includes('mensch') || lowerText.includes('support') || lowerText.includes('kontakt') || lowerText.includes('persönlich')) {
      setShowContactButton(true)
    }

    try {
      const res = await fetch('/api/ai/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, chatHistory }),
      })
      const data = await res.json()
      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.response }])
        setChatHistory(data.chatHistory || [])
        // Show contact button when AI suggests contacting staff
        if (data.response.toLowerCase().includes('mitarbeiter') || data.response.toLowerCase().includes('kontaktformular')) {
          setShowContactButton(true)
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Entschuldigung, da ist etwas schiefgelaufen.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message: contactMessage })
      })

      if (response.ok) {
        setSent(true)
        setName('')
        setEmail('')
        setContactMessage('')
        setTimeout(() => {
          setMode('chat')
          setSent(false)
        }, 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Fehler beim Senden')
      }
    } catch {
      setError('Netzwerkfehler. Bitte versuchen Sie es später erneut.')
    } finally {
      setSending(false)
    }
  }

  // Simple markdown-like rendering for bold text
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ))
    })
  }

  return (
    <>
      {/* Chat Button - Fixed bottom right */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-2xl transition-all transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-primary-300"
        aria-label="Support Chat öffnen"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <MessageCircle className="w-6 h-6" />
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
          className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 duration-300 flex flex-col"
          style={{ maxHeight: 'min(520px, calc(100vh - 7rem))' }}
        >
          {/* Header */}
          <div className="bg-primary-600 text-white px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {mode === 'contact' && (
                  <button
                    onClick={() => setMode('chat')}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  {mode === 'chat' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-semibold text-base">
                    {mode === 'chat' ? 'Bereifung24 Assistent' : 'Mitarbeiter kontaktieren'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-primary-100">
                    {mode === 'chat' ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span>KI-Assistent Online</span>
                      </>
                    ) : (
                      <span>Nachricht hinterlassen</span>
                    )}
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

          {mode === 'chat' ? (
            <>
              {/* AI Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-gray-50" style={{ minHeight: '280px' }}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-6">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                      <Sparkles className="h-6 w-6 text-primary-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                      Wie kann ich Ihnen helfen?
                    </h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Fragen Sie mich alles rund um Bereifung24 — Buchungen, Services, Werkstattsuche und mehr.
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {[
                        'Wie buche ich einen Termin?',
                        'Welche Services gibt es?',
                        'Wie funktioniert die Werkstattsuche?',
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => sendChatMessage(suggestion)}
                          className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-primary-400 hover:text-primary-600 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-primary-600 text-white rounded-br-md'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md shadow-sm'
                        }`}
                      >
                        {renderText(msg.text)}
                      </div>
                    </div>
                  ))
                )}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input + Contact Button */}
              <div className="border-t p-3 bg-white flex-shrink-0">
                <div className="flex gap-2 mb-2">
                  <input
                    ref={chatInputRef}
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendChatMessage()
                      }
                    }}
                    placeholder="Ihre Frage..."
                    className="flex-1 px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    disabled={chatLoading}
                    maxLength={300}
                  />
                  <button
                    onClick={() => sendChatMessage()}
                    disabled={chatLoading || !chatInput.trim()}
                    className="w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                {showContactButton && (
                  <button
                    onClick={() => setMode('contact')}
                    className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors py-2 border border-primary-200 rounded-lg hover:bg-primary-50 flex items-center justify-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    Kontaktieren Sie einen Mitarbeiter
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Contact Form Mode */
            <div className="p-4 flex flex-col overflow-y-auto flex-1">
              {!sent ? (
                <form onSubmit={handleContactSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3 flex-shrink-0">
                    <p className="text-xs text-yellow-800">
                      Hinterlassen Sie uns eine Nachricht und wir melden uns schnellstmöglich bei Ihnen!
                    </p>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ihr Name *</label>
                      <input
                        type="text" value={name} onChange={(e) => setName(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="Max Mustermann"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail Adresse *</label>
                      <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        placeholder="max@beispiel.de"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ihre Nachricht *</label>
                      <textarea
                        value={contactMessage} onChange={(e) => setContactMessage(e.target.value)} required rows={3}
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
                    disabled={sending || !name || !email || !contactMessage}
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
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Nachricht gesendet!</h3>
                    <p className="text-sm text-gray-600">Wir melden uns schnellstmöglich bei Ihnen.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 text-center text-xs text-gray-500 flex-shrink-0">
            {mode === 'chat' ? 'KI-Assistent · Bereifung24' : 'Antwort innerhalb von 24 Stunden'}
          </div>
        </div>
      )}
    </>
  )
}
