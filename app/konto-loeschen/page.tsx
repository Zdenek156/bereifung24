import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account löschen - Bereifung24',
  description: 'Anleitung zum Löschen Ihres Bereifung24-Accounts und der zugehörigen Daten.',
  alternates: { canonical: 'https://bereifung24.de/konto-loeschen' }
}

export default function KontoLoeschenPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-primary-600 hover:text-primary-700 mb-4 flex items-center inline-flex"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zur Startseite
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mt-4">Account löschen</h1>
            <p className="text-gray-600 mt-2">
              Hier erfahren Sie, wie Sie Ihren Bereifung24-Account und die zugehörigen Daten löschen können.
            </p>
          </div>

          <div className="space-y-8 text-gray-700">
            {/* Option 1: In der App */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Option 1: Account in der App oder auf der Website löschen</h2>
              <p className="mb-4">
                Sie können Ihren Account direkt selbst löschen. Befolgen Sie dazu diese Schritte:
              </p>
              <ol className="list-decimal list-inside space-y-3 ml-4">
                <li>Melden Sie sich in der <strong>Bereifung24-App</strong> oder auf <strong>bereifung24.de</strong> an.</li>
                <li>Navigieren Sie zu <strong>Einstellungen</strong> (im Menü oder unter Ihrem Profil).</li>
                <li>Scrollen Sie zum Abschnitt <strong>&quot;Gefahrenzone&quot;</strong> am Ende der Seite.</li>
                <li>Klicken Sie auf <strong>&quot;Account endgültig löschen&quot;</strong>.</li>
                <li>Bestätigen Sie die Löschung zweimal.</li>
              </ol>
              <p className="mt-4 text-sm text-gray-500">
                Ihr Account und alle zugehörigen Daten werden sofort und unwiderruflich gelöscht.
              </p>
            </section>

            {/* Option 2: Per E-Mail */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Option 2: Löschung per E-Mail beantragen</h2>
              <p className="mb-4">
                Alternativ können Sie die Löschung Ihres Accounts per E-Mail beantragen:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="mb-2">Senden Sie eine E-Mail an:</p>
                <p className="font-semibold text-primary-600">
                  <a href="mailto:datenschutz@bereifung24.de">datenschutz@bereifung24.de</a>
                </p>
                <p className="mt-2 text-sm">
                  Betreff: <strong>Account-Löschung</strong>
                </p>
                <p className="text-sm">
                  Bitte geben Sie die E-Mail-Adresse an, mit der Sie registriert sind.
                </p>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Wir bearbeiten Ihre Anfrage innerhalb von 72 Stunden.
              </p>
            </section>

            {/* Welche Daten werden gelöscht */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welche Daten werden gelöscht?</h2>
              <p className="mb-4">Bei der Account-Löschung werden folgende Daten <strong>unwiderruflich gelöscht</strong>:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Persönliche Daten (Name, E-Mail-Adresse, Telefonnummer)</li>
                <li>Gespeicherte Fahrzeuge</li>
                <li>Reifenanfragen und Angebote</li>
                <li>Buchungshistorie</li>
                <li>Bewertungen</li>
                <li>Hochgeladene Fotos</li>
                <li>Standortdaten</li>
              </ul>
            </section>

            {/* Welche Daten werden aufbewahrt */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welche Daten werden aufbewahrt?</h2>
              <p className="mb-4">
                Folgende Daten können aus gesetzlichen Gründen aufbewahrt werden:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Rechnungsdaten</strong> — Aufbewahrungspflicht gemäß HGB/AO (10 Jahre).
                  Diese Daten werden anonymisiert gespeichert.
                </li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">
                Nach Ablauf der gesetzlichen Aufbewahrungsfristen werden auch diese Daten vollständig gelöscht.
              </p>
            </section>

            {/* Hinweis */}
            <section className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Wichtiger Hinweis</h3>
              <p className="text-yellow-700">
                Die Account-Löschung ist endgültig und kann nicht rückgängig gemacht werden. 
                Ihre E-Mail-Adresse wird gesperrt und kann nicht erneut für eine Registrierung 
                verwendet werden. Bitte stellen Sie sicher, dass Sie keine offenen Buchungen oder 
                Anfragen mehr haben, bevor Sie Ihren Account löschen.
              </p>
            </section>

            {/* Kontakt */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Fragen?</h2>
              <p>
                Bei Fragen zur Datenlöschung wenden Sie sich an unseren Datenschutzbeauftragten:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p className="font-semibold">Bereifung24</p>
                <p>E-Mail: <a href="mailto:datenschutz@bereifung24.de" className="text-primary-600 hover:underline">datenschutz@bereifung24.de</a></p>
                <p>Telefon: <a href="tel:+4971479679990" className="text-primary-600 hover:underline">+49 7147 9679990</a></p>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
            <p>Stand: März 2026 | Bereifung24</p>
          </div>
        </div>
      </div>
    </div>
  )
}
