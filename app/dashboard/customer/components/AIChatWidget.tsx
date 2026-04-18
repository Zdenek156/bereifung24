'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, Sparkles, Search, Fuel, Droplets, Volume2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ChatMessage {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

interface RecommendedTire {
  brand: string
  model: string
  size: string
  width: string
  height: string
  diameter: string
  season: string
  loadIndex: string
  speedIndex: string
  labelFuelEfficiency: string
  labelWetGrip: string
  labelNoise: number
}

interface DisplayMessage {
  role: 'user' | 'assistant'
  text: string
  recommendedTires?: RecommendedTire[]
}

interface SelectedTire {
  msgIdx: number
  tireIdx: number
}

export default function AIChatWidget() {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedTire, setSelectedTire] = useState<SelectedTire | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Refocus input after loading completes (after React re-renders the non-disabled input)
  useEffect(() => {
    if (!loading && messages.length > 0) {
      inputRef.current?.focus()
    }
  }, [loading])

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim()
    if (!text || loading) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          chatHistory,
          platform: 'web',
        }),
      })

      const data = await res.json()

      if (data.response) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.response, recommendedTires: data.recommendedTires }])
        setChatHistory(data.chatHistory || [])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Entschuldigung, da ist etwas schiefgelaufen.' }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Verbindungsfehler. Bitte versuchen Sie es erneut.' }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setChatHistory([])
    setSelectedTire(null)
  }

  // Simple markdown-like rendering for bold text
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
      }
      // Handle newlines
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {j > 0 && <br />}
          {line}
        </span>
      ))
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Rollo – Dein Reifen-Berater</h3>
            <p className="text-blue-100 text-xs">Persönliche Empfehlungen aus 125.000+ Reifen</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            title="Chat löschen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              Hi, ich bin Rollo! 👋
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Frag mich alles rund um Reifen, Empfehlungen, Werkstätten oder die Bereifung24 Plattform.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                'Welche Reifen für mein Auto?',
                'Wann Reifenwechsel?',
                'Hilfe zur Plattform',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-600 dark:text-gray-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx}>
              <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-md shadow-sm'
                  }`}
                >
                  {renderText(msg.text)}
                </div>
              </div>
              {/* Tire recommendation cards */}
              {msg.recommendedTires && msg.recommendedTires.length > 0 && (
                <div className="mt-2 ml-0 max-w-[90%] space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">Reifen auswählen:</p>
                  {msg.recommendedTires.map((tire, tIdx) => {
                    const isSelected = selectedTire?.msgIdx === idx && selectedTire?.tireIdx === tIdx
                    return (
                      <button
                        key={tIdx}
                        onClick={() => setSelectedTire(isSelected ? null : { msgIdx: idx, tireIdx: tIdx })}
                        className={`w-full text-left rounded-xl p-3 shadow-sm transition-all ${
                          isSelected
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 dark:border-blue-400'
                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{tire.brand} {tire.model}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{tire.size} {tire.loadIndex}{tire.speedIndex} · {tire.season}</p>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3 mt-2">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400" title="Spriteffizienz">
                            <Fuel className="h-3 w-3" /> {tire.labelFuelEfficiency}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400" title="Nasshaftung">
                            <Droplets className="h-3 w-3" /> {tire.labelWetGrip}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400" title="Rollgeräusch">
                            <Volume2 className="h-3 w-3" /> {tire.labelNoise} dB
                          </span>
                        </div>
                      </button>
                    )
                  })}
                  {selectedTire?.msgIdx === idx && (
                    <button
                      onClick={() => {
                        const t = msg.recommendedTires![selectedTire!.tireIdx]
                        const params = new URLSearchParams({
                          service: 'TIRE_CHANGE',
                          ai_tire: '1',
                          tire_brand: t.brand,
                          tire_model: t.model,
                          tire_width: t.width,
                          tire_height: t.height,
                          tire_diameter: t.diameter,
                          tire_season: t.season === 'Sommer' ? 's' : t.season === 'Winter' ? 'w' : 'g',
                          tire_load: t.loadIndex,
                          tire_speed: t.speedIndex,
                        })
                        router.push(`/?${params.toString()}`)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                      <Search className="h-4 w-4" />
                      Werkstatt mit diesem Reifen finden
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
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

      {/* Input area */}
      <div className="border-t dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder="Fragen Sie mich etwas..."
            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
            disabled={loading}
            maxLength={200}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
