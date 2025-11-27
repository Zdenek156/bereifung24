import Link from 'next/link'

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-block">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Häufig gestellte Fragen (FAQ)</h1>
        </div>
      </header>

      {/* FAQ Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {faqs.map((section, index) => (
            <div key={index} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{section.category}</h2>
              <div className="space-y-6">
                {section.questions.map((faq, faqIndex) => (
                  <div key={faqIndex} className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const faqs = [
  {
    category: 'Für Kunden',
    questions: [
      {
        question: 'Ist die Nutzung von Bereifung24 wirklich kostenlos?',
        answer: 'Ja, die Plattform ist für Kunden zu 100% kostenlos. Es fallen keine Gebühren für die Anfrage, den Angebotsvergleich oder die Buchung an.'
      },
      {
        question: 'Wie schnell erhalte ich Angebote?',
        answer: 'In der Regel erhalten Sie innerhalb von 24 Stunden 3-5 Angebote von Werkstätten in Ihrer Nähe. Die Geschwindigkeit hängt von der Verfügbarkeit der Werkstätten ab.'
      },
      {
        question: 'Kann ich meinen Termin kostenlos stornieren?',
        answer: 'Ja, Sie können Ihren Termin jederzeit kostenlos stornieren oder verschieben. Bitte informieren Sie die Werkstatt rechtzeitig über Änderungen.'
      },
      {
        question: 'Welche Services werden angeboten?',
        answer: 'Wir bieten alle Reifenservices an: Reifenwechsel, Räderwechsel, Reifenreparatur, Motorradreifen, Achsvermessung, Klimaservice, Bremsen-Service, Batterie-Service und weitere Dienstleistungen.'
      }
    ]
  },
  {
    category: 'Für Werkstätten',
    questions: [
      {
        question: 'Welche Kosten fallen für Werkstätten an?',
        answer: 'Die Registrierung ist kostenlos. Es fallen keine monatlichen Grundgebühren an. Sie zahlen nur eine faire Provision bei erfolgreicher Vermittlung eines Kunden.'
      },
      {
        question: 'Wie funktioniert die Angebotserstellung?',
        answer: 'Sie erhalten qualifizierte Anfragen von Kunden in Ihrem Umkreis. Sie können dann ein individuelles Angebot erstellen und direkt an den Kunden senden.'
      },
      {
        question: 'Kann ich meine Preise selbst bestimmen?',
        answer: 'Ja, Sie haben volle Kontrolle über Ihre Preise. Sie können für jeden Service individuelle Pakete und Preise festlegen.'
      }
    ]
  }
]
