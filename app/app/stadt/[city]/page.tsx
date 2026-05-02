import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, Check, MapPin, Smartphone } from 'lucide-react'
import AppStoreButtons from '@/components/AppStoreButtons'
import { APP_META, APP_STORE_URLS } from '@/lib/seo/app-pages'
import { getAllCitySlugs, getCityBySlug, getCitiesInSameState } from '@/lib/seo/german-cities'

interface PageProps {
  params: { city: string }
}

export function generateStaticParams() {
  return getAllCitySlugs().map(city => ({ city }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const city = getCityBySlug(params.city)
  if (!city) return { title: 'Seite nicht gefunden' }

  const title = `Bereifung24 App in ${city.name} – Reifenservice & Werkstatt | iOS & Android`
  const description = `Reifenwechsel, Werkstatt-Suche und Reifenkauf in ${city.name} per App. ${city.workshopCount} Werkstätten in der Region. Kostenlose Bereifung24 App für iOS und Android.`

  return {
    title,
    description,
    keywords: `reifen app ${city.name.toLowerCase()}, werkstatt app ${city.name.toLowerCase()}, reifenwechsel app ${city.name.toLowerCase()}, kfz app ${city.name.toLowerCase()}, bereifung24 ${city.name.toLowerCase()}`,
    alternates: { canonical: `https://bereifung24.de/app/stadt/${city.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://bereifung24.de/app/stadt/${city.slug}`,
      siteName: 'Bereifung24',
      locale: 'de_DE',
      images: [{ url: 'https://bereifung24.de/og-image.jpg', width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  }
}

export default function AppCityPage({ params }: PageProps) {
  const city = getCityBySlug(params.city)
  if (!city) notFound()

  const nearbyCities = getCitiesInSameState(city.slug).slice(0, 6)

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: APP_META.name,
    operatingSystem: APP_META.os.join(', '),
    applicationCategory: APP_META.category,
    description: `Reifenservice-App für ${city.name}: Reifenwechsel buchen, Werkstatt finden, Reifen kaufen.`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: APP_META.ratingValue,
      ratingCount: APP_META.ratingCount,
    },
    offers: { '@type': 'Offer', price: APP_META.price, priceCurrency: APP_META.priceCurrency },
    downloadUrl: [APP_STORE_URLS.ios, APP_STORE_URLS.android],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Wie viele Werkstätten gibt es in der Bereifung24 App in ${city.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: `In ${city.name} und Umgebung sind ${city.workshopCount} Werkstätten gelistet, die du direkt in der App buchen kannst.` },
      },
      {
        '@type': 'Question',
        name: `Was kostet die Bereifung24 App?`,
        acceptedAnswer: { '@type': 'Answer', text: `Die Bereifung24 App ist komplett kostenlos – sowohl im App Store als auch im Google Play Store. Du zahlst nur den Festpreis für den gebuchten Service direkt in der Werkstatt.` },
      },
      {
        '@type': 'Question',
        name: `Funktioniert die App auch in den umliegenden Städten von ${city.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: `Ja, die App findet Werkstätten in ganz ${city.state}${city.nearbyCity ? ` – auch in ${city.nearbyCity}` : ''} und Umgebung.` },
      },
    ],
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://bereifung24.de' },
      { '@type': 'ListItem', position: 2, name: 'App', item: 'https://bereifung24.de/app' },
      { '@type': 'ListItem', position: 3, name: city.name, item: `https://bereifung24.de/app/stadt/${city.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([appJsonLd, faqJsonLd, breadcrumb]) }} />

      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">Bereifung24</Link>
            <Link href="/app" className="text-sm text-gray-600 hover:text-gray-900">← Alle App-Funktionen</Link>
          </div>
        </header>

        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 py-3 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Startseite</Link>
            <span className="mx-2">/</span>
            <Link href="/app" className="hover:text-primary-600">App</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{city.name}</span>
          </div>
        </div>

        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{city.name}, {city.state}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
              Bereifung24 App in {city.name}
            </h1>
            <p className="text-xl text-primary-100 mb-8">
              Reifenwechsel buchen, Werkstatt finden, Reifen kaufen – direkt in {city.name} und Umgebung.
              {city.workshopCount} Werkstätten in der Region.
            </p>

            <AppStoreButtons className="mb-6" />

            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-primary-100">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-current text-yellow-300" />
                <span>{APP_META.ratingValue} / 5</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Kostenlos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>iOS & Android</span>
              </div>
            </div>
          </div>
        </section>

        {/* City info */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-primary-600">{city.workshopCount}</div>
                <div className="text-sm text-gray-600">Werkstätten</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">{city.carOwners}</div>
                <div className="text-sm text-gray-600">Autofahrer</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">{APP_META.ratingValue}</div>
                <div className="text-sm text-gray-600">App-Bewertung</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary-600">60s</div>
                <div className="text-sm text-gray-600">Buchung</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Reifenservice in {city.name} per App
            </h2>
            <p className="text-lg text-gray-700 leading-relaxed text-center mb-8">
              Mit der kostenlosen Bereifung24 App findest du in {city.name} und Umgebung
              schnell die passende Werkstatt für Reifenwechsel, Räderwechsel und Reifenkauf.
              Vergleiche Preise, lies Bewertungen und buche deinen Termin direkt vom Smartphone –
              ohne anzurufen, ohne zu warten.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
              <Link href="/app/reifenwechsel-buchen" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all">
                <div className="text-3xl mb-2">📅</div>
                <h3 className="font-bold text-gray-900 mb-1">Termin buchen</h3>
                <p className="text-sm text-gray-600">Reifenwechsel in {city.name} in 60 Sekunden buchen</p>
              </Link>
              <Link href="/app/werkstatt-finden" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all">
                <div className="text-3xl mb-2">📍</div>
                <h3 className="font-bold text-gray-900 mb-1">Werkstatt finden</h3>
                <p className="text-sm text-gray-600">{city.workshopCount} geprüfte Werkstätten in {city.name}</p>
              </Link>
              <Link href="/app/reifen-kaufen" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all">
                <div className="text-3xl mb-2">🛞</div>
                <h3 className="font-bold text-gray-900 mb-1">Reifen kaufen</h3>
                <p className="text-sm text-gray-600">Lieferung direkt zu einer Werkstatt in {city.name}</p>
              </Link>
              <Link href="/app/notdienst" className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all">
                <div className="text-3xl mb-2">🆘</div>
                <h3 className="font-bold text-gray-900 mb-1">Notdienst</h3>
                <p className="text-sm text-gray-600">Reifenpanne in {city.name}? Sofortige Hilfe finden</p>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Häufige Fragen zur App in {city.name}
            </h2>
            <div className="space-y-4">
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Wie viele Werkstätten gibt es in der App in {city.name}?
                  <span className="text-primary-600 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  In {city.name} und Umgebung sind {city.workshopCount} Werkstätten gelistet,
                  die du direkt in der App buchen kannst. {city.nearbyCity ? `Auch in ${city.nearbyCity} findest du Partner-Werkstätten.` : ''}
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Was kostet die Bereifung24 App?
                  <span className="text-primary-600 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  Die App ist komplett kostenlos – im App Store und im Google Play Store.
                  Du zahlst nur den angezeigten Festpreis für den gebuchten Service.
                </p>
              </details>
              <details className="bg-gray-50 rounded-xl p-6 group">
                <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                  Funktioniert die App auch außerhalb von {city.name}?
                  <span className="text-primary-600 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="text-gray-600 mt-4">
                  Ja, die App funktioniert in ganz {city.state} und bundesweit. Du findest in jeder größeren Stadt geprüfte Partner-Werkstätten.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Nearby cities */}
        {nearbyCities.length > 0 && (
          <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                App auch verfügbar in
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {nearbyCities.map(c => (
                  <Link
                    key={c.slug}
                    href={`/app/stadt/${c.slug}`}
                    className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-colors text-sm"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-br from-primary-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Jetzt App laden – auch in {city.name}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Über 10.000 Autofahrer nutzen bereits die Bereifung24 App.
            </p>
            <AppStoreButtons />
          </div>
        </section>
      </div>
    </>
  )
}
