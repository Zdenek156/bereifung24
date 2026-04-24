'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useJarvis } from './useJarvis'

export default function JarvisOverlay() {
  const { isOpen, close, isThinking, isSpeaking, messages, sendMessage } = useJarvis()
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
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

  const toggleMic = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) return

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition
    recognition.lang = 'de-DE'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      sendMessage(transcript)
      setIsListening(false)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognition.start()
    setIsListening(true)
  }

  if (!isOpen) return null

  const visibleMessages = messages.slice(-4)

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950/95 backdrop-blur-sm">
      {/* Top label */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 font-mono text-xs tracking-widest text-cyan-400/60 select-none">
        J.A.R.V.I.S.
      </div>

      {/* Close button */}
      <button
        onClick={close}
        className="absolute top-4 right-6 text-2xl text-cyan-400/50 hover:text-cyan-400 transition-colors"
        aria-label="Close"
      >
        ×
      </button>

      {/* Arc reactor + rings */}
      <div className="relative flex items-center justify-center mb-10">
        {/* Ring 3 — outermost, slowest */}
        <div
          className="absolute w-80 h-80 rounded-full border border-cyan-300/20 animate-spin"
          style={{ animationDuration: '24s' }}
        />
        {/* Ring 2 — reverse */}
        <div
          className="absolute w-64 h-64 rounded-full border border-blue-500/30 animate-spin"
          style={{ animationDuration: '16s', animationDirection: 'reverse' }}
        />
        {/* Ring 1 — innermost */}
        <div
          className="absolute w-48 h-48 rounded-full border border-cyan-400/40 animate-spin"
          style={{ animationDuration: '10s' }}
        />
        {/* Arc reactor core */}
        <div className="relative w-16 h-16 rounded-full bg-cyan-400/20 border-2 border-cyan-400 shadow-[0_0_30px_10px_rgba(34,211,238,0.3)] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-cyan-400/60 animate-pulse shadow-[0_0_12px_4px_rgba(34,211,238,0.6)]" />
        </div>
      </div>

      {/* Chat area */}
      <div className="w-full max-w-xl px-6 flex flex-col gap-2 mb-4 min-h-[120px]">
        {visibleMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <p
              className={
                msg.role === 'user'
                  ? 'text-cyan-300 text-sm text-right max-w-xs'
                  : 'font-mono text-gray-300 text-sm text-left max-w-sm'
              }
            >
              {msg.role === 'jarvis' && (
                <span className="text-cyan-500/70 mr-1">›</span>
              )}
              {msg.text}
            </p>
          </div>
        ))}

        {/* Status */}
        {(isThinking || isSpeaking) && (
          <div className="flex justify-start">
            <p className="font-mono text-cyan-400 text-xs animate-pulse">
              {isThinking ? '● Thinking...' : '◆ Speaking...'}
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <div className="w-full max-w-xl px-6 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isThinking || isSpeaking}
          placeholder="Ask J.A.R.V.I.S. anything..."
          className="flex-1 bg-gray-900/80 border border-cyan-400/30 text-gray-200 placeholder-gray-600 font-mono text-sm rounded px-4 py-2 outline-none focus:border-cyan-400/60 transition-colors disabled:opacity-40"
        />

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!input.trim() || isThinking || isSpeaking}
          className="px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 font-mono text-sm rounded hover:bg-cyan-400/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Send
        </button>

        {/* Mic */}
        <button
          onClick={toggleMic}
          disabled={isThinking}
          className={`px-3 py-2 border rounded font-mono text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            isListening
              ? 'bg-cyan-400/30 border-cyan-400 text-cyan-300 animate-pulse'
              : 'bg-gray-900/80 border-cyan-400/30 text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-400/60'
          }`}
          aria-label="Voice input"
        >
          {isListening ? '◉' : '⏺'}
        </button>
      </div>

      {/* Hint */}
      <p className="absolute bottom-4 font-mono text-gray-700 text-xs select-none">
        Press ESC to dismiss
      </p>
    </div>
  )
}
