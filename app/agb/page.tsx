import Link from 'next/link'

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-lg">
        <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-6 inline-block">
          ← Zurück zur Startseite
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
        
        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-600">Stand: 24.01.2026</p>
          {/* 1. Geltungsbereich */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Geltungsbereich</h2>
            <p className="mb-3">
              Diese Allgemeinen Geschäftsbedingungen (nachfolgend &quot;AGB&quot;) gelten für die Nutzung der Online-Plattform 
              Bereifung24 (nachfolgend &quot;Plattform&quot;), die unter der Domain <Link href="/" className="text-primary-600 hover:underline">www.bereifung24.de</Link> erreichbar ist.
            </p>
            <p className="mb-3">Die Plattform wird betrieben von:</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-3">
              <p className="font-semibold">Bereifung24</p>
              <p>Zdenek Kyzlink</p>
              <p>Jahnstraße 2</p>
              <p>71706 Markgröningen</p>
              <p>Deutschland</p>
              <p>E-Mail: <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a></p>
              <p>Telefon: <a href="tel:+4971479679990" className="text-primary-600 hover:underline">+49 7147 9679990</a></p>
              <p>Umsatzsteuer-ID: DE354910030</p>
            </div>
            <p className="mb-3">Nachfolgend &quot;Betreiber&quot; genannt.</p>
            <p className="mb-3">
              Die Plattform vermittelt zwischen Kunden, die Reifen und Montagedienstleistungen suchen (nachfolgend &quot;Kunden&quot;), 
              und Werkstätten, die diese Dienstleistungen anbieten (nachfolgend &quot;Werkstätten&quot;).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Vertragssprache</h3>
            <p className="mb-3">
              Die für den Vertragsschluss zur Verfügung stehende Sprache ist ausschließlich Deutsch.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2 Mindestalter</h3>
            <p className="mb-3">
              Die Nutzung der Plattform ist nur volljährigen Personen (ab 18 Jahren) gestattet. Mit der Registrierung bestätigt der Nutzer, dass er das 18. Lebensjahr vollendet hat.
            </p>
          </section>

          {/* 2. Vertragsgegenstand */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Vertragsgegenstand</h2>
            <p className="mb-3">Der Betreiber stellt eine Online-Plattform zur Verfügung, über die:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Kunden Anfragen für Reifen und Montagedienstleistungen erstellen können</li>
              <li>Werkstätten passende Angebote auf Kundenanfragen abgeben können</li>
              <li>Kunden Angebote vergleichen und annehmen können</li>
              <li>Termine zwischen Kunden und Werkstätten vereinbart werden können</li>
            </ul>
            <p className="mb-3">
              Der Betreiber tritt nicht als Vertragspartei für den Kauf von Reifen oder die Erbringung von 
              Montagedienstleistungen auf. Verträge über Reifen und Dienstleistungen kommen ausschließlich 
              zwischen Kunde und Werkstatt zustande.
            </p>
            <p className="mb-3">
              Der Betreiber ist ausschließlich Vermittler und haftet nicht für die Erfüllung der zwischen 
              Kunde und Werkstatt geschlossenen Verträge.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Preise und Angebote</h3>
            <p className="mb-3">
              Die auf der Plattform angezeigten Preise für Reifen und Montagedienstleistungen werden ausschließlich von den Werkstätten selbst erstellt und eingestellt. Der Betreiber gibt keine eigenen Preise vor und bezieht keine Preise von Drittanbietern.
            </p>
            <p className="mb-3">
              Der Betreiber übernimmt keine Gewähr für die Richtigkeit, Aktualität oder Vollständigkeit der von Werkstätten eingestellten Preise und Angebote. Die Werkstätten sind für die Korrektheit ihrer Angebote allein verantwortlich.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 CO2-Fahrzeugdaten (falls zutreffend)</h3>
            <p className="mb-3">
              Soweit CO2-Emissionswerte von Fahrzeugen angezeigt werden, stammen diese aus öffentlich zugänglichen Datenbanken (z.B. Kraftfahrt-Bundesamt). Der Betreiber übernimmt keine Gewähr für deren Richtigkeit, Aktualität oder Vollständigkeit. Die Angaben dienen ausschließlich zu Informationszwecken.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Speicherung des Vertragstextes</h3>
            <p className="mb-3">
              Der Vertragstext wird nach Vertragsschluss zwischen Kunde und Werkstatt gespeichert und ist für den Kunden in seinem Benutzerkonto einsehbar. Eine zusätzliche Zusendung der Vertragsdetails erfolgt per E-Mail an die bei der Registrierung hinterlegte E-Mail-Adresse.
            </p>
          </section>

          {/* 3. Registrierung und Nutzerkonto */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registrierung und Nutzerkonto</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Kunden-Registrierung</h3>
            <p className="mb-3">
              Die Registrierung und Nutzung der Plattform ist für Kunden kostenlos. Bei der Registrierung 
              sind wahrheitsgemäße und vollständige Angaben zu machen. Der Kunde ist verpflichtet, seine Daten stets aktuell zu halten.
            </p>
            <p className="mb-3">Kunden können sich mit folgenden Daten registrieren:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Vor- und Nachname</li>
              <li>E-Mail-Adresse</li>
              <li>Telefonnummer (optional)</li>
              <li>Passwort</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Werkstatt-Registrierung</h3>
            <p className="mb-3">
              Werkstätten können sich auf der Plattform registrieren. Die Registrierung ist kostenlos. 
              Nach der Registrierung prüft der Betreiber die Angaben der Werkstatt. Die Freischaltung 
              erfolgt nach erfolgreicher Prüfung.
            </p>
            <p className="mb-3">Werkstätten müssen bei der Registrierung vollständige und wahrheitsgemäße Angaben machen, insbesondere zu:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Firmenname und vollständige Anschrift</li>
              <li>Kontaktdaten (E-Mail, Telefon)</li>
              <li>Gewerbeinformationen</li>
              <li>Bankverbindung für SEPA-Lastschriftverfahren</li>
            </ul>
            <p className="mb-3 font-semibold">Verifizierung:</p>
            <p className="mb-3">
              Die Verifizierung der Werkstatt erfolgt durch den Betreiber. Der Betreiber prüft die Angaben und kann zusätzliche Nachweise anfordern. Die Art und der Umfang der Verifizierung liegen im Ermessen des Betreibers.
            </p>
            <p className="mb-3">
              Die Freischaltung erfolgt in der Regel innerhalb von 3 Werktagen nach erfolgreicher Verifizierung. Der Betreiber behält sich vor, Registrierungen ohne Angabe von Gründen abzulehnen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Zugangsdaten</h3>
            <p className="mb-3">
              Der Nutzer ist verpflichtet, seine Zugangsdaten (E-Mail und Passwort) geheim zu halten und 
              vor dem Zugriff durch Dritte zu schützen. Bei Verdacht auf Missbrauch ist der Betreiber 
              unverzüglich per E-Mail zu informieren.
            </p>
            <p className="mb-3">
              Der Nutzer haftet für alle Aktivitäten, die unter Verwendung seiner Zugangsdaten vorgenommen werden, es sei denn, er hat den Missbrauch nicht zu vertreten.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.4 Verbot von Mehrfach-Accounts</h3>
            <p className="mb-3">
              Jedem Nutzer (natürliche oder juristische Person) ist nur ein Account gestattet. Die Registrierung mehrerer Accounts durch eine Person oder Firma ist untersagt und führt zur Sperrung aller betroffenen Accounts.
            </p>
          </section>

          {/* 4. Nutzung der Plattform */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Nutzung der Plattform</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Anfragen durch Kunden</h3>
            <p className="mb-3">
              Kunden können über die Plattform Anfragen für Reifen und Montagedienstleistungen erstellen. 
              Die Anfragen sind unverbindlich und stellen kein Angebot im rechtlichen Sinne dar.
            </p>
            <p className="mb-3">Der Kunde verpflichtet sich, vollständige und korrekte Angaben zu machen, insbesondere zu:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Reifentyp und Dimensionen</li>
              <li>Fahrzeugdaten (Marke, Modell, HSN/TSN)</li>
              <li>Gewünschtem Liefertermin bzw. Montagetermin</li>
              <li>Standort / PLZ</li>
              <li>Kontaktdaten</li>
            </ul>
            <p className="mb-3 font-semibold">Gültigkeit von Anfragen:</p>
            <p className="mb-3">
              Bei Erstellung einer Anfrage legt der Kunde die Gültigkeitsdauer selbst fest. Nach Ablauf dieser vom Kunden gewählten Frist wird die Anfrage automatisch archiviert und steht Werkstätten nicht mehr zur Verfügung.
            </p>
            <p className="mb-3 font-semibold">Datenverarbeitung:</p>
            <p className="mb-3">
              Mit Absenden der Anfrage erklärt sich der Kunde einverstanden, dass seine Kontaktdaten, Fahrzeugdaten und Anfrageinhalte an passende Werkstätten in seiner Region weitergeleitet werden. Details zur Datenverarbeitung finden sich in der <Link href="/datenschutz" className="text-primary-600 hover:underline">Datenschutzerklärung</Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Angebote durch Werkstätten</h3>
            <p className="mb-3">
              Werkstätten können auf Kundenanfragen Angebote abgeben. Die Angebote stellen verbindliche 
              Angebote im rechtlichen Sinne dar und sind für die angegebene Gültigkeitsdauer bindend.
            </p>
            <p className="mb-3">
              Werkstätten verpflichten sich, realistische und marktgerechte Preise anzugeben und die 
              angebotenen Leistungen im Falle einer Annahme zu erbringen.
            </p>
            <p className="mb-3 font-semibold">Bindungsfrist:</p>
            <p className="mb-3">
              Bei Abgabe eines Angebots legt die Werkstatt die Bindungsfrist selbst fest. Das Angebot ist für die von der Werkstatt angegebene Gültigkeitsdauer bindend. Nach Ablauf der Bindungsfrist ist die Werkstatt berechtigt, das Angebot anzupassen oder zurückzuziehen.
            </p>
            <p className="mb-3 font-semibold">Preisänderungen:</p>
            <p className="mb-3">
              Ändern sich Reifenpreise beim Großhändler oder Hersteller zwischen Angebotsabgabe und geplantem Ausführungszeitpunkt erheblich (mehr als 10%), ist die Werkstatt berechtigt, den Kunden hierüber unverzüglich zu informieren und den Preis entsprechend anzupassen.
            </p>
            <p className="mb-3">
              In diesem Fall hat der Kunde das Recht, ohne Kosten vom Vertrag zurückzutreten.
            </p>
            <p className="mb-3">
              Die Werkstatt ist berechtigt, den Auftrag bei erheblichen Preisänderungen zu stornieren, sofern sie den Kunden unverzüglich (innerhalb von 24 Stunden nach Kenntniserlangung) informiert.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Vertragsschluss</h3>
            <p className="mb-3">
              Ein Vertrag über Reifen und Montagedienstleistung kommt zustande, wenn der Kunde ein Angebot einer Werkstatt über die Plattform annimmt. Mit der Annahme verpflichtet sich der Kunde zur Abnahme der Reifen und Inanspruchnahme der Montagedienstleistung zum vereinbarten Termin.
            </p>
            <p className="mb-3">Der Vertrag wird geschlossen zwischen:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Kunde (Verbraucher)</li>
              <li>Werkstatt (Unternehmer)</li>
            </ul>
            <p className="mb-3">
              Der Betreiber (bereifung24) ist <strong>NICHT</strong> Vertragspartei.
            </p>
            <p className="mb-3">
              Der Betreiber wird über jeden Vertragsschluss automatisch informiert und erhält die für die Provisionsabrechnung erforderlichen Daten.
            </p>
            <p className="mb-3 font-semibold">Vertragsbestätigung:</p>
            <p className="mb-3">
              Beide Parteien (Kunde und Werkstatt) erhalten nach Vertragsschluss eine automatische Bestätigungs-E-Mail mit allen relevanten Vertragsdaten:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Auftragsnummer</li>
              <li>Vereinbarter Termin</li>
              <li>Reifendetails und Menge</li>
              <li>Gesamtpreis (inkl. MwSt.)</li>
              <li>Kontaktdaten der Vertragspartner</li>
            </ul>
          </section>

          {/* 5. Widerrufsrecht für Verbraucher */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Widerrufsrecht für Verbraucher</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Widerrufsbelehrung</h3>
            <div className="bg-blue-50 border-l-4 border-primary-600 p-4 mb-4">
              <p className="font-semibold mb-3">Widerrufsrecht</p>
              <p className="mb-3">
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
              </p>
              <p className="mb-3">
                Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
              </p>
              <p className="mb-3">
                Um Ihr Widerrufsrecht auszuüben, müssen Sie die Werkstatt (nicht den Betreiber der Plattform), mit der Sie den Vertrag geschlossen haben, mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
              </p>
              <p className="mb-3">
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
              </p>
              <p className="font-semibold mb-3">Folgen des Widerrufs</p>
              <p>
                Wenn Sie diesen Vertrag widerrufen, hat die Werkstatt Ihnen alle Zahlungen, die sie von Ihnen erhalten hat, unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei der Werkstatt eingegangen ist.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Muster-Widerrufsformular</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 font-mono text-sm">
              <p className="mb-2">Wenn Sie den Vertrag widerrufen wollen, können Sie dieses Formular verwenden:</p>
              <p className="mb-2">An:</p>
              <p className="mb-2">[Werkstattname]</p>
              <p className="mb-2">[Werkstattadresse]</p>
              <p className="mb-2">[E-Mail-Adresse der Werkstatt]</p>
              <p className="mb-4">—</p>
              <p className="mb-2">Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)</p>
              <p className="mb-2">— Bestellt am (*)/erhalten am (*)</p>
              <p className="mb-2">— Name des/der Verbraucher(s)</p>
              <p className="mb-2">— Anschrift des/der Verbraucher(s)</p>
              <p className="mb-2">— Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
              <p>— Datum</p>
              <p className="mt-4 text-xs">(*) Unzutreffendes streichen</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 Erlöschen des Widerrufsrechts</h3>
            <p className="mb-3">
              Das Widerrufsrecht erlischt vorzeitig bei Verträgen zur Erbringung von Dienstleistungen, wenn die Werkstatt die Dienstleistung vollständig erbracht hat und mit der Ausführung der Dienstleistung erst begonnen hat, nachdem der Verbraucher dazu seine ausdrückliche Zustimmung gegeben hat und gleichzeitig seine Kenntnis davon bestätigt hat, dass er sein Widerrufsrecht bei vollständiger Vertragserfüllung durch den Unternehmer verliert.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.4 Online-Streitbeilegung (OS-Plattform)</h3>
            <p className="mb-3">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mb-3">
              Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.
            </p>
          </section>

          {/* 6. Provisionen für Werkstätten */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Provisionen für Werkstätten</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 Provisionspflicht</h3>
            <p className="mb-3">
              Für jeden über die Plattform vermittelten und erfolgreich abgeschlossenen Auftrag zahlt die 
              Werkstatt eine Provision an den Betreiber.
            </p>
            <p className="mb-3">
              Die Provision beträgt <strong>4,9% des Bruttoauftragswertes</strong> (Gesamtpreis für Reifen und 
              Montagedienstleistung inklusive Mehrwertsteuer).
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-3">
              <p className="font-semibold mb-2">Beispielrechnung:</p>
              <p>Bruttoauftragswert: 500,00 EUR</p>
              <p>Provision (4,9%): 24,50 EUR</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 Fälligkeit</h3>
            <p className="mb-3">Die Provision wird fällig, sobald:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Der Kunde ein Angebot der Werkstatt über die Plattform angenommen hat UND</li>
              <li>Der vereinbarte Termin stattgefunden hat UND</li>
              <li>Die Leistung erbracht wurde (Reifen montiert und Fahrzeug an Kunden übergeben)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 Zahlungsweise</h3>
            <p className="mb-3">
              Die Werkstatt erteilt dem Betreiber mit der Registrierung ein SEPA-Lastschriftmandat. Der Betreiber ist berechtigt, die fällige Provision per SEPA-Lastschrift vom angegebenen Konto der Werkstatt einzuziehen.
            </p>
            <p className="mb-3 font-semibold">Einzugszeitpunkt:</p>
            <p className="mb-3">
              Der Einzug erfolgt monatlich zum 15. des Folgemonats für alle im Vormonat abgeschlossenen und abgerechneten Aufträge.
            </p>
            <p className="mb-3">
              Die Werkstatt erhält vor jedem Einzug eine Provisionsabrechnung per E-Mail mit einer detaillierten Aufstellung aller abgerechneten Aufträge.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.4 Stornierung und Rückerstattung</h3>
            <p className="mb-3">
              Bei Stornierung eines Auftrags durch den Kunden oder Nichterscheinen des Kunden entfällt die Provisionspflicht, sofern die Werkstatt dies unverzüglich über die Plattform meldet.
            </p>
            <p className="mb-3">
              Wurde die Provision bereits eingezogen, erfolgt eine Gutschrift bzw. Rückerstattung mit der nächsten Abrechnung.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.5 Widerspruch gegen SEPA-Lastschrift</h3>
            <p className="mb-3">
              Die Werkstatt kann gegen eine SEPA-Lastschrift binnen 8 Wochen Widerspruch einlegen. Bei berechtigtem Widerspruch (z.B. fehlerhafte Abrechnung) wird die Provision korrigiert.
            </p>
            <p className="mb-3">
              Unberechtigte Widersprüche können zur Sperrung des Werkstatt-Accounts führen. Die Werkstatt trägt die Kosten für unberechtigte Rücklastschriften.
            </p>
          </section>

          {/* 7. Zahlungsabwicklung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Zahlungsabwicklung zwischen Kunde und Werkstatt</h2>
            <p className="mb-3">
              Die Zahlung für Reifen und Montagedienstleistung erfolgt direkt zwischen Kunde und Werkstatt. 
              Der Betreiber ist nicht in die Zahlungsabwicklung involviert und tritt nicht als Zahlungsdienstleister auf.
            </p>
            <p className="mb-3">
              Verfügbare Zahlungsoptionen werden von der Werkstatt festgelegt und können umfassen:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Barzahlung vor Ort</li>
              <li>EC-Karten-Zahlung vor Ort</li>
              <li>Kreditkarte (falls von Werkstatt angeboten)</li>
              <li>Überweisung (Vorkasse oder Rechnung)</li>
              <li>PayPal (falls von Werkstatt angeboten)</li>
            </ul>
            <p className="mb-3">
              Der Betreiber übernimmt keine Haftung für die Zahlungsabwicklung zwischen Kunde und Werkstatt. Bei Zahlungsstreitigkeiten sind Kunde und Werkstatt selbst zur Klärung verpflichtet.
            </p>
          </section>

          {/* 8. Bewertungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Bewertungen und Rezensionen</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.1 Berechtigung zur Bewertung</h3>
            <p className="mb-3">
              Kunden können nach erfolgter Leistungserbringung Bewertungen für Werkstätten abgeben. Nur Kunden, die nachweislich einen Termin über die Plattform gebucht haben, können Bewertungen abgeben.
            </p>
            <p className="mb-3">
              Bewertungen können nur einmal pro Auftrag abgegeben werden und sind nach Veröffentlichung nicht mehr bearbeitbar.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.2 Anforderungen an Bewertungen</h3>
            <p className="mb-3">
              Bewertungen müssen wahrheitsgemäß sein und auf eigenen Erfahrungen beruhen. Sie dürfen keine beleidigenden, diskriminierenden, rechtswidrigen oder anderweitig unangemessenen Inhalte enthalten.
            </p>
            <p className="mb-3">Verboten sind insbesondere:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Falsche Tatsachenbehauptungen</li>
              <li>Beleidigungen und persönliche Angriffe</li>
              <li>Rassistische, sexistische oder diskriminierende Äußerungen</li>
              <li>Werbung für Drittanbieter</li>
              <li>Links zu externen Websites</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.3 Manipulation von Bewertungen</h3>
            <p className="mb-3">
              Die Manipulation von Bewertungen ist strengstens untersagt. Dies umfasst insbesondere:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Selbstbewertungen von Werkstätten</li>
              <li>Bewertungen von Mitbewerbern durch Werkstätten</li>
              <li>Gekaufte oder getauschte Bewertungen</li>
              <li>Mehrfachbewertungen durch denselben Nutzer</li>
            </ul>
            <p className="mb-3">
              Verstöße gegen das Manipulationsverbot führen zur sofortigen Sperrung des Accounts und können rechtliche Konsequenzen nach sich ziehen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.4 Moderation und Löschung</h3>
            <p className="mb-3">
              Der Betreiber behält sich vor, Bewertungen zu prüfen und rechtswidrige oder unangemessene Bewertungen ohne vorherige Ankündigung zu löschen oder zu sperren.
            </p>
            <p className="mb-3">
              Werkstätten können Bewertungen, die sie für rechtswidrig halten, beim Betreiber melden. Der Betreiber prüft den Sachverhalt und entscheidet nach eigenem Ermessen über Löschung oder Beibehaltung.
            </p>
          </section>

          {/* 9. Haftung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Haftung</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.1 Haftung des Betreibers</h3>
            <p className="mb-3">
              Der Betreiber haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit sowie für sonstige Schäden, die auf vorsätzlicher oder grob fahrlässiger Pflichtverletzung des Betreibers, seiner gesetzlichen Vertreter oder Erfüllungsgehilfen beruhen.
            </p>
            <p className="mb-3">
              Für sonstige Schäden haftet der Betreiber nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
            </p>
            <p className="mb-3">
              Der Betreiber haftet insbesondere nicht für:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Die Qualität, Verfügbarkeit oder Eignung der von Werkstätten angebotenen Reifen und Dienstleistungen</li>
              <li>Die Erfüllung der zwischen Kunde und Werkstatt geschlossenen Verträge</li>
              <li>Schäden, die durch falsche oder unvollständige Angaben von Nutzern entstehen</li>
              <li>Ausfallzeiten der Plattform aufgrund höherer Gewalt, technischer Störungen oder Wartungsarbeiten</li>
              <li>Datenverlust, soweit dieser nicht durch fehlende Backup-Möglichkeiten des Betreibers verursacht wurde</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.2 Haftung der Werkstätten</h3>
            <p className="mb-3">
              Die Werkstatt haftet gegenüber dem Kunden für die ordnungsgemäße Erfüllung des zwischen ihnen geschlossenen Vertrages nach den gesetzlichen Bestimmungen. Dies umfasst insbesondere:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Sachgemäße Montage der Reifen</li>
              <li>Verwendung geeigneter und fehlerfreier Reifen</li>
              <li>Einhaltung vereinbarter Termine</li>
              <li>Fachgerechte Durchführung aller Arbeiten</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.3 Haftung für fremde Inhalte</h3>
            <p className="mb-3">
              Der Betreiber übernimmt keine Haftung für fremde Inhalte (Angebote, Bewertungen, Beschreibungen etc.), die von Nutzern auf der Plattform eingestellt werden. Der Betreiber prüft fremde Inhalte nicht vollständig und übernimmt keine Gewähr für deren Richtigkeit, Vollständigkeit oder Rechtmäßigkeit.
            </p>
            <p className="mb-3">
              Der Betreiber entfernt rechtswidrige Inhalte unverzüglich nach Kenntniserlangung. Nutzer können rechtswidrige Inhalte über die Melde-Funktion anzeigen.
            </p>
          </section>

          {/* 10. Datenschutz */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Datenschutz</h2>
            <p className="mb-3">
              Der Betreiber erhebt, verarbeitet und nutzt personenbezogene Daten der Nutzer nur im Rahmen der geltenden Datenschutzgesetze, insbesondere der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG).
            </p>
            <p className="mb-3">
              Nähere Informationen zum Datenschutz, zur Art, zum Umfang und zum Zweck der Datenerhebung sowie zu den Rechten der Nutzer finden Sie in unserer{' '}
              <Link href="/datenschutz" className="text-primary-600 hover:underline">
                Datenschutzerklärung
              </Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.1 Betroffenenrechte</h3>
            <p className="mb-3">
              Nutzer haben gemäß DSGVO folgende Rechte gegenüber dem Betreiber:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li><strong>Art. 15 DSGVO:</strong> Recht auf Auskunft über die gespeicherten personenbezogenen Daten</li>
              <li><strong>Art. 16 DSGVO:</strong> Recht auf Berichtigung unrichtiger Daten</li>
              <li><strong>Art. 17 DSGVO:</strong> Recht auf Löschung (&quot;Recht auf Vergessenwerden&quot;)</li>
              <li><strong>Art. 18 DSGVO:</strong> Recht auf Einschränkung der Verarbeitung</li>
              <li><strong>Art. 20 DSGVO:</strong> Recht auf Datenübertragbarkeit</li>
              <li><strong>Art. 21 DSGVO:</strong> Widerspruchsrecht gegen die Verarbeitung</li>
            </ul>
            <p className="mb-3">
              Zur Ausübung dieser Rechte können Nutzer sich jederzeit per E-Mail an <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a> wenden.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.2 Beschwerderecht</h3>
            <p className="mb-3">
              Nutzer haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde über die Verarbeitung ihrer personenbezogenen Daten durch den Betreiber zu beschweren.
            </p>
            <p className="mb-3">
              Zuständige Aufsichtsbehörde für Baden-Württemberg ist der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg.
            </p>
          </section>

          {/* 11. Immaterialgüterrechte */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Immaterialgüterrechte / Geistiges Eigentum</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.1 Urheberrechte</h3>
            <p className="mb-3">
              Alle Inhalte der Plattform (Texte, Grafiken, Logos, Bilder, Videos, Software, Datenbanken, Design, Struktur etc.) sind urheberrechtlich geschützt und Eigentum des Betreibers oder seiner Lizenzgeber.
            </p>
            <p className="mb-3">
              Die Nutzung der Plattform berechtigt nicht zur Vervielfältigung, Verbreitung, Veränderung oder sonstigen Nutzung der Inhalte ohne ausdrückliche schriftliche Zustimmung des Betreibers.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.2 Markenrechte</h3>
            <p className="mb-3">
              Die Marke &quot;Bereifung24&quot;, das Logo und sonstige Kennzeichen sind Eigentum des Betreibers und dürfen ohne ausdrückliche Genehmigung nicht verwendet werden.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.3 Verbot von Scraping und Crawling</h3>
            <p className="mb-3">
              Das automatisierte Auslesen (Scraping, Crawling) von Daten der Plattform ist untersagt. Dies umfasst insbesondere:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Automatisches Auslesen von Angeboten, Preisen oder Kontaktdaten</li>
              <li>Systematisches Herunterladen von Inhalten mittels Bots oder Skripten</li>
              <li>Nutzung der Daten für eigene Zwecke oder Weiterverkauf</li>
            </ul>
            <p className="mb-3">
              Verstöße gegen das Scraping-Verbot können zivilrechtlich und strafrechtlich verfolgt werden.
            </p>
          </section>

          {/* 12. Verfügbarkeit und technische Störungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Verfügbarkeit und technische Störungen</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.1 Verfügbarkeit</h3>
            <p className="mb-3">
              Der Betreiber bemüht sich um eine möglichst hohe Verfügbarkeit der Plattform (angestrebt: 99% im Jahresmittel). Eine Verfügbarkeit von 100% kann jedoch technisch nicht garantiert werden.
            </p>
            <p className="mb-3">
              Der Betreiber ist berechtigt, die Plattform zeitweise vom Netz zu nehmen, um Wartungsarbeiten, Updates oder Sicherheitsmaßnahmen durchzuführen. Solche Arbeiten werden nach Möglichkeit außerhalb der Geschäftszeiten durchgeführt.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.2 Technische Störungen</h3>
            <p className="mb-3">
              Bei technischen Störungen oder Ausfällen bemüht sich der Betreiber um schnellstmögliche Behebung. Eine Haftung für Schäden durch Ausfälle besteht nur im Rahmen von Ziffer 9 (Haftung).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.3 Höhere Gewalt</h3>
            <p className="mb-3">
              Der Betreiber haftet nicht für Ausfälle oder Störungen, die durch höhere Gewalt, Streik, Aussperrung, behördliche Maßnahmen, Energieausfälle, Ausfall von Telekommunikationsverbindungen oder vergleichbare Umstände verursacht werden.
            </p>
          </section>

          {/* 13. Vertraulichkeit */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Vertraulichkeit</h2>
            <p className="mb-3">
              Alle Nutzer verpflichten sich, vertrauliche Informationen, die sie im Rahmen der Nutzung der Plattform erhalten, vertraulich zu behandeln und nicht an Dritte weiterzugeben, sofern nicht gesetzlich vorgeschrieben oder vertraglich vereinbart.
            </p>
            <p className="mb-3">Als vertraulich gelten insbesondere:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Kontaktdaten anderer Nutzer (Kunden und Werkstätten)</li>
              <li>Preise und Kalkulationen von Werkstätten</li>
              <li>Geschäftsinterna und Betriebsgeheimnisse</li>
              <li>Nicht öffentlich zugängliche Informationen über die Plattform</li>
            </ul>
            <p className="mb-3">
              Die Vertraulichkeitsverpflichtung gilt auch nach Beendigung der Nutzung der Plattform fort.
            </p>
          </section>

          {/* 14. Newsletter und Werbung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Newsletter und Werbung</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14.1 Newsletter-Anmeldung</h3>
            <p className="mb-3">
              Nutzer können sich für den Newsletter der Plattform anmelden, um Informationen über neue Funktionen, Angebote und Updates zu erhalten.
            </p>
            <p className="mb-3">
              Die Anmeldung erfolgt im Double-Opt-In-Verfahren: Nach Eingabe der E-Mail-Adresse erhält der Nutzer eine Bestätigungs-E-Mail mit einem Aktivierungslink. Erst nach Klick auf diesen Link ist die Anmeldung abgeschlossen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14.2 Abmeldung</h3>
            <p className="mb-3">
              Die Einwilligung zur Newsletter-Zusendung kann jederzeit widerrufen werden. Jeder Newsletter enthält einen Abmelde-Link. Alternativ kann die Abmeldung per E-Mail an <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a> erfolgen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14.3 Funktionale E-Mails</h3>
            <p className="mb-3">
              Unabhängig von der Newsletter-Anmeldung erhalten Nutzer funktionale E-Mails im Zusammenhang mit der Nutzung der Plattform (Registrierungsbestätigung, Angebots-Benachrichtigungen, Termin-Erinnerungen etc.). Diese E-Mails sind für den Betrieb der Plattform erforderlich und können nicht abbestellt werden.
            </p>
          </section>

          {/* 15. Sperrung, Kündigung und Löschung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Sperrung, Kündigung und Löschung</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.1 Kündigung durch den Nutzer</h3>
            <p className="mb-3">
              Nutzer können ihr Konto jederzeit ohne Angabe von Gründen kündigen. Die Kündigung erfolgt über die Einstellungen im Benutzerkonto oder per E-Mail an <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a>.
            </p>
            <p className="mb-3">
              Die Kündigung wird innerhalb von 7 Tagen wirksam. Bis dahin können noch laufende Aufträge abgeschlossen werden.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.2 Sperrung durch den Betreiber</h3>
            <p className="mb-3">
              Der Betreiber kann Nutzerkonten bei Verstößen gegen diese AGB sperren oder löschen, insbesondere bei:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Falschen oder unvollständigen Angaben bei der Registrierung</li>
              <li>Missbräuchlicher Nutzung der Plattform</li>
              <li>Wiederholtem Nichterscheinen zu vereinbarten Terminen (Kunden)</li>
              <li>Wiederholter Nichterfüllung angenommener Angebote (Werkstätten)</li>
              <li>Rechtswidrigem Verhalten (Beleidigungen, Drohungen, Betrug etc.)</li>
              <li>Zahlungsverzug bei Provisionen (Werkstätten)</li>
              <li>Manipulation von Bewertungen</li>
              <li>Scraping oder unbefugtem Datenauslesen</li>
            </ul>
            <p className="mb-3">
              Vor einer Sperrung wird der Betreiber den Nutzer in der Regel abmahnen und zur Stellungnahme auffordern, sofern nicht ein schwerwiegender Verstoß vorliegt, der eine sofortige Sperrung rechtfertigt.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.3 Folgen der Kündigung</h3>
            <p className="mb-3">
              Bei Kündigung oder Sperrung werden bereits vereinbarte Termine zwischen Kunde und Werkstatt nicht berührt und sind weiterhin zu erfüllen.
            </p>
            <p className="mb-3">
              Provisionsansprüche des Betreibers für bereits vermittelte Aufträge bleiben auch nach Kündigung bestehen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.4 Datenlöschung</h3>
            <p className="mb-3">
              Nach Kündigung oder Sperrung werden personenbezogene Daten des Nutzers gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
            <p className="mb-3">
              Buchhalterische Unterlagen (Provisionsabrechnungen, Rechnungen etc.) werden gemäß den gesetzlichen Aufbewahrungsfristen (in der Regel 10 Jahre) aufbewahrt.
            </p>
            <p className="mb-3">
              Bewertungen bleiben auch nach Löschung des Nutzerkontos auf der Plattform sichtbar, werden jedoch anonymisiert (Anzeige als &quot;Ehemaliger Nutzer&quot;).
            </p>
          </section>

          {/* 16. Abtretung von Rechten und Pflichten */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Abtretung von Rechten und Pflichten</h2>
            <p className="mb-3">
              Die Abtretung von Rechten und Pflichten aus diesen AGB an Dritte bedarf der vorherigen schriftlichen Zustimmung des Betreibers.
            </p>
            <p className="mb-3">
              Der Betreiber ist berechtigt, seine Rechte und Pflichten aus diesen AGB ganz oder teilweise an Dritte abzutreten, insbesondere im Falle einer Unternehmensveräußerung oder -umstrukturierung. Nutzer werden über eine solche Abtretung rechtzeitig informiert.
            </p>
          </section>

          {/* 17. Änderung der AGB */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Änderung der AGB</h2>
            <p className="mb-3">
              Der Betreiber behält sich vor, diese AGB jederzeit zu ändern, sofern dies für den Nutzer zumutbar ist.
            </p>
            <p className="mb-3">
              Änderungen können insbesondere erforderlich werden aufgrund:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Gesetzlicher oder behördlicher Vorgaben</li>
              <li>Technischer Weiterentwicklungen der Plattform</li>
              <li>Neuer Funktionen oder Dienstleistungen</li>
              <li>Änderungen im Geschäftsmodell</li>
              <li>Anpassung an Marktbedingungen</li>
            </ul>
            <p className="mb-3">
              Nutzer werden über Änderungen mindestens 4 Wochen vor Inkrafttreten per E-Mail an die im Benutzerkonto hinterlegte E-Mail-Adresse informiert.
            </p>
            <p className="mb-3">
              Widerspricht der Nutzer der Änderung nicht innerhalb von 4 Wochen nach Zugang der Änderungsmitteilung, gelten die geänderten AGB als angenommen. Der Betreiber wird in der Änderungsmitteilung auf diese Rechtsfolge und das Widerspruchsrecht gesondert hinweisen.
            </p>
            <p className="mb-3">
              Widerspricht der Nutzer fristgerecht, ist der Betreiber berechtigt, das Nutzungsverhältnis mit einer Frist von 4 Wochen zu kündigen.
            </p>
          </section>

          {/* 18. Schlussbestimmungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Schlussbestimmungen</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.1 Anwendbares Recht</h3>
            <p className="mb-3">
              Für diese AGB und alle Rechtsbeziehungen zwischen dem Betreiber und den Nutzern gilt ausschließlich das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
            </p>
            <p className="mb-3">
              Bei Verbrauchern gilt diese Rechtswahl nur, soweit dadurch keine zwingenden gesetzlichen Bestimmungen des Staates eingeschränkt werden, in dem der Verbraucher seinen gewöhnlichen Aufenthalt hat.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.2 Gerichtsstand</h3>
            <p className="mb-3">
              Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist <strong>Ludwigsburg</strong>, sofern der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen ist.
            </p>
            <p className="mb-3">
              Für Verbraucher gilt der gesetzliche Gerichtsstand.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.3 Salvatorische Klausel</h3>
            <p className="mb-3">
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen davon unberührt.
            </p>
            <p className="mb-3">
              An die Stelle der unwirksamen Bestimmung tritt eine angemessene Regelung, die dem wirtschaftlichen Zweck und der Interessenlage der unwirksamen Bestimmung am nächsten kommt. Gleiches gilt für eventuelle Regelungslücken.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.4 Schriftformerfordernis</h3>
            <p className="mb-3">
              Änderungen oder Ergänzungen dieser AGB bedürfen der Schriftform. Dies gilt auch für die Aufhebung dieses Schriftformerfordernisses.
            </p>
            <p className="mb-3">
              E-Mail genügt zur Wahrung der Schriftform, sofern sie eine qualifizierte elektronische Signatur enthält oder eine Textform-Vereinbarung getroffen wurde.
            </p>
          </section>

          {/* Stand und Betreiber */}
          <section className="pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600 mb-4">
              <strong>Stand:</strong> 24.01.2026
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold mb-2">Betreiber:</p>
              <p>Bereifung24</p>
              <p>Zdenek Kyzlink</p>
              <p>Jahnstraße 2</p>
              <p>71706 Markgröningen</p>
              <p>Deutschland</p>
              <p className="mt-2">E-Mail: <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a></p>
              <p>Telefon: <a href="tel:+4971479679990" className="text-primary-600 hover:underline">+49 7147 9679990</a></p>
              <p className="mt-2">Umsatzsteuer-ID: DE354910030</p>
            </div>
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t border-gray-300 flex justify-between">
          <Link 
            href="/"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            ← Zurück zur Startseite
          </Link>
          <Link 
            href="/datenschutz"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Datenschutzerklärung →
          </Link>
        </div>
      </div>
    </div>
  )
}
