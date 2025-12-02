import Link from 'next/link'

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>
        
        <div className="space-y-8 text-gray-700">
          {/* 1. Geltungsbereich */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Geltungsbereich</h2>
            <p className="mb-3">
              Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für die Nutzung der Online-Plattform 
              Bereifung24 (nachfolgend "Plattform"), die unter der Domain www.bereifung24.de erreichbar ist.
            </p>
            <p className="mb-3">
              Die Plattform wird betrieben von Bereifung24, Zdenek Kyzlink, Jahnstraße 2, 71706 Markgröningen 
              (nachfolgend "Betreiber").
            </p>
            <p>
              Die Plattform vermittelt zwischen Kunden, die Reifen und Montagedienstleistungen suchen (nachfolgend "Kunden"), 
              und Werkstätten, die diese Dienstleistungen anbieten (nachfolgend "Werkstätten").
            </p>
          </section>

          {/* 2. Vertragsgegenstand */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Vertragsgegenstand</h2>
            <p className="mb-3">
              Der Betreiber stellt eine Online-Plattform zur Verfügung, über die:
            </p>
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
            <p>
              Der Betreiber ist ausschließlich Vermittler und haftet nicht für die Erfüllung der zwischen 
              Kunde und Werkstatt geschlossenen Verträge.
            </p>
          </section>

          {/* 3. Registrierung und Nutzerkonto */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registrierung und Nutzerkonto</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.1 Kunden-Registrierung</h3>
            <p className="mb-3">
              Die Registrierung und Nutzung der Plattform ist für Kunden kostenlos. Bei der Registrierung 
              sind wahrheitsgemäße Angaben zu machen. Der Kunde ist verpflichtet, seine Daten aktuell zu halten.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.2 Werkstatt-Registrierung</h3>
            <p className="mb-3">
              Werkstätten können sich auf der Plattform registrieren. Die Registrierung ist kostenlos. 
              Nach der Registrierung prüft der Betreiber die Angaben der Werkstatt. Die Freischaltung 
              erfolgt nach erfolgreicher Prüfung.
            </p>
            <p className="mb-3">
              Werkstätten müssen bei der Registrierung vollständige und wahrheitsgemäße Angaben machen, 
              insbesondere zu:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Firmenname und Anschrift</li>
              <li>Kontaktdaten</li>
              <li>Gewerbenachweis</li>
              <li>Bankverbindung für SEPA-Lastschriftverfahren</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.3 Zugangsdaten</h3>
            <p>
              Der Nutzer ist verpflichtet, seine Zugangsdaten (E-Mail und Passwort) geheim zu halten und 
              vor dem Zugriff durch Dritte zu schützen. Bei Verdacht auf Missbrauch ist der Betreiber 
              unverzüglich zu informieren.
            </p>
          </section>

          {/* 4. Nutzung der Plattform */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Nutzung der Plattform</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.1 Anfragen durch Kunden</h3>
            <p className="mb-3">
              Kunden können über die Plattform Anfragen für Reifen und Montagedienstleistungen erstellen. 
              Die Anfragen sind unverbindlich und stellen kein Angebot im rechtlichen Sinne dar.
            </p>
            <p className="mb-3">
              Der Kunde verpflichtet sich, vollständige und korrekte Angaben zu machen, insbesondere zu:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Reifentyp und Dimensionen</li>
              <li>Fahrzeugdaten</li>
              <li>Gewünschtem Liefertermin</li>
              <li>Standort</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.2 Angebote durch Werkstätten</h3>
            <p className="mb-3">
              Werkstätten können auf Kundenanfragen Angebote abgeben. Die Angebote stellen verbindliche 
              Angebote im rechtlichen Sinne dar und sind für die Gültigkeitsdauer bindend.
            </p>
            <p className="mb-3">
              Werkstätten verpflichten sich, realistische und marktgerechte Preise anzugeben und die 
              angebotenen Leistungen im Falle einer Annahme zu erbringen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.3 Vertragsschluss</h3>
            <p className="mb-3">
              Ein Vertrag kommt zustande, wenn der Kunde ein Angebot einer Werkstatt über die Plattform annimmt. 
              Mit der Annahme verpflichtet sich der Kunde zur Abnahme der Reifen und Inanspruchnahme der 
              Montagedienstleistung.
            </p>
            <p>
              Der Betreiber wird über jeden Vertragsschluss automatisch informiert.
            </p>
          </section>

          {/* 5. Provisionen für Werkstätten */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Provisionen für Werkstätten</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.1 Provisionspflicht</h3>
            <p className="mb-3">
              Für jeden über die Plattform vermittelten und erfolgreich abgeschlossenen Auftrag zahlt die 
              Werkstatt eine Provision an den Betreiber.
            </p>
            <p className="mb-3">
              Die Provision beträgt <strong>4,9% des Bruttoauftragswertes</strong> (Gesamtpreis für Reifen und 
              Montagedienstleistung inklusive Mehrwertsteuer).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.2 Fälligkeit</h3>
            <p className="mb-3">
              Die Provision wird fällig, sobald:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Der Kunde ein Angebot der Werkstatt über die Plattform angenommen hat</li>
              <li>Der vereinbarte Termin stattgefunden hat</li>
              <li>Die Leistung erbracht wurde</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.3 Zahlungsweise</h3>
            <p className="mb-3">
              Die Werkstatt erteilt dem Betreiber mit der Registrierung ein SEPA-Lastschriftmandat. 
              Der Betreiber ist berechtigt, die fällige Provision per SEPA-Lastschrift vom angegebenen 
              Konto der Werkstatt einzuziehen.
            </p>
            <p className="mb-3">
              Der Einzug erfolgt monatlich zum 15. des Folgemonats für alle im Vormonat abgeschlossenen Aufträge.
            </p>
            <p>
              Die Werkstatt erhält vor jedem Einzug eine Provisionsabrechnung per E-Mail.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.4 Stornierung</h3>
            <p>
              Bei Stornierung eines Auftrags durch den Kunden oder Nichterscheinen des Kunden entfällt die 
              Provisionspflicht, sofern die Werkstatt dies unverzüglich über die Plattform meldet.
            </p>
          </section>

          {/* 6. Zahlungsabwicklung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Zahlungsabwicklung</h2>
            <p className="mb-3">
              Die Zahlung für Reifen und Montagedienstleistung erfolgt direkt zwischen Kunde und Werkstatt. 
              Der Betreiber ist nicht in die Zahlungsabwicklung involviert.
            </p>
            <p className="mb-3">
              Verfügbare Zahlungsoptionen werden von der Werkstatt festgelegt und können umfassen:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Barzahlung vor Ort</li>
              <li>EC-Karten-Zahlung vor Ort</li>
              <li>Überweisung</li>
              <li>PayPal (falls von Werkstatt angeboten)</li>
            </ul>
          </section>

          {/* 7. Bewertungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Bewertungen</h2>
            <p className="mb-3">
              Kunden können nach erfolgter Leistungserbringung Bewertungen für Werkstätten abgeben.
            </p>
            <p className="mb-3">
              Bewertungen müssen wahrheitsgemäß sein und dürfen keine beleidigenden, diskriminierenden 
              oder rechtswidrigen Inhalte enthalten.
            </p>
            <p>
              Der Betreiber behält sich vor, rechtswidrige oder unangemessene Bewertungen zu löschen.
            </p>
          </section>

          {/* 8. Haftung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Haftung</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">8.1 Haftung des Betreibers</h3>
            <p className="mb-3">
              Der Betreiber haftet nur für Schäden, die auf einer vorsätzlichen oder grob fahrlässigen 
              Pflichtverletzung beruhen. Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, 
              soweit nicht Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit betroffen sind.
            </p>
            <p className="mb-3">
              Der Betreiber haftet insbesondere nicht für:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Die Qualität der von Werkstätten angebotenen Reifen und Dienstleistungen</li>
              <li>Die Erfüllung der zwischen Kunde und Werkstatt geschlossenen Verträge</li>
              <li>Schäden, die durch falsche Angaben von Nutzern entstehen</li>
              <li>Ausfallzeiten der Plattform aufgrund höherer Gewalt oder technischer Störungen</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">8.2 Haftung der Werkstätten</h3>
            <p>
              Die Werkstatt haftet gegenüber dem Kunden für die ordnungsgemäße Erfüllung des zwischen ihnen 
              geschlossenen Vertrages nach den gesetzlichen Bestimmungen.
            </p>
          </section>

          {/* 9. Datenschutz */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Datenschutz</h2>
            <p className="mb-3">
              Der Betreiber erhebt, verarbeitet und nutzt personenbezogene Daten der Nutzer nur im Rahmen 
              der geltenden Datenschutzgesetze.
            </p>
            <p>
              Nähere Informationen zum Datenschutz finden Sie in unserer{' '}
              <Link href="/datenschutz" className="text-primary-600 hover:text-primary-700 underline">
                Datenschutzerklärung
              </Link>.
            </p>
          </section>

          {/* 10. Sperrung und Kündigung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Sperrung und Kündigung</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">10.1 Kündigung durch den Nutzer</h3>
            <p className="mb-3">
              Nutzer können ihr Konto jederzeit ohne Angabe von Gründen kündigen. Die Kündigung erfolgt 
              über die Einstellungen im Benutzerkonto oder per E-Mail an den Support.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">10.2 Sperrung durch den Betreiber</h3>
            <p className="mb-3">
              Der Betreiber kann Nutzerkonten bei Verstößen gegen diese AGB sperren oder löschen, insbesondere bei:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Falschen Angaben bei der Registrierung</li>
              <li>Missbräuchlicher Nutzung der Plattform</li>
              <li>Wiederholten Nichterscheinen zu vereinbarten Terminen</li>
              <li>Rechtswidrigem Verhalten</li>
              <li>Zahlungsverzug bei Provisionen (Werkstätten)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">10.3 Folgen der Kündigung</h3>
            <p>
              Bei Kündigung oder Sperrung werden bereits vereinbarte Termine zwischen Kunde und Werkstatt 
              nicht berührt und sind weiterhin zu erfüllen. Provisionsansprüche des Betreibers bleiben bestehen.
            </p>
          </section>

          {/* 11. Änderung der AGB */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Änderung der AGB</h2>
            <p className="mb-3">
              Der Betreiber behält sich vor, diese AGB jederzeit zu ändern. Nutzer werden über Änderungen 
              per E-Mail informiert.
            </p>
            <p>
              Widerspricht der Nutzer der Änderung nicht innerhalb von 4 Wochen nach Zugang der 
              Änderungsmitteilung, gelten die geänderten AGB als angenommen. Der Betreiber wird in der 
              Änderungsmitteilung auf diese Rechtsfolge hinweisen.
            </p>
          </section>

          {/* 12. Schlussbestimmungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Schlussbestimmungen</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">12.1 Anwendbares Recht</h3>
            <p className="mb-3">
              Es gilt ausschließlich das Recht der Bundesrepublik Deutschland unter Ausschluss des 
              UN-Kaufrechts.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">12.2 Gerichtsstand</h3>
            <p className="mb-3">
              Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist Ludwigsburg, 
              sofern der Nutzer Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches 
              Sondervermögen ist.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">12.3 Salvatorische Klausel</h3>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit 
              der übrigen Bestimmungen davon unberührt. An die Stelle der unwirksamen Bestimmung tritt 
              eine angemessene Regelung, die dem wirtschaftlichen Zweck der unwirksamen Bestimmung am 
              nächsten kommt.
            </p>
          </section>

          {/* Stand */}
          <section className="pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600">
              <strong>Stand:</strong> November 2025
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Betreiber:</strong><br />
              Bereifung24<br />
              Zdenek Kyzlink<br />
              Jahnstraße 2<br />
              71706 Markgröningen
            </p>
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
