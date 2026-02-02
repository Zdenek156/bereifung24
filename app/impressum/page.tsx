import Link from 'next/link'

export default function ImpressumPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mt-4">Impressum</h1>
          </div>

          {/* Content */}
          <div className="prose max-w-none space-y-8 text-gray-700">
            {/* Angaben gemäß § 5 TMG */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Angaben gemäß § 5 Telemediengesetz (TMG)</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">Bereifung24</p>
                <p>Inhaber: Zdenek Kyzlink</p>
                <p>Einzelunternehmer</p>
                <p className="mt-2">Jahnstraße 2</p>
                <p>71706 Markgröningen</p>
                <p>Deutschland</p>
              </div>
            </section>

            {/* Kontakt */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Kontakt</h2>
              <p>
                <strong>Telefon:</strong>{' '}
                <a href="tel:+4971479679990" className="text-primary-600 hover:underline">
                  +49 7147 9679990
                </a>
              </p>
              <p>
                <strong>E-Mail:</strong>{' '}
                <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">
                  info@bereifung24.de
                </a>
              </p>
            </section>

            {/* Umsatzsteuer-ID */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Umsatzsteuer-ID</h2>
              <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetzes:</p>
              <p className="font-semibold mt-2">DE354910030</p>
            </section>

            {/* Verantwortlich für den Inhalt */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
              <p>Zdenek Kyzlink</p>
              <p>Jahnstraße 2</p>
              <p>71706 Markgröningen</p>
            </section>

            {/* Informationen zur Plattform */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Informationen zur Plattform</h2>
              <p className="mb-3">
                bereifung24.de ist eine Online-Vermittlungsplattform für Reifen und Montagedienstleistungen. 
                Die Plattform vermittelt zwischen Endkunden (Verbrauchern) und Kfz-Werkstätten.
              </p>
              <p>
                Der Betreiber tritt nicht als Vertragspartei für den Kauf von Reifen oder die Erbringung von 
                Montagedienstleistungen auf. Verträge kommen ausschließlich zwischen Kunde und Werkstatt zustande.
              </p>
            </section>

            {/* P2B-VO Angaben */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Angaben gemäß Plattform-zu-Unternehmen-Verordnung (P2B-VO)</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Hauptparameter für das Ranking von Angeboten</h3>
              <p className="mb-3">Die auf der Plattform angezeigten Werkstatt-Angebote werden nach folgenden Hauptparametern sortiert:</p>
              
              <p className="font-semibold mb-2">Primäres Ranking-Kriterium: Gesamtpreis (Reifen + Montage)</p>
              <p className="mb-3">Die Angebote werden standardmäßig nach dem günstigsten Gesamtpreis sortiert, der sich zusammensetzt aus:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Reifenpreis (alle 4 Reifen)</li>
                <li>Montagekosten</li>
              </ul>
              <p className="mb-3">Das günstigste Angebot wird zuerst angezeigt.</p>
              
              <p className="font-semibold mb-2">Zusätzliche Sortieroptionen (durch Kunde wählbar):</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Nach Entfernung (nächstgelegene Werkstatt zuerst)</li>
                <li>Nach Bewertung (beste Bewertung zuerst)</li>
                <li>Nach Verfügbarkeit (schnellster Termin zuerst)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Zugang zu Daten</h3>
              <p className="font-semibold mb-2">Werkstätten erhalten Zugriff auf:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Kundenanfragen in ihrer Region</li>
                <li>Kontaktdaten des Kunden nach Angebotsannahme</li>
                <li>Fahrzeugdaten (soweit für Angebotserstellung erforderlich)</li>
              </ul>
              
              <p className="font-semibold mb-2">Werkstätten haben keinen Zugriff auf:</p>
              <ul className="list-disc pl-6 space-y-1 mb-3">
                <li>Angebote anderer Werkstätten</li>
                <li>Persönliche Daten anderer Werkstätten</li>
                <li>Zahlungsdaten von Kunden</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Beschwerdemechanismus für Werkstätten</h3>
              <p className="mb-2">Werkstätten können sich bei Problemen oder Beschwerden an folgende Stelle wenden:</p>
              <p>
                <strong>E-Mail:</strong>{' '}
                <a href="mailto:support@bereifung24.de" className="text-primary-600 hover:underline">
                  support@bereifung24.de
                </a>
              </p>
              <p>
                <strong>Telefon:</strong>{' '}
                <a href="tel:+4971479679990" className="text-primary-600 hover:underline">
                  +49 7147 9679990
                </a>
              </p>
              <p className="mt-2">Beschwerden werden innerhalb von 5 Werktagen bearbeitet.</p>

              <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Auswirkungen auf das Ranking</h3>
              <p className="mb-3">
                Die Plattform bietet keine bezahlten Werbeplätze oder Premium-Platzierungen an. 
                Alle Werkstätten werden nach den oben genannten objektiven Kriterien behandelt.
              </p>
              <p>Eine bevorzugte Platzierung durch Zahlung ist nicht möglich.</p>
            </section>

            {/* EU-Streitschlichtung */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">EU-Streitschlichtung</h2>
              <p className="mb-3">
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a 
                  href="https://ec.europa.eu/consumers/odr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
              <p>
                Für Anfragen zur Online-Streitbeilegung kontaktieren Sie uns unter:{' '}
                <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">
                  info@bereifung24.de
                </a>
              </p>
            </section>

            {/* Verbraucherstreitbeilegung */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Verbraucherstreitbeilegung / Universalschlichtungsstelle
              </h2>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            {/* Haftung für Inhalte */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Haftung für Inhalte</h2>
              <p className="mb-3">
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten 
                nach den allgemeinen Gesetzen verantwortlich.
              </p>
              <p className="mb-3">
                Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte 
                oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die 
                auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p>
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den 
                allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch 
                erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei 
                Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend 
                entfernen.
              </p>
            </section>

            {/* Haftung für Links */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Haftung für Links</h2>
              <p className="mb-3">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen 
                Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              </p>
              <p className="mb-3">
                Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der 
                Seiten verantwortlich.
              </p>
              <p className="mb-3">
                Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße 
                überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
              </p>
              <p>
                Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete 
                Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von 
                Rechtsverletzungen werden wir derartige Links umgehend entfernen.
              </p>
            </section>

            {/* Urheberrecht */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Urheberrecht</h2>
              <p className="mb-3">
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen 
                dem deutschen Urheberrecht.
              </p>
              <p className="mb-3">
                Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
                Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. 
                Erstellers.
              </p>
              <p className="mb-3">
                Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch 
                gestattet.
              </p>
              <p>
                Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die 
                Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
              </p>
              <p className="mt-3">
                Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen 
                entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte 
                umgehend entfernen.
              </p>
            </section>

            {/* Bilder und Logos */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bilder und Logos</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Werkstatt-Bilder und Logos:</h3>
              <p className="mb-3">
                Alle auf der Plattform dargestellten Bilder, Fotos und Logos von Werkstätten sind Eigentum 
                der jeweiligen Werkstätten und wurden mit deren Erlaubnis verwendet.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Produktbilder (Reifen):</h3>
              <p className="mb-3">
                Produktbilder von Reifen werden von den Werkstätten bereitgestellt oder stammen aus öffentlich 
                zugänglichen Herstellerinformationen.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2">Logo bereifung24:</h3>
              <p>
                Das Logo und die grafischen Elemente von bereifung24.de sind urheberrechtlich geschützt und 
                Eigentum des Betreibers.
              </p>
            </section>

            {/* Hinweise zum Datenschutz */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Hinweise zum Datenschutz</h2>
              <p>
                Informationen zur Erhebung, Verarbeitung und Nutzung Ihrer personenbezogenen Daten finden Sie 
                in unserer separaten{' '}
                <Link href="/datenschutz" className="text-primary-600 hover:underline">
                  Datenschutzerklärung
                </Link>.
              </p>
            </section>

            {/* Stand */}
            <section className="pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-600">
                <strong>Stand:</strong> 24.01.2026
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
