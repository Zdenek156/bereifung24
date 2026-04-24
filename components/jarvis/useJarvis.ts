'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface JarvisMessage {
  role: 'user' | 'jarvis'
  text: string
}

interface GeminiHistoryEntry {
  role: 'user' | 'model'
  parts: [{ text: string }]
}

export function useJarvis() {
  const [isOpen, setIsOpen] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [messages, setMessages] = useState<JarvisMessage[]>([])

  const sequenceRef = useRef('')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const geminiHistoryRef = useRef<GeminiHistoryEntry[]>([])

  // Keyboard sequence listener — type "jarvis" to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) return
      // Only track single lowercase letter keys
      if (e.key.length !== 1) return

      sequenceRef.current += e.key.toLowerCase()

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        sequenceRef.current = ''
      }, 2000)

      if (sequenceRef.current.endsWith('jarvis')) {
        sequenceRef.current = ''
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [isOpen])

  // Fetch greeting on open
  useEffect(() => {
    if (!isOpen || messages.length > 0) return

    fetch('/api/jarvis/greeting')
      .then(r => r.json())
      .then(data => {
        const greeting = data.greeting as string
        setMessages([{ role: 'jarvis', text: greeting }])
        speakText(greeting)
      })
      .catch(() => {
        setMessages([{ role: 'jarvis', text: 'J.A.R.V.I.S. online. How may I assist you, Sir?' }])
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const speakText = useCallback(async (text: string) => {
    try {
      setIsSpeaking(true)
      const res = await fetch('/api/jarvis/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
      }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => setIsSpeaking(false)
      await audio.play()
    } catch {
      setIsSpeaking(false)
    }
  }, [])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isThinking) return

    const userMsg: JarvisMessage = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setIsThinking(true)

    try {
      const res = await fetch('/api/jarvis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: geminiHistoryRef.current,
        }),
      })

      if (!res.ok) {
        throw new Error('Chat request failed')
      }

      const data = await res.json()
      const reply = data.reply as string

      // Update Gemini history for context
      geminiHistoryRef.current = [
        ...geminiHistoryRef.current,
        { role: 'user', parts: [{ text: text.trim() }] },
        { role: 'model', parts: [{ text: reply }] },
      ]

      const jarvisMsg: JarvisMessage = { role: 'jarvis', text: reply }
      setMessages(prev => [...prev, jarvisMsg])
      setIsThinking(false)

      await speakText(reply)
    } catch {
      setMessages(prev => [...prev, { role: 'jarvis', text: 'Apologies, Sir. I seem to be experiencing a minor systems disruption.' }])
      setIsThinking(false)
    }
  }, [isThinking, speakText])

  const close = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setIsOpen(false)
    setIsThinking(false)
    setIsSpeaking(false)
    setMessages([])
    geminiHistoryRef.current = []
  }, [])

  return { isOpen, close, isThinking, isSpeaking, messages, sendMessage }
}
