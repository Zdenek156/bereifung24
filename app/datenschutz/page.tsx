import Link from 'next/link'

export default function DatenschutzPage() {
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
            <h1 className="text-4xl font-bold text-gray-900 mt-4">Datenschutzerklärung</h1>
          </div>

          {/* Content */}
          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Datenschutz auf einen Blick</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Allgemeine Hinweise</h3>
              <p className="mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen 
                Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit 
                denen Sie persönlich identifiziert werden können.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Datenerfassung auf dieser Website</h3>
              <p className="mb-2"><strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong></p>
              <p className="mb-4">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten 
                können Sie dem Abschnitt „Hinweis zur verantwortlichen Stelle" in dieser Datenschutzerklärung entnehmen.
              </p>

              <p className="mb-2"><strong>Wie erfassen wir Ihre Daten?</strong></p>
              <p className="mb-4">
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich 
                z.B. um Daten handeln, die Sie in ein Kontaktformular oder bei der Registrierung eingeben.
              </p>
              <p className="mb-4">
                Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere 
                IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser, Betriebssystem oder 
                Uhrzeit des Seitenaufrufs).
              </p>

              <p className="mb-2"><strong>Wofür nutzen wir Ihre Daten?</strong></p>
              <p className="mb-4">
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu gewährleisten. 
                Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet werden. Wenn Sie als Kunde oder 
                Werkstatt registriert sind, werden Ihre Daten zur Abwicklung der Vermittlungsleistungen verwendet.
              </p>

              <p className="mb-2"><strong>Welche Rechte haben Sie bezüglich Ihrer Daten?</strong></p>
              <p>
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer 
                gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung 
                oder Löschung dieser Daten zu verlangen. Wenn Sie eine Einwilligung zur Datenverarbeitung erteilt 
                haben, können Sie diese Einwilligung jederzeit für die Zukunft widerrufen. Außerdem haben Sie das 
                Recht, unter bestimmten Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten 
                zu verlangen.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Hosting</h2>
              <p className="mb-4">
                Wir hosten die Inhalte unserer Website bei folgendem Anbieter:
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Externes Hosting</h3>
              <p className="mb-4">
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser Website erfasst werden, 
                werden auf den Servern des Hosters gespeichert. Hierbei kann es sich v.a. um IP-Adressen, Kontaktanfragen, 
                Meta- und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und sonstige Daten, 
                die über eine Website generiert werden, handeln.
              </p>
              <p className="mb-4">
                Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren potenziellen und 
                bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse einer sicheren, schnellen und 
                effizienten Bereitstellung unseres Online-Angebots durch einen professionellen Anbieter (Art. 6 Abs. 1 
                lit. f DSGVO).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Allgemeine Hinweise und Pflichtinformationen</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Datenschutz</h3>
              <p className="mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre 
                personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie 
                dieser Datenschutzerklärung.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Hinweis zur verantwortlichen Stelle</h3>
              <p className="mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Zdenek Kyzlink</strong></p>
                <p>Jahnstraße 2</p>
                <p>71706 Markgröningen</p>
                <p className="mt-2">
                  Telefon: <a href="tel:017645676614" className="text-primary-600 hover:underline">0176-45676614</a>
                </p>
                <p>
                  E-Mail: <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a>
                </p>
              </div>
              <p>
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen 
                über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o. Ä.) 
                entscheidet.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Speicherdauer</h3>
              <p>
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben 
                Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein 
                berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, 
                werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung 
                Ihrer personenbezogenen Daten haben.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
              <p>
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich. Sie können 
                eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit der bis zum Widerruf 
                erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Auskunft, Löschung und Berichtigung</h3>
              <p>
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf unentgeltliche 
                Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft und Empfänger und den Zweck 
                der Datenverarbeitung und ggf. ein Recht auf Berichtigung oder Löschung dieser Daten.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Datenerfassung auf dieser Website</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Server-Log-Dateien</h3>
              <p className="mb-4">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, 
                die Ihr Browser automatisch an uns übermittelt. Dies sind:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p>
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die Erfassung dieser 
                Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Kontaktformular und Registrierung</h3>
              <p className="mb-4">
                Wenn Sie sich auf unserer Plattform registrieren oder das Kontaktformular nutzen, werden die von Ihnen 
                eingegebenen Daten zum Zwecke der Bearbeitung der Anfrage und für mögliche Anschlussfragen bei uns 
                gespeichert.
              </p>
              <p className="mb-4">
                <strong>Als Kunde erfassen wir:</strong> Name, E-Mail-Adresse, Telefonnummer (optional), Adresse (optional)
              </p>
              <p className="mb-4">
                <strong>Als Werkstatt erfassen wir:</strong> Firmenname, E-Mail-Adresse, Telefonnummer, Adresse, 
                Bankverbindung (IBAN), Steuernummer
              </p>
              <p>
                Die Verarbeitung dieser Daten erfolgt auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). 
                Sie können diese Einwilligung jederzeit widerrufen. Die Daten werden gelöscht, sobald sie für die 
                Erreichung des Zwecks ihrer Erhebung nicht mehr erforderlich sind oder Sie die Löschung beantragen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Anfrage per E-Mail oder Telefon</h3>
              <p>
                Wenn Sie uns per E-Mail oder Telefon kontaktieren, wird Ihre Anfrage inklusive aller daraus 
                hervorgehenden personenbezogenen Daten (Name, Anfrage) zum Zwecke der Bearbeitung Ihres Anliegens 
                bei uns gespeichert und verarbeitet. Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Datenweitergabe</h2>
              <p className="mb-4">
                Im Rahmen der Vermittlungsleistung werden bestimmte Daten zwischen Kunden und Werkstätten ausgetauscht:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Kunden sehen: Werkstattname, Adresse, Telefonnummer, Angebotsdaten</li>
                <li>Werkstätten sehen: Reifenanfragen mit Spezifikationen, Postleitzahl und Umkreis (keine personenbezogenen Kundendaten bis zur Auftragsannahme)</li>
              </ul>
              <p>
                Die Weitergabe erfolgt ausschließlich zum Zweck der Vermittlung und Vertragsabwicklung auf Grundlage 
                von Art. 6 Abs. 1 lit. b DSGVO.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Zahlungsdienstleister</h2>
              <p>
                Wir binden Zahlungsdienstleister ein, um Zahlungen sicher abzuwickeln. Für Zahlungen über diese 
                Dienstleister gelten die jeweiligen Datenschutzbestimmungen der Anbieter. Die Verarbeitung erfolgt 
                auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsabwicklung).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Google Calendar Integration</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Zweck der Integration</h3>
              <p className="mb-4">
                Bereifung24 bietet Werkstätten die Möglichkeit, ihren Google Calendar zu verbinden, um Termine 
                mit dem persönlichen Kalender des Werkstatt-Mitarbeiters zu synchronisieren. Diese Integration 
                ist vollständig optional und kann jederzeit aktiviert oder deaktiviert werden.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Verwendete Daten</h3>
              <p className="mb-4">Bei aktivierter Calendar-Integration verarbeiten wir folgende Daten:</p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li>Kalendername und Kalender-ID</li>
                <li>Termine (Datum, Uhrzeit, Titel, Beschreibung)</li>
                <li>Verfügbarkeitsinformationen (frei/belegt)</li>
                <li>OAuth Access Token und Refresh Token</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Funktionsweise</h3>
              <p className="mb-4">Die Calendar-Integration ermöglicht:</p>
              <ul className="list-disc list-inside mb-4 space-y-2">
                <li>
                  <strong>Lesen:</strong> Prüfung der Verfügbarkeit des Werkstatt-Mitarbeiters zur Vermeidung 
                  von Doppelbuchungen und Anzeige freier Zeitslots für Kunden
                </li>
                <li>
                  <strong>Schreiben:</strong> Automatisches Erstellen von Terminen bei Buchungsbestätigung und 
                  Synchronisation von Änderungen oder Verschiebungen
                </li>
                <li>
                  <strong>Löschen:</strong> Entfernung von Terminen bei Stornierung durch den Kunden
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Speicherung und Sicherheit</h3>
              <p className="mb-4">
                Die OAuth-Zugangsdaten (Access Token und Refresh Token) werden verschlüsselt in unserer 
                PostgreSQL-Datenbank gespeichert. Die Tokens werden ausschließlich für die Kommunikation mit 
                der Google Calendar API verwendet und nicht an Dritte weitergegeben.
              </p>
              <p className="mb-4">
                Die Kalenderdaten selbst werden nicht dauerhaft bei uns gespeichert, sondern nur temporär 
                abgerufen, um Verfügbarkeiten zu prüfen oder Termine zu erstellen.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Rechtsgrundlage</h3>
              <p className="mb-4">
                Die Verarbeitung erfolgt auf Grundlage Ihrer ausdrücklichen Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). 
                Die Integration ist optional und wird erst nach Ihrer aktiven Zustimmung durch den OAuth-Flow aktiviert.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Widerruf und Löschung</h3>
              <p className="mb-4">
                Sie können die Calendar-Integration jederzeit deaktivieren:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1">
                <li><strong>In Bereifung24:</strong> Dashboard → Einstellungen → Google Calendar → "Verbindung trennen"</li>
                <li><strong>Bei Google:</strong> <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">myaccount.google.com/permissions</a></li>
              </ul>
              <p className="mb-4">
                Bei Deaktivierung werden alle gespeicherten OAuth-Tokens sowie die Kalenderkonfiguration 
                umgehend aus unserer Datenbank gelöscht. Bereits erstellte Termine in Ihrem Google Calendar 
                bleiben bestehen und müssen bei Bedarf manuell gelöscht werden.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Drittanbieter</h3>
              <p className="mb-4">
                Die Calendar-Integration nutzt die Google Calendar API von:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Google Ireland Limited</strong></p>
                <p>Gordon House, Barrow Street</p>
                <p>Dublin 4, Irland</p>
                <p className="mt-2">
                  Datenschutzerklärung: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">https://policies.google.com/privacy</a>
                </p>
              </div>
              <p>
                Google verarbeitet Ihre Daten gemäß den eigenen Datenschutzbestimmungen. Die Datenübertragung 
                an Google erfolgt verschlüsselt über HTTPS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Ihre Rechte</h2>
              <p className="mb-4">Sie haben folgende Rechte:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Auskunftsrecht:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
                <li><strong>Berichtigungsrecht:</strong> Sie können die Berichtigung unrichtiger Daten verlangen</li>
                <li><strong>Löschungsrecht:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
                <li><strong>Einschränkung der Verarbeitung:</strong> Sie können die Einschränkung der Verarbeitung verlangen</li>
                <li><strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem strukturierten Format erhalten</li>
                <li><strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung Ihrer Daten widersprechen</li>
                <li><strong>Beschwerderecht:</strong> Sie können sich bei der zuständigen Aufsichtsbehörde beschweren</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Datensicherheit</h2>
              <p>
                Wir verwenden innerhalb des Website-Besuchs das verbreitete SSL-Verfahren (Secure Socket Layer) in 
                Verbindung mit der jeweils höchsten Verschlüsselungsstufe, die von Ihrem Browser unterstützt wird. 
                Alle Daten werden verschlüsselt übertragen und in sicheren Systemen gespeichert.
              </p>
            </section>

            <section className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Stand:</strong> November 2025
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
