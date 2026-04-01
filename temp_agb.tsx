import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AGB - Allgemeine Gesch├ñftsbedingungen - Bereifung24',
  description: 'Allgemeine Gesch├ñftsbedingungen der Bereifung24 GmbH f├╝r die Nutzung der Online-Plattform.',
  alternates: { canonical: 'https://bereifung24.de/agb' }
}

export default function AGBPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-lg">
        <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-6 inline-block">
          ÔåÉ Zur├╝ck zur Startseite
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Allgemeine Gesch├ñftsbedingungen (AGB)</h1>
        
        <div className="prose max-w-none space-y-6 text-gray-700">
          <p className="text-sm text-gray-600">Stand: 24.01.2026</p>
          {/* 1. Geltungsbereich */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Geltungsbereich</h2>
            <p className="mb-3">
              Diese Allgemeinen Gesch├ñftsbedingungen (nachfolgend &quot;AGB&quot;) gelten f├╝r die Nutzung der Online-Plattform 
              Bereifung24 (nachfolgend &quot;Plattform&quot;), die unter der Domain <Link href="/" className="text-primary-600 hover:underline">www.bereifung24.de</Link> erreichbar ist.
            </p>
            <p className="mb-3">Die Plattform wird betrieben von:</p>
            <div className="bg-gray-50 p-4 rounded-lg mb-3">
              <p className="font-semibold">Bereifung24</p>
              <p>Zdenek Kyzlink</p>
              <p>Jahnstra├ƒe 2</p>
              <p>71706 Markgr├Âningen</p>
              <p>Deutschland</p>
              <p>E-Mail: <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a></p>
              <p>Telefon: <a href="tel:+4971479679990" className="text-primary-600 hover:underline">+49 7147 9679990</a></p>
              <p>Umsatzsteuer-ID: DE354910030</p>
            </div>
            <p className="mb-3">Nachfolgend &quot;Betreiber&quot; genannt.</p>
            <p className="mb-3">
              Die Plattform vermittelt zwischen Kunden, die Reifen und Montagedienstleistungen suchen (nachfolgend &quot;Kunden&quot;), 
              und Werkst├ñtten, die diese Dienstleistungen anbieten (nachfolgend &quot;Werkst├ñtten&quot;).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Vertragssprache</h3>
            <p className="mb-3">
              Die f├╝r den Vertragsschluss zur Verf├╝gung stehende Sprache ist ausschlie├ƒlich Deutsch.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2 Mindestalter</h3>
            <p className="mb-3">
              Die Nutzung der Plattform ist nur vollj├ñhrigen Personen (ab 18 Jahren) gestattet. Mit der Registrierung best├ñtigt der Nutzer, dass er das 18. Lebensjahr vollendet hat.
            </p>
          </section>

          {/* 2. Vertragsgegenstand */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Vertragsgegenstand</h2>
            <p className="mb-3">Der Betreiber stellt eine Online-Plattform zur Verf├╝gung, ├╝ber die:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Kunden Anfragen f├╝r Reifen und Montagedienstleistungen erstellen k├Ânnen</li>
              <li>Werkst├ñtten passende Angebote auf Kundenanfragen abgeben k├Ânnen</li>
              <li>Kunden Angebote vergleichen und annehmen k├Ânnen</li>
              <li>Termine zwischen Kunden und Werkst├ñtten vereinbart werden k├Ânnen</li>
            </ul>
            <p className="mb-3">
              Der Betreiber tritt nicht als Vertragspartei f├╝r den Kauf von Reifen oder die Erbringung von 
              Montagedienstleistungen auf. Vertr├ñge ├╝ber Reifen und Dienstleistungen kommen ausschlie├ƒlich 
              zwischen Kunde und Werkstatt zustande.
            </p>
            <p className="mb-3">
              Der Betreiber ist ausschlie├ƒlich Vermittler und haftet nicht f├╝r die Erf├╝llung der zwischen 
              Kunde und Werkstatt geschlossenen Vertr├ñge.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.1 Preise und Angebote</h3>
            <p className="mb-3">
              Die auf der Plattform angezeigten Preise f├╝r Reifen und Montagedienstleistungen werden ausschlie├ƒlich von den Werkst├ñtten selbst erstellt und eingestellt. Der Betreiber gibt keine eigenen Preise vor und bezieht keine Preise von Drittanbietern.
            </p>
            <p className="mb-3">
              Der Betreiber ├╝bernimmt keine Gew├ñhr f├╝r die Richtigkeit, Aktualit├ñt oder Vollst├ñndigkeit der von Werkst├ñtten eingestellten Preise und Angebote. Die Werkst├ñtten sind f├╝r die Korrektheit ihrer Angebote allein verantwortlich.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.2 CO2-Fahrzeugdaten (falls zutreffend)</h3>
            <p className="mb-3">
              Soweit CO2-Emissionswerte von Fahrzeugen angezeigt werden, stammen diese aus ├Âffentlich zug├ñnglichen Datenbanken (z.B. Kraftfahrt-Bundesamt). Der Betreiber ├╝bernimmt keine Gew├ñhr f├╝r deren Richtigkeit, Aktualit├ñt oder Vollst├ñndigkeit. Die Angaben dienen ausschlie├ƒlich zu Informationszwecken.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">2.3 Speicherung des Vertragstextes</h3>
            <p className="mb-3">
              Der Vertragstext wird nach Vertragsschluss zwischen Kunde und Werkstatt gespeichert und ist f├╝r den Kunden in seinem Benutzerkonto einsehbar. Eine zus├ñtzliche Zusendung der Vertragsdetails erfolgt per E-Mail an die bei der Registrierung hinterlegte E-Mail-Adresse.
            </p>
          </section>

          {/* 3. Registrierung und Nutzerkonto */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Registrierung und Nutzerkonto</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.1 Kunden-Registrierung</h3>
            <p className="mb-3">
              Die Registrierung und Nutzung der Plattform ist f├╝r Kunden kostenlos. Bei der Registrierung 
              sind wahrheitsgem├ñ├ƒe und vollst├ñndige Angaben zu machen. Der Kunde ist verpflichtet, seine Daten stets aktuell zu halten.
            </p>
            <p className="mb-3">Kunden k├Ânnen sich mit folgenden Daten registrieren:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Vor- und Nachname</li>
              <li>E-Mail-Adresse</li>
              <li>Telefonnummer (optional)</li>
              <li>Passwort</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.2 Werkstatt-Registrierung</h3>
            <p className="mb-3">
              Werkst├ñtten k├Ânnen sich auf der Plattform registrieren. Die Registrierung ist kostenlos. 
              Nach der Registrierung pr├╝ft der Betreiber die Angaben der Werkstatt. Die Freischaltung 
              erfolgt nach erfolgreicher Pr├╝fung.
            </p>
            <p className="mb-3">Werkst├ñtten m├╝ssen bei der Registrierung vollst├ñndige und wahrheitsgem├ñ├ƒe Angaben machen, insbesondere zu:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Firmenname und vollst├ñndige Anschrift</li>
              <li>Kontaktdaten (E-Mail, Telefon)</li>
              <li>Gewerbeinformationen</li>
              <li>Bankverbindung f├╝r SEPA-Lastschriftverfahren</li>
            </ul>
            <p className="mb-3 font-semibold">Verifizierung:</p>
            <p className="mb-3">
              Die Verifizierung der Werkstatt erfolgt durch den Betreiber. Der Betreiber pr├╝ft die Angaben und kann zus├ñtzliche Nachweise anfordern. Die Art und der Umfang der Verifizierung liegen im Ermessen des Betreibers.
            </p>
            <p className="mb-3">
              Die Freischaltung erfolgt in der Regel innerhalb von 3 Werktagen nach erfolgreicher Verifizierung. Der Betreiber beh├ñlt sich vor, Registrierungen ohne Angabe von Gr├╝nden abzulehnen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.3 Zugangsdaten</h3>
            <p className="mb-3">
              Der Nutzer ist verpflichtet, seine Zugangsdaten (E-Mail und Passwort) geheim zu halten und 
              vor dem Zugriff durch Dritte zu sch├╝tzen. Bei Verdacht auf Missbrauch ist der Betreiber 
              unverz├╝glich per E-Mail zu informieren.
            </p>
            <p className="mb-3">
              Der Nutzer haftet f├╝r alle Aktivit├ñten, die unter Verwendung seiner Zugangsdaten vorgenommen werden, es sei denn, er hat den Missbrauch nicht zu vertreten.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">3.4 Verbot von Mehrfach-Accounts</h3>
            <p className="mb-3">
              Jedem Nutzer (nat├╝rliche oder juristische Person) ist nur ein Account gestattet. Die Registrierung mehrerer Accounts durch eine Person oder Firma ist untersagt und f├╝hrt zur Sperrung aller betroffenen Accounts.
            </p>
          </section>

          {/* 4. Nutzung der Plattform */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Nutzung der Plattform</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.1 Anfragen durch Kunden</h3>
            <p className="mb-3">
              Kunden k├Ânnen ├╝ber die Plattform Anfragen f├╝r Reifen und Montagedienstleistungen erstellen. 
              Die Anfragen sind unverbindlich und stellen kein Angebot im rechtlichen Sinne dar.
            </p>
            <p className="mb-3">Der Kunde verpflichtet sich, vollst├ñndige und korrekte Angaben zu machen, insbesondere zu:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Reifentyp und Dimensionen</li>
              <li>Fahrzeugdaten (Marke, Modell, HSN/TSN)</li>
              <li>Gew├╝nschtem Liefertermin bzw. Montagetermin</li>
              <li>Standort / PLZ</li>
              <li>Kontaktdaten</li>
            </ul>
            <p className="mb-3 font-semibold">G├╝ltigkeit von Anfragen:</p>
            <p className="mb-3">
              Bei Erstellung einer Anfrage legt der Kunde die G├╝ltigkeitsdauer selbst fest. Nach Ablauf dieser vom Kunden gew├ñhlten Frist wird die Anfrage automatisch archiviert und steht Werkst├ñtten nicht mehr zur Verf├╝gung.
            </p>
            <p className="mb-3 font-semibold">Datenverarbeitung:</p>
            <p className="mb-3">
              Mit Absenden der Anfrage erkl├ñrt sich der Kunde einverstanden, dass seine Kontaktdaten, Fahrzeugdaten und Anfrageinhalte an passende Werkst├ñtten in seiner Region weitergeleitet werden. Details zur Datenverarbeitung finden sich in der <Link href="/datenschutz" className="text-primary-600 hover:underline">Datenschutzerkl├ñrung</Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.2 Angebote durch Werkst├ñtten</h3>
            <p className="mb-3">
              Werkst├ñtten k├Ânnen auf Kundenanfragen Angebote abgeben. Die Angebote stellen verbindliche 
              Angebote im rechtlichen Sinne dar und sind f├╝r die angegebene G├╝ltigkeitsdauer bindend.
            </p>
            <p className="mb-3">
              Werkst├ñtten verpflichten sich, realistische und marktgerechte Preise anzugeben und die 
              angebotenen Leistungen im Falle einer Annahme zu erbringen.
            </p>
            <p className="mb-3 font-semibold">Bindungsfrist:</p>
            <p className="mb-3">
              Bei Abgabe eines Angebots legt die Werkstatt die Bindungsfrist selbst fest. Das Angebot ist f├╝r die von der Werkstatt angegebene G├╝ltigkeitsdauer bindend. Nach Ablauf der Bindungsfrist ist die Werkstatt berechtigt, das Angebot anzupassen oder zur├╝ckzuziehen.
            </p>
            <p className="mb-3 font-semibold">Preis├ñnderungen:</p>
            <p className="mb-3">
              ├ändern sich Reifenpreise beim Gro├ƒh├ñndler oder Hersteller zwischen Angebotsabgabe und geplantem Ausf├╝hrungszeitpunkt erheblich (mehr als 10%), ist die Werkstatt berechtigt, den Kunden hier├╝ber unverz├╝glich zu informieren und den Preis entsprechend anzupassen.
            </p>
            <p className="mb-3">
              In diesem Fall hat der Kunde das Recht, ohne Kosten vom Vertrag zur├╝ckzutreten.
            </p>
            <p className="mb-3">
              Die Werkstatt ist berechtigt, den Auftrag bei erheblichen Preis├ñnderungen zu stornieren, sofern sie den Kunden unverz├╝glich (innerhalb von 24 Stunden nach Kenntniserlangung) informiert.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">4.3 Vertragsschluss</h3>
            <p className="mb-3">
              Ein Vertrag ├╝ber Reifen und Montagedienstleistung kommt zustande, wenn der Kunde ein Angebot einer Werkstatt ├╝ber die Plattform annimmt. Mit der Annahme verpflichtet sich der Kunde zur Abnahme der Reifen und Inanspruchnahme der Montagedienstleistung zum vereinbarten Termin.
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
              Der Betreiber wird ├╝ber jeden Vertragsschluss automatisch informiert und erh├ñlt die f├╝r die Provisionsabrechnung erforderlichen Daten.
            </p>
            <p className="mb-3 font-semibold">Vertragsbest├ñtigung:</p>
            <p className="mb-3">
              Beide Parteien (Kunde und Werkstatt) erhalten nach Vertragsschluss eine automatische Best├ñtigungs-E-Mail mit allen relevanten Vertragsdaten:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Auftragsnummer</li>
              <li>Vereinbarter Termin</li>
              <li>Reifendetails und Menge</li>
              <li>Gesamtpreis (inkl. MwSt.)</li>
              <li>Kontaktdaten der Vertragspartner</li>
            </ul>
          </section>

          {/* 5. Widerrufsrecht f├╝r Verbraucher */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Widerrufsrecht f├╝r Verbraucher</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.1 Widerrufsbelehrung</h3>
            <div className="bg-blue-50 border-l-4 border-primary-600 p-4 mb-4">
              <p className="font-semibold mb-3">Widerrufsrecht</p>
              <p className="mb-3">
                Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gr├╝nden diesen Vertrag zu widerrufen.
              </p>
              <p className="mb-3">
                Die Widerrufsfrist betr├ñgt vierzehn Tage ab dem Tag des Vertragsschlusses.
              </p>
              <p className="mb-3">
                Um Ihr Widerrufsrecht auszu├╝ben, m├╝ssen Sie die Werkstatt (nicht den Betreiber der Plattform), mit der Sie den Vertrag geschlossen haben, mittels einer eindeutigen Erkl├ñrung (z. B. ein mit der Post versandter Brief oder E-Mail) ├╝ber Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
              </p>
              <p className="mb-3">
                Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung ├╝ber die Aus├╝bung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
              </p>
              <p className="font-semibold mb-3">Folgen des Widerrufs</p>
              <p>
                Wenn Sie diesen Vertrag widerrufen, hat die Werkstatt Ihnen alle Zahlungen, die sie von Ihnen erhalten hat, unverz├╝glich und sp├ñtestens binnen vierzehn Tagen ab dem Tag zur├╝ckzuzahlen, an dem die Mitteilung ├╝ber Ihren Widerruf dieses Vertrags bei der Werkstatt eingegangen ist.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.2 Muster-Widerrufsformular</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 font-mono text-sm">
              <p className="mb-2">Wenn Sie den Vertrag widerrufen wollen, k├Ânnen Sie dieses Formular verwenden:</p>
              <p className="mb-2">An:</p>
              <p className="mb-2">[Werkstattname]</p>
              <p className="mb-2">[Werkstattadresse]</p>
              <p className="mb-2">[E-Mail-Adresse der Werkstatt]</p>
              <p className="mb-4">ÔÇö</p>
              <p className="mb-2">Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag ├╝ber den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)</p>
              <p className="mb-2">ÔÇö Bestellt am (*)/erhalten am (*)</p>
              <p className="mb-2">ÔÇö Name des/der Verbraucher(s)</p>
              <p className="mb-2">ÔÇö Anschrift des/der Verbraucher(s)</p>
              <p className="mb-2">ÔÇö Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)</p>
              <p>ÔÇö Datum</p>
              <p className="mt-4 text-xs">(*) Unzutreffendes streichen</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.3 Erl├Âschen des Widerrufsrechts</h3>
            <p className="mb-3">
              Das Widerrufsrecht erlischt vorzeitig bei Vertr├ñgen zur Erbringung von Dienstleistungen, wenn die Werkstatt die Dienstleistung vollst├ñndig erbracht hat und mit der Ausf├╝hrung der Dienstleistung erst begonnen hat, nachdem der Verbraucher dazu seine ausdr├╝ckliche Zustimmung gegeben hat und gleichzeitig seine Kenntnis davon best├ñtigt hat, dass er sein Widerrufsrecht bei vollst├ñndiger Vertragserf├╝llung durch den Unternehmer verliert.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">5.4 Online-Streitbeilegung (OS-Plattform)</h3>
            <p className="mb-3">
              Die Europ├ñische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
            <p className="mb-3">
              Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir nicht verpflichtet und nicht bereit.
            </p>
          </section>

          {/* 6. Provisionen f├╝r Werkst├ñtten */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Provisionen f├╝r Werkst├ñtten</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.1 Provisionspflicht</h3>
            <p className="mb-3">
              F├╝r jeden ├╝ber die Plattform vermittelten und erfolgreich abgeschlossenen Auftrag zahlt die 
              Werkstatt eine Provision an den Betreiber.
            </p>
            <p className="mb-3">
              Die Provision betr├ñgt <strong>4,9% des Bruttoauftragswertes</strong> (Gesamtpreis f├╝r Reifen und 
              Montagedienstleistung inklusive Mehrwertsteuer).
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mb-3">
              <p className="font-semibold mb-2">Beispielrechnung:</p>
              <p>Bruttoauftragswert: 500,00 EUR</p>
              <p>Provision (4,9%): 24,50 EUR</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.2 F├ñlligkeit</h3>
            <p className="mb-3">Die Provision wird f├ñllig, sobald:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Der Kunde ein Angebot der Werkstatt ├╝ber die Plattform angenommen hat UND</li>
              <li>Der vereinbarte Termin stattgefunden hat UND</li>
              <li>Die Leistung erbracht wurde (Reifen montiert und Fahrzeug an Kunden ├╝bergeben)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.3 Zahlungsweise</h3>
            <p className="mb-3">
              Die Werkstatt erteilt dem Betreiber mit der Registrierung ein SEPA-Lastschriftmandat. Der Betreiber ist berechtigt, die f├ñllige Provision per SEPA-Lastschrift vom angegebenen Konto der Werkstatt einzuziehen.
            </p>
            <p className="mb-3 font-semibold">Einzugszeitpunkt:</p>
            <p className="mb-3">
              Der Einzug erfolgt monatlich zum 15. des Folgemonats f├╝r alle im Vormonat abgeschlossenen und abgerechneten Auftr├ñge.
            </p>
            <p className="mb-3">
              Die Werkstatt erh├ñlt vor jedem Einzug eine Provisionsabrechnung per E-Mail mit einer detaillierten Aufstellung aller abgerechneten Auftr├ñge.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.4 Stornierung und R├╝ckerstattung</h3>
            <p className="mb-3">
              Bei Stornierung eines Auftrags durch den Kunden oder Nichterscheinen des Kunden entf├ñllt die Provisionspflicht, sofern die Werkstatt dies unverz├╝glich ├╝ber die Plattform meldet.
            </p>
            <p className="mb-3">
              Wurde die Provision bereits eingezogen, erfolgt eine Gutschrift bzw. R├╝ckerstattung mit der n├ñchsten Abrechnung.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">6.5 Widerspruch gegen SEPA-Lastschrift</h3>
            <p className="mb-3">
              Die Werkstatt kann gegen eine SEPA-Lastschrift binnen 8 Wochen Widerspruch einlegen. Bei berechtigtem Widerspruch (z.B. fehlerhafte Abrechnung) wird die Provision korrigiert.
            </p>
            <p className="mb-3">
              Unberechtigte Widerspr├╝che k├Ânnen zur Sperrung des Werkstatt-Accounts f├╝hren. Die Werkstatt tr├ñgt die Kosten f├╝r unberechtigte R├╝cklastschriften.
            </p>
          </section>

          {/* 7. Zahlungsabwicklung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Zahlungsabwicklung zwischen Kunde und Werkstatt</h2>
            <p className="mb-3">
              Die Zahlung f├╝r Reifen und Montagedienstleistung erfolgt direkt zwischen Kunde und Werkstatt. 
              Der Betreiber ist nicht in die Zahlungsabwicklung involviert und tritt nicht als Zahlungsdienstleister auf.
            </p>
            <p className="mb-3">
              Verf├╝gbare Zahlungsoptionen werden von der Werkstatt festgelegt und k├Ânnen umfassen:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Barzahlung vor Ort</li>
              <li>EC-Karten-Zahlung vor Ort</li>
              <li>Kreditkarte (falls von Werkstatt angeboten)</li>
              <li>├£berweisung (Vorkasse oder Rechnung)</li>
              <li>PayPal (falls von Werkstatt angeboten)</li>
            </ul>
            <p className="mb-3">
              Der Betreiber ├╝bernimmt keine Haftung f├╝r die Zahlungsabwicklung zwischen Kunde und Werkstatt. Bei Zahlungsstreitigkeiten sind Kunde und Werkstatt selbst zur Kl├ñrung verpflichtet.
            </p>
          </section>

          {/* 8. Bewertungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Bewertungen und Rezensionen</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.1 Berechtigung zur Bewertung</h3>
            <p className="mb-3">
              Kunden k├Ânnen nach erfolgter Leistungserbringung Bewertungen f├╝r Werkst├ñtten abgeben. Nur Kunden, die nachweislich einen Termin ├╝ber die Plattform gebucht haben, k├Ânnen Bewertungen abgeben.
            </p>
            <p className="mb-3">
              Bewertungen k├Ânnen nur einmal pro Auftrag abgegeben werden und sind nach Ver├Âffentlichung nicht mehr bearbeitbar.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.2 Anforderungen an Bewertungen</h3>
            <p className="mb-3">
              Bewertungen m├╝ssen wahrheitsgem├ñ├ƒ sein und auf eigenen Erfahrungen beruhen. Sie d├╝rfen keine beleidigenden, diskriminierenden, rechtswidrigen oder anderweitig unangemessenen Inhalte enthalten.
            </p>
            <p className="mb-3">Verboten sind insbesondere:</p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Falsche Tatsachenbehauptungen</li>
              <li>Beleidigungen und pers├Ânliche Angriffe</li>
              <li>Rassistische, sexistische oder diskriminierende ├äu├ƒerungen</li>
              <li>Werbung f├╝r Drittanbieter</li>
              <li>Links zu externen Websites</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.3 Manipulation von Bewertungen</h3>
            <p className="mb-3">
              Die Manipulation von Bewertungen ist strengstens untersagt. Dies umfasst insbesondere:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Selbstbewertungen von Werkst├ñtten</li>
              <li>Bewertungen von Mitbewerbern durch Werkst├ñtten</li>
              <li>Gekaufte oder getauschte Bewertungen</li>
              <li>Mehrfachbewertungen durch denselben Nutzer</li>
            </ul>
            <p className="mb-3">
              Verst├Â├ƒe gegen das Manipulationsverbot f├╝hren zur sofortigen Sperrung des Accounts und k├Ânnen rechtliche Konsequenzen nach sich ziehen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">8.4 Moderation und L├Âschung</h3>
            <p className="mb-3">
              Der Betreiber beh├ñlt sich vor, Bewertungen zu pr├╝fen und rechtswidrige oder unangemessene Bewertungen ohne vorherige Ank├╝ndigung zu l├Âschen oder zu sperren.
            </p>
            <p className="mb-3">
              Werkst├ñtten k├Ânnen Bewertungen, die sie f├╝r rechtswidrig halten, beim Betreiber melden. Der Betreiber pr├╝ft den Sachverhalt und entscheidet nach eigenem Ermessen ├╝ber L├Âschung oder Beibehaltung.
            </p>
          </section>

          {/* 9. Haftung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Haftung</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.1 Haftung des Betreibers</h3>
            <p className="mb-3">
              Der Betreiber haftet unbeschr├ñnkt f├╝r Sch├ñden aus der Verletzung des Lebens, des K├Ârpers oder der Gesundheit sowie f├╝r sonstige Sch├ñden, die auf vors├ñtzlicher oder grob fahrl├ñssiger Pflichtverletzung des Betreibers, seiner gesetzlichen Vertreter oder Erf├╝llungsgehilfen beruhen.
            </p>
            <p className="mb-3">
              F├╝r sonstige Sch├ñden haftet der Betreiber nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden begrenzt.
            </p>
            <p className="mb-3">
              Der Betreiber haftet insbesondere nicht f├╝r:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Die Qualit├ñt, Verf├╝gbarkeit oder Eignung der von Werkst├ñtten angebotenen Reifen und Dienstleistungen</li>
              <li>Die Erf├╝llung der zwischen Kunde und Werkstatt geschlossenen Vertr├ñge</li>
              <li>Sch├ñden, die durch falsche oder unvollst├ñndige Angaben von Nutzern entstehen</li>
              <li>Ausfallzeiten der Plattform aufgrund h├Âherer Gewalt, technischer St├Ârungen oder Wartungsarbeiten</li>
              <li>Datenverlust, soweit dieser nicht durch fehlende Backup-M├Âglichkeiten des Betreibers verursacht wurde</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.2 Haftung der Werkst├ñtten</h3>
            <p className="mb-3">
              Die Werkstatt haftet gegen├╝ber dem Kunden f├╝r die ordnungsgem├ñ├ƒe Erf├╝llung des zwischen ihnen geschlossenen Vertrages nach den gesetzlichen Bestimmungen. Dies umfasst insbesondere:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Sachgem├ñ├ƒe Montage der Reifen</li>
              <li>Verwendung geeigneter und fehlerfreier Reifen</li>
              <li>Einhaltung vereinbarter Termine</li>
              <li>Fachgerechte Durchf├╝hrung aller Arbeiten</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">9.3 Haftung f├╝r fremde Inhalte</h3>
            <p className="mb-3">
              Der Betreiber ├╝bernimmt keine Haftung f├╝r fremde Inhalte (Angebote, Bewertungen, Beschreibungen etc.), die von Nutzern auf der Plattform eingestellt werden. Der Betreiber pr├╝ft fremde Inhalte nicht vollst├ñndig und ├╝bernimmt keine Gew├ñhr f├╝r deren Richtigkeit, Vollst├ñndigkeit oder Rechtm├ñ├ƒigkeit.
            </p>
            <p className="mb-3">
              Der Betreiber entfernt rechtswidrige Inhalte unverz├╝glich nach Kenntniserlangung. Nutzer k├Ânnen rechtswidrige Inhalte ├╝ber die Melde-Funktion anzeigen.
            </p>
          </section>

          {/* 10. Datenschutz */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Datenschutz</h2>
            <p className="mb-3">
              Der Betreiber erhebt, verarbeitet und nutzt personenbezogene Daten der Nutzer nur im Rahmen der geltenden Datenschutzgesetze, insbesondere der Datenschutz-Grundverordnung (DSGVO) und des Bundesdatenschutzgesetzes (BDSG).
            </p>
            <p className="mb-3">
              N├ñhere Informationen zum Datenschutz, zur Art, zum Umfang und zum Zweck der Datenerhebung sowie zu den Rechten der Nutzer finden Sie in unserer{' '}
              <Link href="/datenschutz" className="text-primary-600 hover:underline">
                Datenschutzerkl├ñrung
              </Link>.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.1 Betroffenenrechte</h3>
            <p className="mb-3">
              Nutzer haben gem├ñ├ƒ DSGVO folgende Rechte gegen├╝ber dem Betreiber:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li><strong>Art. 15 DSGVO:</strong> Recht auf Auskunft ├╝ber die gespeicherten personenbezogenen Daten</li>
              <li><strong>Art. 16 DSGVO:</strong> Recht auf Berichtigung unrichtiger Daten</li>
              <li><strong>Art. 17 DSGVO:</strong> Recht auf L├Âschung (&quot;Recht auf Vergessenwerden&quot;)</li>
              <li><strong>Art. 18 DSGVO:</strong> Recht auf Einschr├ñnkung der Verarbeitung</li>
              <li><strong>Art. 20 DSGVO:</strong> Recht auf Daten├╝bertragbarkeit</li>
              <li><strong>Art. 21 DSGVO:</strong> Widerspruchsrecht gegen die Verarbeitung</li>
            </ul>
            <p className="mb-3">
              Zur Aus├╝bung dieser Rechte k├Ânnen Nutzer sich jederzeit per E-Mail an <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a> wenden.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">10.2 Beschwerderecht</h3>
            <p className="mb-3">
              Nutzer haben das Recht, sich bei einer Datenschutz-Aufsichtsbeh├Ârde ├╝ber die Verarbeitung ihrer personenbezogenen Daten durch den Betreiber zu beschweren.
            </p>
            <p className="mb-3">
              Zust├ñndige Aufsichtsbeh├Ârde f├╝r Baden-W├╝rttemberg ist der Landesbeauftragte f├╝r den Datenschutz und die Informationsfreiheit Baden-W├╝rttemberg.
            </p>
          </section>

          {/* 11. Immaterialg├╝terrechte */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Immaterialg├╝terrechte / Geistiges Eigentum</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.1 Urheberrechte</h3>
            <p className="mb-3">
              Alle Inhalte der Plattform (Texte, Grafiken, Logos, Bilder, Videos, Software, Datenbanken, Design, Struktur etc.) sind urheberrechtlich gesch├╝tzt und Eigentum des Betreibers oder seiner Lizenzgeber.
            </p>
            <p className="mb-3">
              Die Nutzung der Plattform berechtigt nicht zur Vervielf├ñltigung, Verbreitung, Ver├ñnderung oder sonstigen Nutzung der Inhalte ohne ausdr├╝ckliche schriftliche Zustimmung des Betreibers.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.2 Markenrechte</h3>
            <p className="mb-3">
              Die Marke &quot;Bereifung24&quot;, das Logo und sonstige Kennzeichen sind Eigentum des Betreibers und d├╝rfen ohne ausdr├╝ckliche Genehmigung nicht verwendet werden.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">11.3 Verbot von Scraping und Crawling</h3>
            <p className="mb-3">
              Das automatisierte Auslesen (Scraping, Crawling) von Daten der Plattform ist untersagt. Dies umfasst insbesondere:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Automatisches Auslesen von Angeboten, Preisen oder Kontaktdaten</li>
              <li>Systematisches Herunterladen von Inhalten mittels Bots oder Skripten</li>
              <li>Nutzung der Daten f├╝r eigene Zwecke oder Weiterverkauf</li>
            </ul>
            <p className="mb-3">
              Verst├Â├ƒe gegen das Scraping-Verbot k├Ânnen zivilrechtlich und strafrechtlich verfolgt werden.
            </p>
          </section>

          {/* 12. Verf├╝gbarkeit und technische St├Ârungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Verf├╝gbarkeit und technische St├Ârungen</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.1 Verf├╝gbarkeit</h3>
            <p className="mb-3">
              Der Betreiber bem├╝ht sich um eine m├Âglichst hohe Verf├╝gbarkeit der Plattform (angestrebt: 99% im Jahresmittel). Eine Verf├╝gbarkeit von 100% kann jedoch technisch nicht garantiert werden.
            </p>
            <p className="mb-3">
              Der Betreiber ist berechtigt, die Plattform zeitweise vom Netz zu nehmen, um Wartungsarbeiten, Updates oder Sicherheitsma├ƒnahmen durchzuf├╝hren. Solche Arbeiten werden nach M├Âglichkeit au├ƒerhalb der Gesch├ñftszeiten durchgef├╝hrt.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.2 Technische St├Ârungen</h3>
            <p className="mb-3">
              Bei technischen St├Ârungen oder Ausf├ñllen bem├╝ht sich der Betreiber um schnellstm├Âgliche Behebung. Eine Haftung f├╝r Sch├ñden durch Ausf├ñlle besteht nur im Rahmen von Ziffer 9 (Haftung).
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">12.3 H├Âhere Gewalt</h3>
            <p className="mb-3">
              Der Betreiber haftet nicht f├╝r Ausf├ñlle oder St├Ârungen, die durch h├Âhere Gewalt, Streik, Aussperrung, beh├Ârdliche Ma├ƒnahmen, Energieausf├ñlle, Ausfall von Telekommunikationsverbindungen oder vergleichbare Umst├ñnde verursacht werden.
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
              <li>Kontaktdaten anderer Nutzer (Kunden und Werkst├ñtten)</li>
              <li>Preise und Kalkulationen von Werkst├ñtten</li>
              <li>Gesch├ñftsinterna und Betriebsgeheimnisse</li>
              <li>Nicht ├Âffentlich zug├ñngliche Informationen ├╝ber die Plattform</li>
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
              Nutzer k├Ânnen sich f├╝r den Newsletter der Plattform anmelden, um Informationen ├╝ber neue Funktionen, Angebote und Updates zu erhalten.
            </p>
            <p className="mb-3">
              Die Anmeldung erfolgt im Double-Opt-In-Verfahren: Nach Eingabe der E-Mail-Adresse erh├ñlt der Nutzer eine Best├ñtigungs-E-Mail mit einem Aktivierungslink. Erst nach Klick auf diesen Link ist die Anmeldung abgeschlossen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14.2 Abmeldung</h3>
            <p className="mb-3">
              Die Einwilligung zur Newsletter-Zusendung kann jederzeit widerrufen werden. Jeder Newsletter enth├ñlt einen Abmelde-Link. Alternativ kann die Abmeldung per E-Mail an <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a> erfolgen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">14.3 Funktionale E-Mails</h3>
            <p className="mb-3">
              Unabh├ñngig von der Newsletter-Anmeldung erhalten Nutzer funktionale E-Mails im Zusammenhang mit der Nutzung der Plattform (Registrierungsbest├ñtigung, Angebots-Benachrichtigungen, Termin-Erinnerungen etc.). Diese E-Mails sind f├╝r den Betrieb der Plattform erforderlich und k├Ânnen nicht abbestellt werden.
            </p>
          </section>

          {/* 15. Sperrung, K├╝ndigung und L├Âschung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Sperrung, K├╝ndigung und L├Âschung</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.1 K├╝ndigung durch den Nutzer</h3>
            <p className="mb-3">
              Nutzer k├Ânnen ihr Konto jederzeit ohne Angabe von Gr├╝nden k├╝ndigen. Die K├╝ndigung erfolgt ├╝ber die Einstellungen im Benutzerkonto oder per E-Mail an <a href="mailto:info@bereifung24.de" className="text-primary-600 hover:underline">info@bereifung24.de</a>.
            </p>
            <p className="mb-3">
              Die K├╝ndigung wird innerhalb von 7 Tagen wirksam. Bis dahin k├Ânnen noch laufende Auftr├ñge abgeschlossen werden.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.2 Sperrung durch den Betreiber</h3>
            <p className="mb-3">
              Der Betreiber kann Nutzerkonten bei Verst├Â├ƒen gegen diese AGB sperren oder l├Âschen, insbesondere bei:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Falschen oder unvollst├ñndigen Angaben bei der Registrierung</li>
              <li>Missbr├ñuchlicher Nutzung der Plattform</li>
              <li>Wiederholtem Nichterscheinen zu vereinbarten Terminen (Kunden)</li>
              <li>Wiederholter Nichterf├╝llung angenommener Angebote (Werkst├ñtten)</li>
              <li>Rechtswidrigem Verhalten (Beleidigungen, Drohungen, Betrug etc.)</li>
              <li>Zahlungsverzug bei Provisionen (Werkst├ñtten)</li>
              <li>Manipulation von Bewertungen</li>
              <li>Scraping oder unbefugtem Datenauslesen</li>
            </ul>
            <p className="mb-3">
              Vor einer Sperrung wird der Betreiber den Nutzer in der Regel abmahnen und zur Stellungnahme auffordern, sofern nicht ein schwerwiegender Versto├ƒ vorliegt, der eine sofortige Sperrung rechtfertigt.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.3 Folgen der K├╝ndigung</h3>
            <p className="mb-3">
              Bei K├╝ndigung oder Sperrung werden bereits vereinbarte Termine zwischen Kunde und Werkstatt nicht ber├╝hrt und sind weiterhin zu erf├╝llen.
            </p>
            <p className="mb-3">
              Provisionsanspr├╝che des Betreibers f├╝r bereits vermittelte Auftr├ñge bleiben auch nach K├╝ndigung bestehen.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">15.4 Datenl├Âschung</h3>
            <p className="mb-3">
              Nach K├╝ndigung oder Sperrung werden personenbezogene Daten des Nutzers gel├Âscht, soweit keine gesetzlichen Aufbewahrungspflichten bestehen.
            </p>
            <p className="mb-3">
              Buchhalterische Unterlagen (Provisionsabrechnungen, Rechnungen etc.) werden gem├ñ├ƒ den gesetzlichen Aufbewahrungsfristen (in der Regel 10 Jahre) aufbewahrt.
            </p>
            <p className="mb-3">
              Bewertungen bleiben auch nach L├Âschung des Nutzerkontos auf der Plattform sichtbar, werden jedoch anonymisiert (Anzeige als &quot;Ehemaliger Nutzer&quot;).
            </p>
          </section>

          {/* 16. Abtretung von Rechten und Pflichten */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Abtretung von Rechten und Pflichten</h2>
            <p className="mb-3">
              Die Abtretung von Rechten und Pflichten aus diesen AGB an Dritte bedarf der vorherigen schriftlichen Zustimmung des Betreibers.
            </p>
            <p className="mb-3">
              Der Betreiber ist berechtigt, seine Rechte und Pflichten aus diesen AGB ganz oder teilweise an Dritte abzutreten, insbesondere im Falle einer Unternehmensver├ñu├ƒerung oder -umstrukturierung. Nutzer werden ├╝ber eine solche Abtretung rechtzeitig informiert.
            </p>
          </section>

          {/* 17. ├änderung der AGB */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. ├änderung der AGB</h2>
            <p className="mb-3">
              Der Betreiber beh├ñlt sich vor, diese AGB jederzeit zu ├ñndern, sofern dies f├╝r den Nutzer zumutbar ist.
            </p>
            <p className="mb-3">
              ├änderungen k├Ânnen insbesondere erforderlich werden aufgrund:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-3">
              <li>Gesetzlicher oder beh├Ârdlicher Vorgaben</li>
              <li>Technischer Weiterentwicklungen der Plattform</li>
              <li>Neuer Funktionen oder Dienstleistungen</li>
              <li>├änderungen im Gesch├ñftsmodell</li>
              <li>Anpassung an Marktbedingungen</li>
            </ul>
            <p className="mb-3">
              Nutzer werden ├╝ber ├änderungen mindestens 4 Wochen vor Inkrafttreten per E-Mail an die im Benutzerkonto hinterlegte E-Mail-Adresse informiert.
            </p>
            <p className="mb-3">
              Widerspricht der Nutzer der ├änderung nicht innerhalb von 4 Wochen nach Zugang der ├änderungsmitteilung, gelten die ge├ñnderten AGB als angenommen. Der Betreiber wird in der ├änderungsmitteilung auf diese Rechtsfolge und das Widerspruchsrecht gesondert hinweisen.
            </p>
            <p className="mb-3">
              Widerspricht der Nutzer fristgerecht, ist der Betreiber berechtigt, das Nutzungsverh├ñltnis mit einer Frist von 4 Wochen zu k├╝ndigen.
            </p>
          </section>

          {/* 18. Schlussbestimmungen */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Schlussbestimmungen</h2>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.1 Anwendbares Recht</h3>
            <p className="mb-3">
              F├╝r diese AGB und alle Rechtsbeziehungen zwischen dem Betreiber und den Nutzern gilt ausschlie├ƒlich das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG).
            </p>
            <p className="mb-3">
              Bei Verbrauchern gilt diese Rechtswahl nur, soweit dadurch keine zwingenden gesetzlichen Bestimmungen des Staates eingeschr├ñnkt werden, in dem der Verbraucher seinen gew├Âhnlichen Aufenthalt hat.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.2 Gerichtsstand</h3>
            <p className="mb-3">
              Gerichtsstand f├╝r alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist <strong>Ludwigsburg</strong>, sofern der Nutzer Kaufmann, juristische Person des ├Âffentlichen Rechts oder ├Âffentlich-rechtliches Sonderverm├Âgen ist.
            </p>
            <p className="mb-3">
              F├╝r Verbraucher gilt der gesetzliche Gerichtsstand.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.3 Salvatorische Klausel</h3>
            <p className="mb-3">
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der ├╝brigen Bestimmungen davon unber├╝hrt.
            </p>
            <p className="mb-3">
              An die Stelle der unwirksamen Bestimmung tritt eine angemessene Regelung, die dem wirtschaftlichen Zweck und der Interessenlage der unwirksamen Bestimmung am n├ñchsten kommt. Gleiches gilt f├╝r eventuelle Regelungsl├╝cken.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">18.4 Schriftformerfordernis</h3>
            <p className="mb-3">
              ├änderungen oder Erg├ñnzungen dieser AGB bed├╝rfen der Schriftform. Dies gilt auch f├╝r die Aufhebung dieses Schriftformerfordernisses.
            </p>
            <p className="mb-3">
              E-Mail gen├╝gt zur Wahrung der Schriftform, sofern sie eine qualifizierte elektronische Signatur enth├ñlt oder eine Textform-Vereinbarung getroffen wurde.
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
              <p>Jahnstra├ƒe 2</p>
              <p>71706 Markgr├Âningen</p>
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
            ÔåÉ Zur├╝ck zur Startseite
          </Link>
          <Link 
            href="/datenschutz"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Datenschutzerkl├ñrung ÔåÆ
          </Link>
        </div>
      </div>
    </div>
  )
}
