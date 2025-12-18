'use client'

import { useState } from 'react'
import DatePicker from '@/components/DatePicker'

export default function CalendarDemo() {
  const [selectedDate, setSelectedDate] = useState('')
  const minDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📅 Kalender Test</h1>
          <p className="text-gray-600">Hier können Sie den neuen Kalender ausprobieren</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <DatePicker
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            minDate={minDate}
            label="Benötigt bis"
            required
          />

          {selectedDate && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✅ Gewähltes Datum:</strong> {selectedDate}
              </p>
              <p className="text-sm text-green-700 mt-2">
                <strong>Formatiert:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="font-bold text-blue-900 mb-3">✨ Features:</h2>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-lg">📅</span>
              <span>Zwei Monate gleichzeitig sichtbar (Desktop)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">👆</span>
              <span>Datum direkt anklicken - kein extra Popup</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">⬅️➡️</span>
              <span>Mit Pfeilen durch Monate navigieren</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🔵</span>
              <span>Heutiges Datum ist mit blauem Ring markiert</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">✅</span>
              <span>Gewähltes Datum ist blau hinterlegt</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">🚫</span>
              <span>Vergangene Tage sind ausgegraut und nicht klickbar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-lg">📱</span>
              <span>Responsive - auf Mobile nur 1 Monat</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
