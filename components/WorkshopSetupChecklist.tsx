'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface SetupStep {
  id: string
  label: string
  description: string
  done: boolean
  href: string
}

interface SetupStatus {
  steps: SetupStep[]
  completedCount: number
  total: number
  allDone: boolean
}

export default function WorkshopSetupChecklist() {
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [minimized, setMinimized] = useState(false)
  const [visible, setVisible] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedMinimized = localStorage.getItem('setupChecklistMinimized')
    if (savedMinimized === 'true') setMinimized(true)

    fetch('/api/workshop/setup-status')
      .then((r) => r.json())
      .then((data: SetupStatus) => {
        if (!data?.steps) return
        setStatus(data)
        if (data.allDone) {
          // Hide permanently once everything is done
          setVisible(false)
          localStorage.setItem('setupChecklistDone', 'true')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggleMinimize = () => {
    const next = !minimized
    setMinimized(next)
    localStorage.setItem('setupChecklistMinimized', String(next))
  }

  if (loading || !visible || !status) return null

  const progress = Math.round((status.completedCount / status.total) * 100)

  // Collapsed pill
  if (minimized) {
    return (
      <button
        onClick={toggleMinimize}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:shadow-xl transition-all"
      >
        <span className="text-base">⚙️</span>
        <span>Einrichtung</span>
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold">
          {status.total - status.completedCount}
        </span>
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">Werkstatt einrichten</p>
          <p className="text-primary-200 text-xs mt-0.5">
            {status.completedCount} von {status.total} Schritten erledigt
          </p>
        </div>
        <button
          onClick={toggleMinimize}
          className="text-primary-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-primary-500"
          title="Minimieren"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
        {status.steps.map((step) => (
          <div key={step.id} className={`flex items-start gap-3 px-4 py-3 ${step.done ? 'bg-green-50/40' : 'hover:bg-gray-50'} transition-colors`}>
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {step.done ? (
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-tight ${step.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{step.description}</p>
              )}
            </div>

            {/* Arrow link */}
            {!step.done && (
              <Link
                href={step.href}
                className="flex-shrink-0 mt-0.5 text-primary-600 hover:text-primary-700"
                title="Jetzt einrichten"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          Erledigen Sie alle Schritte, damit Kunden bei Ihnen buchen können.
        </p>
      </div>
    </div>
  )
}
