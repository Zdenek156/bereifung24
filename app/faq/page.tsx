'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const categories = [
  {
    id: 'bestellung',
    label: 'Bestellung & Buchung',
    icon: '🛒',
    color: 'blue',
    questions: [
      {
        q: 'Wie funktioniert eine Buchung bei Bereifung24?',
        a: 'Ganz einfach in 4 Schritten: 1) Wähle deine Reifengröße oder den gewünschten Service aus. 2) Finde eine Werkstatt in deiner Nähe über unsere Umkreissuche. 3) Wähle einen freien Termin im Kalender der Werkstatt. 4) Bezahle bequem online – fertig! Du erhältst sofort eine Bestätigung per E-Mail.'
      },
      {
        q: 'Kann ich eigene Reifen mitbringen?',
        a: 'Ja! Wähle bei der Buchung einfach die Option „Nur Montage" – du zahlst dann nur den Montage-Service und bringst deine eigenen Reifen zur Werkstatt mit.'
      },
      {
        q: 'Ist die Montage im Preis inbegriffen?',
        a: 'Ja, wenn du Reifen über uns bestellst, ist im angezeigten Preis bereits Reifen, Montage und Wuchten enthalten. Die Altreifenentsorgung ist nicht im Preis inbegriffen und kann bei Bedarf separat dazugebucht werden.'
      },
      {
        q: 'Wie finde ich die passende Reifengröße?',
        a: 'Deine Reifengröße findest du an der Seitenwand deines aktuellen Reifens (z.B. 205/55 R16). In deinem Kundenkonto kannst du dein Fahrzeug in der Fahrzeugverwaltung hinterlegen – so wird deine Reifengröße gespeichert und bei künftigen Buchungen automatisch vorgeschlagen.'
      },
      {
        q: 'Kann ich meinen Termin ändern oder stornieren?',
        a: 'Eine Stornierung oder Änderung läuft über die Werkstatt, da bei der Buchung bereits Leistungen durch die Werkstatt erbracht werden können. Kontaktiere die Werkstatt direkt über dein Kundenkonto, um den Termin zu ändern oder zu stornieren.'
      },
      {
        q: 'Welche Services bieten die Werkstätten an?',
        a: 'Das hängt von der jeweiligen Werkstatt ab. Typische Services sind: Reifenwechsel (Sommer/Winter), Reifenmontage mit Wuchten, Einlagerung, Achsvermessung, Altreifenentsorgung und weitere Kfz-Dienstleistungen. Die verfügbaren Services werden dir bei der Werkstattauswahl angezeigt.'
      },
    ]
  },
  {
    id: 'bezahlung',
    label: 'Bezahlung & Preise',
    icon: '💳',
    color: 'green',
    questions: [
      {
        q: 'Welche Zahlungsmethoden werden akzeptiert?',
        a: 'Kreditkarte (Visa, Mastercard), PayPal, Google Pay, Apple Pay und Klarna (Rechnung/Ratenzahlung). Alle Zahlungen werden sicher über unseren Zahlungsdienstleister Stripe abgewickelt.'
      },
      {
        q: 'Wann wird der Betrag abgebucht?',
        a: 'Der Betrag wird direkt bei der Buchung abgebucht. So ist dein Termin verbindlich reserviert und du musst vor Ort nichts mehr bezahlen.'
      },
      {
        q: 'Kann ich auf Rechnung bezahlen?',
        a: 'Ja, über Klarna kannst du auf Rechnung bezahlen oder eine Ratenzahlung wählen. Die Option wird dir beim Bezahlvorgang automatisch angeboten.'
      },
      {
        q: 'Sind die angezeigten Preise Endpreise?',
        a: 'Ja, alle angezeigten Preise sind Bruttopreise inklusive Mehrwertsteuer. Bei Reifenbestellungen über uns ist Montage und Wuchten bereits enthalten. Zusätzliche Services wie Altreifenentsorgung können separat dazugebucht werden und werden transparent angezeigt.'
      },
      {
        q: 'Wie erhalte ich eine Rechnung?',
        a: 'Die Rechnung wird von der Werkstatt nach abgeschlossenem Service in dein Kundenkonto hochgeladen. Falls die Rechnung nicht vorliegt, kannst du über den Button „Rechnung anfordern" die Werkstatt darauf hinweisen.'
      },
      {
        q: 'Was passiert bei einer Stornierung mit meiner Zahlung?',
        a: 'Da bei der Buchung bereits Kosten bei der Werkstatt entstehen können, wird die Erstattung direkt durch die Werkstatt geregelt. Kontaktiere die Werkstatt über dein Kundenkonto für die Rückabwicklung.'
      },
    ]
  },
  {
    id: 'werkstatt',
    label: 'Werkstatt & Service',
    icon: '🔧',
    color: 'orange',
    questions: [
      {
        q: 'Wie werden die Werkstätten ausgewählt?',
        a: 'Alle Werkstätten auf Bereifung24 durchlaufen einen Verifizierungsprozess. Wir prüfen die Qualifikation und stellen sicher, dass professionell gearbeitet wird. Zusätzlich kannst du Bewertungen anderer Kunden einsehen.'
      },
      {
        q: 'Kann ich eine bestimmte Werkstatt auswählen?',
        a: 'Ja! Über unsere Umkreissuche siehst du alle verfügbaren Werkstätten in deiner Nähe mit Entfernung, Bewertungen, Preisen und freien Terminen. Du entscheidest, welche Werkstatt am besten zu dir passt.'
      },
      {
        q: 'Was passiert, wenn die Werkstatt den Termin nicht einhalten kann?',
        a: 'Die Werkstatt kann den Termin stornieren oder verschieben. Du wirst umgehend per E-Mail informiert. Bei einer Stornierung durch die Werkstatt muss diese die bereits gezahlten Kosten erstatten.'
      },
      {
        q: 'Wie kann ich eine Werkstatt bewerten?',
        a: 'Nach Abschluss deines Termins erhältst du eine E-Mail mit der Möglichkeit, die Werkstatt zu bewerten. Dein Feedback hilft anderen Kunden und den Werkstätten, ihren Service zu verbessern.'
      },
      {
        q: 'Kann ich auch ohne Reifenkauf einen Montage-Termin buchen?',
        a: 'Ja, wähle einfach die Option „Nur Montage" bei der Buchung – du zahlst dann nur den Montage-Service und bringst deine eigenen Reifen mit.'
      },
    ]
  },
  {
    id: 'konto',
    label: 'Konto & Persönliches',
    icon: '👤',
    color: 'purple',
    questions: [
      {
        q: 'Muss ich ein Konto erstellen, um zu buchen?',
        a: 'Ja, für eine Buchung ist ein kostenloses Kundenkonto erforderlich. So kannst du deine Buchungen verwalten, Fahrzeuge hinterlegen und Rechnungen jederzeit einsehen.'
      },
      {
        q: 'Wie kann ich mein Passwort zurücksetzen?',
        a: 'Klicke auf der Anmeldeseite auf „Passwort vergessen". Du erhältst dann eine E-Mail mit einem Link zum Zurücksetzen deines Passworts.'
      },
      {
        q: 'Wie kann ich mein Konto löschen?',
        a: 'Du kannst die Löschung deines Kontos über die Kontoeinstellungen beantragen oder uns per E-Mail kontaktieren. Offene Buchungen müssen vorher abgeschlossen werden.'
      },
      {
        q: 'Werden meine Daten sicher gespeichert?',
        a: 'Ja, der Schutz deiner Daten hat für uns höchste Priorität. Wir speichern deine Daten DSGVO-konform auf Servern in Deutschland. Zahlungsdaten werden ausschließlich von unserem zertifizierten Zahlungsdienstleister Stripe verarbeitet – wir haben keinen Zugriff auf deine Kreditkartendaten.'
      },
    ]
  },
  {
    id: 'reifen',
    label: 'Reifen & Wissen',
    icon: '🚗',
    color: 'red',
    questions: [
      {
        q: 'Wann sollte ich auf Winterreifen wechseln?',
        a: 'Die Faustregel lautet „von O bis O" – von Oktober bis Ostern. Sobald die Temperaturen dauerhaft unter 7°C fallen, bieten Winterreifen deutlich besseren Grip. In Deutschland gilt eine situative Winterreifenpflicht bei winterlichen Straßenverhältnissen.'
      },
      {
        q: 'Sind Ganzjahresreifen eine gute Alternative?',
        a: 'Ganzjahresreifen sind ein Kompromiss und eignen sich gut für Fahrer mit geringer Jahreskilometerleistung in Regionen mit milden Wintern. Bei starkem Schneefall oder extremer Hitze sind spezialisierte Sommer-/Winterreifen jedoch überlegen.'
      },
      {
        q: 'Was bedeutet das EU-Reifenlabel?',
        a: 'Das EU-Reifenlabel zeigt dir auf einen Blick drei wichtige Eigenschaften: Kraftstoffeffizienz (A bis E), Nasshaftung (A bis E) und das Abrollgeräusch in Dezibel. Bei Bereifung24 zeigen wir dir diese Werte direkt bei der Reifenauswahl an.'
      },
      {
        q: 'Wie alt dürfen Reifen maximal sein?',
        a: 'Experten empfehlen, Reifen nach spätestens 6 Jahren zu ersetzen, auch wenn das Profil noch ausreichend ist. Das Alter erkennst du an der DOT-Nummer auf der Reifenseite (z.B. DOT 2320 = produziert in der 23. Kalenderwoche 2020).'
      },
      {
        q: 'Wie tief muss das Reifenprofil mindestens sein?',
        a: 'Gesetzlich vorgeschrieben sind mindestens 1,6 mm Profiltiefe. Der ADAC empfiehlt jedoch mindestens 3 mm bei Sommerreifen und 4 mm bei Winterreifen für optimale Sicherheit.'
      },
    ]
  },
  {
    id: 'hilfe',
    label: 'Probleme & Hilfe',
    icon: '🆘',
    color: 'rose',
    questions: [
      {
        q: 'Mein Termin wird nicht im Konto angezeigt – was tun?',
        a: 'Prüfe zunächst deinen E-Mail-Posteingang (auch den Spam-Ordner) auf eine Buchungsbestätigung. Versuche dich neu anzumelden. Sollte das Problem bestehen, kontaktiere unseren Support.'
      },
      {
        q: 'Ich habe keine Bestätigungsmail erhalten.',
        a: 'Bitte prüfe deinen Spam-/Junk-Ordner. Falls du dort nichts findest, überprüfe ob du die richtige E-Mail-Adresse angegeben hast. Die Bestätigung findest du auch in deinem Kundenkonto unter „Meine Buchungen".'
      },
      {
        q: 'Wie erreiche ich den Kundenservice?',
        a: 'Du erreichst uns per E-Mail unter support@bereifung24.de. Wir antworten in der Regel innerhalb von 24 Stunden.'
      },
      {
        q: 'Ich bin mit dem Service der Werkstatt unzufrieden – was kann ich tun?',
        a: 'Bewerte die Werkstatt über unser Bewertungssystem und schildere das Problem. Kontaktiere zusätzlich unseren Support – wir nehmen jede Beschwerde ernst und vermitteln bei Bedarf zwischen dir und der Werkstatt.'
      },
      {
        q: 'Was passiert bei Schäden während des Reifenwechsels?',
        a: 'Alle Werkstätten auf unserer Plattform sind entsprechend versichert. Sollte ein Schaden auftreten, melde diesen bitte umgehend bei der Werkstatt und kontaktiere unseren Support. Wir unterstützen dich bei der Klärung.'
      },
    ]
  },
]

