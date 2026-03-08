import Link from 'next/link'

export default function PricingPage() {
  const checkIcon = (
    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
    </svg>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-2 inline-flex items-center gap-1">
            ← Zurück zur Startseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Preise & Konditionen</h1>
          <p className="text-gray-600 mt-1">Transparent, fair und ohne versteckte Kosten</p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto">

          {/* === HOW IT WORKS === */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">So funktioniert die Buchung</h2>
              <p className="text-gray-600">Direkte Online-Buchung mit Festpreis – keine Anfragen, kein Warten</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '1', icon: '🔍', title: 'Service wählen', desc: 'Wähle deinen Service und gib deinen Standort ein' },
                { step: '2', icon: '🏪', title: 'Werkstatt vergleichen', desc: 'Vergleiche Festpreise und Bewertungen geprüfter Werkstätten' },
                { step: '3', icon: '📅', title: 'Termin buchen', desc: 'Wähle deinen Wunschtermin und bezahle sicher online' },
                { step: '4', icon: '🚗', title: 'Hinfahren & fertig', desc: 'Zum Termin erscheinen – alles ist vorbereitet' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                    {item.icon}
                  </div>
                  <div className="text-xs font-semibold text-primary-600 uppercase tracking-wide mb-1">Schritt {item.step}</div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* === FOR CUSTOMERS === */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-3">Für Kunden</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Komplett kostenlos für dich</h2>
              <p className="text-lg text-gray-600">Keine Registrierungsgebühr, keine versteckten Kosten</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-green-600 to-green-500 px-8 py-6 text-white text-center">
                <div className="text-5xl font-extrabold">0 €</div>
                <p className="text-green-100 mt-1">Für immer kostenlos – alle Features inklusive</p>
              </div>
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    'Festpreise vergleichen',
                    'Direkt online buchen & bezahlen',
                    'Wunschtermin sofort bestätigt',
                    'Sichere Zahlung (Stripe, PayPal, Klarna)',
                    'Automatische Buchungsbestätigung per E-Mail',
                    'Bewertungen echter Kunden',
                    'Fahrzeugverwaltung mit Service-Historie',
                    'CO₂-Rechner & Einsparungen',
                    'Wetter-Erinnerung für Reifenwechsel',
                    'Smart Reifen-Berater (KI-gestützt)',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      {checkIcon}
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 text-center">
                  <Link
                    href="/register/customer"
                    className="inline-block px-8 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Kostenlos registrieren
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* === PAYMENT METHODS === */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sichere Zahlungsmethoden</h2>
              <p className="text-gray-600">Bezahle bei der Buchung – dein Geld ist bis zum Service geschützt</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: 'Kreditkarte', desc: 'Visa, Mastercard, Amex', icon: '💳' },
                  { name: 'PayPal', desc: 'Auch Ratenzahlung', icon: '🅿️' },
                  { name: 'Klarna', desc: 'Sofort & Ratenkauf', icon: '🟣' },
                  { name: 'Apple / Google Pay', desc: 'Kontaktlos bezahlen', icon: '📱' },
                ].map((method) => (
                  <div key={method.name} className="text-center p-4 rounded-xl bg-gray-50">
                    <div className="text-3xl mb-2">{method.icon}</div>
                    <div className="font-semibold text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-500">{method.desc}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-blue-50 rounded-xl p-5 flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <div className="font-semibold text-blue-900">Käuferschutz inklusive</div>
                  <p className="text-sm text-blue-700 mt-1">
                    Deine Zahlung wird erst an die Werkstatt freigegeben, wenn der Service durchgeführt wurde. 
                    SSL-verschlüsselt und PCI-DSS-konform über Stripe.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* === SERVICE PRICES === */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Unsere Service-Festpreise</h2>
              <p className="text-gray-600">Alle Preise werden von den Werkstätten festgelegt – du siehst den Endpreis vor der Buchung</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { emoji: '🔧', title: 'Räderwechsel', desc: '4 Räder wechseln (auf vorhandenen Felgen)', price: '19,90 €', popular: true },
                { emoji: '🔄', title: 'Reifenwechsel', desc: 'Reifen ab- und aufziehen inkl. Wuchten', price: '39,90 €', popular: true },
                { emoji: '🔨', title: 'Reifenreparatur', desc: 'Professionelle Reparatur & Vulkanisierung', price: '29,90 €', popular: false },
                { emoji: '🏍️', title: 'Motorradreifen', desc: 'Montage Vorder- und/oder Hinterreifen', price: '24,90 €', popular: false },
                { emoji: '📏', title: 'Achsvermessung', desc: '3D-Vermessung und Spureinstellung', price: '49,90 €', popular: false },
                { emoji: '❄️', title: 'Klimaservice', desc: 'Wartung, Desinfektion & Befüllung', price: '59,90 €', popular: false },
              ].map((service) => (
                <div key={service.title} className={`bg-white rounded-xl p-6 border ${service.popular ? 'border-primary-200 ring-1 ring-primary-100' : 'border-gray-100'} hover:shadow-md transition-all`}>
                  {service.popular && (
                    <span className="inline-block px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-semibold mb-2">Beliebt</span>
                  )}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{service.emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{service.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{service.desc}</p>
                      <div className="mt-3">
                        <span className="text-lg font-bold text-primary-600">{service.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-500 mt-6">
              * Endpreise variieren je nach Werkstatt, Fahrzeug und Region. Du siehst den verbindlichen Festpreis immer vor der Buchung.
            </p>
          </section>

          {/* === FOR WORKSHOPS === */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold mb-3">Für Werkstätten</span>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Provisionsbasiert – nur bei Erfolg</h2>
              <p className="text-lg text-gray-600">Keine Grundgebühr, keine monatlichen Kosten, keine Mindestlaufzeit</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              {/* Header with 3 highlights */}
              <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50">
                <div className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">0 €</div>
                  <div className="text-sm text-gray-600">Registrierung</div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-2xl font-bold text-green-600">0 €</div>
                  <div className="text-sm text-gray-600">Monatliche Gebühr</div>
                </div>
                <div className="p-6 text-center">
                  <div className="text-2xl font-bold text-primary-600">Nur bei Buchung</div>
                  <div className="text-sm text-gray-600">Provision</div>
                </div>
              </div>

              <div className="p-8">
                <h3 className="font-bold text-gray-900 mb-4">So verdienen wir:</h3>
                <div className="bg-primary-50 rounded-xl p-6 mb-8">
                  <p className="text-gray-700 leading-relaxed">
                    Wir berechnen eine kleine Provision pro <strong>erfolgreicher Buchung</strong>. 
                    Der Kunde bezahlt online bei der Buchung. Sie erhalten den vollen Betrag abzüglich unserer Provision 
                    nach Durchführung des Services automatisch auf Ihr Konto.
                  </p>
                </div>

                <h3 className="font-bold text-gray-900 mb-4">Was Sie bekommen:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {[
                    'Direkte Buchungen mit Online-Bezahlung',
                    'Automatische Terminverwaltung',
                    'Digitales Werkstatt-Dashboard',
                    'Eigene Preisgestaltung pro Service',
                    'Mitarbeiterverwaltung & Kalender',
                    'Kundenbewertungen & Sichtbarkeit',
                    'Automatische Auszahlungen',
                    'E-Mail-Benachrichtigungen',
                    'Professionelles Werkstatt-Profil',
                    'Support & Hilfe',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      {checkIcon}
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="text-center">
                  <Link
                    href="/register/workshop"
                    className="inline-block px-8 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Jetzt kostenlos als Werkstatt registrieren
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* === FAQ === */}
          <section>
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Häufige Fragen</h2>
            </div>

            <div className="space-y-4 max-w-3xl mx-auto">
              {[
                { q: 'Ist Bereifung24 wirklich kostenlos für Kunden?', a: 'Ja, zu 100%. Du zahlst nur den Festpreis für den Service – keine Plattformgebühr, keine Aufschläge.' },
                { q: 'Wie funktioniert die Bezahlung?', a: 'Du bezahlst sicher online bei der Buchung per Kreditkarte, PayPal, Klarna oder Apple/Google Pay. Der Betrag wird erst an die Werkstatt freigegeben, wenn der Service durchgeführt wurde.' },
                { q: 'Kann ich stornieren?', a: 'Ja, kostenlose Stornierung ist bis 24 Stunden vor dem Termin möglich. Der volle Betrag wird dir erstattet.' },
                { q: 'Wie werden die Preise festgelegt?', a: 'Jede Werkstatt legt ihre eigenen Festpreise fest. Du siehst den verbindlichen Endpreis vor der Buchung – ohne versteckte Kosten.' },
                { q: 'Was kostet es für Werkstätten?', a: 'Die Registrierung und Nutzung ist kostenlos. Wir berechnen nur eine kleine Provision pro erfolgreicher Buchung.' },
                { q: 'Sind die Werkstätten geprüft?', a: 'Ja, alle Partner-Werkstätten werden von uns verifiziert und erhalten laufend Kundenbewertungen.' },
              ].map((faq, i) => (
                <details key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
                  <summary className="flex items-center justify-between p-5 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 text-gray-600 border-t border-gray-50 pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>

            <div className="text-center mt-10">
              <p className="text-gray-500 mb-4">Noch Fragen?</p>
              <Link href="/faq" className="text-primary-600 hover:text-primary-700 font-semibold">
                Weitere FAQs ansehen →
              </Link>
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}
