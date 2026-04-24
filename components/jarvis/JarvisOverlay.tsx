'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useJarvis } from './useJarvis'

export default function JarvisOverlay() {
  const { isOpen, close, isThinking, isSpeaking, messages, sendMessage } = useJarvis()
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  const [micSupported, setMicSupported] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setMicSupported(!!SR)
  }, [])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, close])

  const handleSend = () => {
    if (!input.trim() || isThinking) return
    sendMessage(input.trim())
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend()
  }

  const toggleMic = async () => {
    setMicError(null)
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setMicError('Spracheingabe wird von diesem Browser nicht unterstuetzt (nur Chrome/Edge).')
      return
    }
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      setMicError('Spracheingabe benoetigt eine HTTPS-Verbindung.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach(t => t.stop())
      }
    } catch (err: any) {
      setMicError(
        err?.name === 'NotAllowedError'
          ? 'Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.'
          : 'Mikrofon konnte nicht aktiviert werden.'
      )
      return
    }
    try {
      const recognition = new SR()
      recognitionRef.current = recognition
      recognition.lang = 'de-DE'
      recognition.interimResults = false
      recognition.maxAlternatives = 1
      recognition.continuous = false
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setIsListening(false)
        if (transcript?.trim()) sendMessage(transcript.trim())
      }
      recognition.onerror = (e: any) => {
        const code = e?.error || 'unknown'
        const map: Record<string, string> = {
          'not-allowed': 'Mikrofon-Zugriff verweigert.',
          'no-speech': 'Keine Sprache erkannt. Bitte erneut versuchen.',
          'audio-capture': 'Kein Mikrofon gefunden.',
          'network': 'Netzwerkfehler bei der Spracherkennung.',
          'aborted': '',
        }
        const msg = map[code] ?? `Spracherkennung-Fehler: ${code}`
        if (msg) setMicError(msg)
        setIsListening(false)
      }
      recognition.onend = () => setIsListening(false)
      recognition.start()
      setIsListening(true)
    } catch (err) {
      console.error('[Jarvis mic]', err)
      setMicError('Spracheingabe konnte nicht gestartet werden.')
      setIsListening(false)
    }
  }

  if (!isOpen) return null

  const visibleMessages = messages.slice(-4)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-sm">
      <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest text-cyan-400/60 select-none">
        JARVIS
      </div>
      <button
        onClick={close}
        className="absolute top-4 right-6 text-2xl text-cyan-400/50 hover:text-cyan-400 transition-colors"
        aria-label="Schliessen"
      >
        &times;
      </button>
      <div className="relative flex items-center justify-center mb-10">
        <div className="absolute w-80 h-80 rounded-full border border-cyan-300/20 animate-spin" style={{ animationDuration: '24s' }} />
        <div className="absolute w-64 h-64 rounded-full border border-blue-500/30 animate-spin" style={{ animationDuration: '16s', animationDirection: 'reverse' }} />
        <div className="absolute w-48 h-48 rounded-full border border-cyan-400/40 animate-spin" style={{ animationDuration: '10s' }} />
        <div className="relative w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 shadow-[0_0_30px_10px_rgba(34,211,238,0.3)] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-cyan-400/60 animate-pulse shadow-[0_0_12px_4px_rgba(34,211,238,0.6)]" />
        </div>
      </div>
      <div className="w-full max-w-xl px-6 flex flex-col gap-2 mb-4 min-h-[120px]">
        {visibleMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <p className={msg.role === 'user' ? 'text-cyan-300 text-sm text-right max-w-xs' : 'font-mono text-gray-300 text-sm text-left max-w-sm'}>
              {msg.role === 'jarvis' && <span className="text-cyan-500/70 mr-1">&rsaquo;</span>}
              {msg.text}
            </p>
          </div>
        ))}
        {(isThinking || isSpeaking) && (
          <div className="flex justify-start">
            <p className="font-mono text-cyan-400 text-xs animate-pulse">
              {isThinking ? 'Denke nach...' : 'Spreche...'}
            </p>
          </div>
        )}
        {micError && (
          <div className="flex justify-start">
            <p className="font-mono text-red-400/80 text-xs">! {micError}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="w-full max-w-xl px-6 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking || isSpeaking}
          placeholder="Frage Jarvis etwas..."
          className="flex-1 bg-gray-900/80 border border-cyan-400/30 text-gray-200 placeholder-gray-600 font-mono text-sm rounded px-4 py-2 outline-none focus:border-cyan-400/60 transition-colors disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking || isSpeaking}
          className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 font-mono text-sm rounded hover:bg-cyan-400/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Senden
        </button>
        {micSupported && (
          <button
            onClick={toggleMic}
            disabled={isThinking}
            title={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
            className={`px-3 py-2 border rounded font-mono text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              isListening
                ? 'bg-cyan-400/30 border-cyan-400 text-cyan-300 animate-pulse'
                : 'bg-gray-900/80 border-cyan-400/30 text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-400/60'
            }`}
            aria-label="Spracheingabe"
          >
            {isListening ? 'STOP' : 'MIC'}
          </button>
        )}
      </div>
      <p className="absolute bottom-4 font-mono text-gray-700 text-xs select-none">
        ESC zum Schliessen
      </p>
    </div>
  )
}