const colorMap: Record<string, { tab: string; badge: string; icon: string; dot: string }> = {
  blue:   { tab: 'bg-blue-600 text-white',   badge: 'bg-blue-50 text-blue-700 border-blue-200',   icon: 'bg-blue-100',   dot: 'bg-blue-500' },
  green:  { tab: 'bg-green-600 text-white',  badge: 'bg-green-50 text-green-700 border-green-200', icon: 'bg-green-100',  dot: 'bg-green-500' },
  orange: { tab: 'bg-orange-500 text-white', badge: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'bg-orange-100', dot: 'bg-orange-500' },
  purple: { tab: 'bg-purple-600 text-white', badge: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'bg-purple-100', dot: 'bg-purple-500' },
  red:    { tab: 'bg-red-600 text-white',    badge: 'bg-red-50 text-red-700 border-red-200',       icon: 'bg-red-100',    dot: 'bg-red-500' },
  rose:   { tab: 'bg-rose-600 text-white',   badge: 'bg-rose-50 text-rose-700 border-rose-200',    icon: 'bg-rose-100',   dot: 'bg-rose-500' },
}

function AccordionItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden transition-shadow ${open ? 'shadow-md' : 'hover:shadow-sm'}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-400 w-6 shrink-0">{index}</span>
        <span className="flex-1 font-medium text-gray-900 text-base leading-snug">{q}</span>
        <svg
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-5 pt-1 bg-white border-t border-gray-100">
          <p className="text-gray-600 leading-relaxed pl-10">{a}</p>
        </div>
      )}
    </div>
  )
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase()
    return categories.map(cat => ({
      ...cat,
      questions: cat.questions.filter(
        item => !q || item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      )
    })).filter(cat => {
      if (activeCategory && cat.id !== activeCategory) return false
      return cat.questions.length > 0
    })
  }, [search, activeCategory])

  const totalQuestions = categories.reduce((acc, c) => acc + c.questions.length, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Zurück zur Startseite
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Häufig gestellte Fragen</h1>
              <p className="mt-2 text-gray-500 text-lg">{totalQuestions} Antworten in {categories.length} Kategorien · Stand: März 2026</p>
            </div>
          </div>
          {/* Search */}
          <div className="relative max-w-xl">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Fragen durchsuchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        </div>
        {/* Category Tabs */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-0 scrollbar-hide">
            <button
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 px-4 py-2.5 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${
                activeCategory === null
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Alle ({totalQuestions})
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${
                  activeCategory === cat.id
                    ? `border-current ${colorMap[cat.color].tab} border-b-2 !border-b-transparent bg-opacity-10`
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                  activeCategory === cat.id ? 'bg-white bg-opacity-30' : 'bg-gray-100 text-gray-500'
                }`}>{cat.questions.length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto space-y-12">
          {filteredCategories.length === 0 && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Keine Ergebnisse gefunden</h3>
              <p className="text-gray-500">Versuche einen anderen Suchbegriff oder <button onClick={() => setSearch('')} className="text-blue-600 hover:underline">setze die Suche zurück</button>.</p>
            </div>
          )}

          {filteredCategories.map(cat => {
            const colors = colorMap[cat.color]
            let qIndex = 1
            // global question numbering offset
            const globalStart = categories.slice(0, categories.findIndex(c => c.id === cat.id)).reduce((a, c) => a + c.questions.length, 0) + 1
            return (
              <section key={cat.id} id={cat.id}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 ${colors.icon} rounded-xl flex items-center justify-center text-xl`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{cat.label}</h2>
                    <p className="text-sm text-gray-500">{cat.questions.length} Fragen</p>
                  </div>
                </div>
                {/* Questions */}
                <div className="space-y-3">
                  {cat.questions.map((item, i) => (
                    <AccordionItem
                      key={i}
                      q={item.q}
                      a={item.a}
                      index={!search ? globalStart + i : i + 1}
                    />
                  ))}
                </div>
              </section>
            )
          })}

          {/* Contact Card */}
          {!search && !activeCategory && (
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center shadow-lg mt-10">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-2xl font-bold mb-2">Deine Frage ist nicht dabei?</h3>
              <p className="text-blue-100 mb-6 text-lg">Unser Support-Team hilft dir gerne persönlich weiter – in der Regel innerhalb von 24 Stunden.</p>
              <a
                href="mailto:support@bereifung24.de"
                className="inline-flex items-center gap-2 bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                support@bereifung24.de
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
