import CalendarDemo from './CalendarDemo'

export const metadata = {
  title: 'Kalender Test',
  robots: 'noindex,nofollow'
}

export default function TestCalendarPage() {
  return <CalendarDemo />
}

          {selectedDate && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Gewähltes Datum:</strong> {selectedDate}
              </p>
              <p className="text-sm text-green-700 mt-2">
                Formatiert: {new Date(selectedDate + 'T00:00:00').toLocaleDateString('de-DE', {
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
          <h2 className="font-bold text-blue-900 mb-2">Features:</h2>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>📅 Zwei Monate gleichzeitig sichtbar (Desktop)</li>
            <li>👆 Datum direkt anklicken - kein extra Popup</li>
            <li>⬅️➡️ Mit Pfeilen durch Monate navigieren</li>
            <li>🔵 Heutiges Datum ist mit blauem Ring markiert</li>
            <li>✅ Gewähltes Datum ist blau hinterlegt</li>
            <li>🚫 Vergangene Tage sind ausgegraut</li>
            <li>📱 Responsive - auf Mobile nur 1 Monat</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
