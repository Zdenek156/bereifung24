'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'

interface WorkSession {
  id: string
  startTime: string
  endTime?: string
  breakMinutes: number
  totalMinutes?: number
  workMinutes?: number
  isActive: boolean
  projectName?: string
  notes?: string
  breaks: Array<{
    id: string
    startTime: string
    endTime?: string
    minutes?: number
  }>
}

export default function ZeiterfassungPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null)
  const [todaySessions, setTodaySessions] = useState<WorkSession[]>([])
  const [todayHours, setTodayHours] = useState('0.00')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [onBreak, setOnBreak] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user) {
      fetchData()
    }
  }, [status, session, router])

  // Update Zeit jede Sekunde
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-refresh alle 30 Sekunden
  useEffect(() => {
    if (!loading) {
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [loading])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/employee/time')
      if (res.ok) {
        const data = await res.json()
        setActiveSession(data.activeSession)
        setTodaySessions(data.todaySessions)
        setTodayHours(data.todayHours)
        setOnBreak(data.activeSession?.breaks?.some((b: any) => !b.endTime) || false)
      }
    } catch (error) {
      console.error('Error fetching time data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string) => {
    try {
      const res = await fetch('/api/employee/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        fetchData()
      } else {
        const error = await res.json()
        alert(error.error || 'Fehler')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Fehler beim Ausführen der Aktion')
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '0:00'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}:${mins.toString().padStart(2, '0')}`
  }

  const getActiveTime = () => {
    if (!activeSession) return '0:00:00'
    const start = new Date(activeSession.startTime)
    const diff = currentTime.getTime() - start.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Lade Zeiterfassung...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="mb-2">
            <BackButton />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Zeiterfassung</h1>
          <p className="text-sm text-gray-600 mt-1">
            {currentTime.toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timer Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="text-center">
            {/* Große Zeit-Anzeige */}
            <div className="mb-6">
              <div className="text-6xl font-bold text-gray-900 font-mono">
                {activeSession ? getActiveTime() : '0:00:00'}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {activeSession ? (
                  onBreak ? '⏸️ In Pause' : '⏱️ Aktiv seit ' + new Date(activeSession.startTime).toLocaleTimeString('de-DE')
                ) : 'Nicht gestartet'}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-4">
              {!activeSession ? (
                <button
                  onClick={() => handleAction('start')}
                  className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Arbeit starten
                </button>
              ) : (
                <>
                  {!onBreak ? (
                    <>
                      <button
                        onClick={() => handleAction('break-start')}
                        className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Pause
                      </button>
                      <button
                        onClick={() => handleAction('stop')}
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                        </svg>
                        Feierabend
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAction('break-end')}
                      className="px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold flex items-center gap-2"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                      Pause beenden
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tagesstatistik */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Heute gearbeitet</div>
            <div className="text-2xl font-bold text-blue-600">{todayHours}h</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Sessions</div>
            <div className="text-2xl font-bold text-gray-900">{todaySessions.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Pausen</div>
            <div className="text-2xl font-bold text-gray-900">
              {todaySessions.reduce((sum, s) => sum + (s.breaks?.length || 0), 0)}
            </div>
          </div>
        </div>

        {/* Heutige Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Heutige Zeiteinträge</h2>
          </div>
          <div className="divide-y">
            {todaySessions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                Noch keine Zeiteinträge heute
              </div>
            ) : (
              todaySessions.map((sess) => (
                <div key={sess.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        {sess.isActive ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            Läuft
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                            Beendet
                          </span>
                        )}
                        <span className="text-sm text-gray-600">
                          {new Date(sess.startTime).toLocaleTimeString('de-DE')}
                          {sess.endTime && ` - ${new Date(sess.endTime).toLocaleTimeString('de-DE')}`}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Arbeitszeit: {formatDuration(sess.workMinutes)}
                        {sess.breakMinutes > 0 && ` (${formatDuration(sess.breakMinutes)} Pause)`}
                      </div>
                      {sess.notes && (
                        <div className="text-sm text-gray-500 mt-1">💬 {sess.notes}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
