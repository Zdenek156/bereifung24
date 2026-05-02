import { Metadata } from 'next'
import Link from 'next/link'
import { Smartphone, Star, Check, MapPin, Calendar, ShoppingBag, Bot, Car, ScanLine, Phone } from 'lucide-react'
import AppStoreButtons from '@/components/AppStoreButtons'
import { APP_META, APP_STORE_URLS, APP_PAGES, getAppPagesByType } from '@/lib/seo/app-pages'

export const metadata: Metadata = {
  title: 'Bereifung24 App – Reifenservice & Werkstatt zum Festpreis | iOS & Android',
  description: 'Die Bereifung24 App: Reifenwechsel buchen, Werkstatt finden, Reifen kaufen – alles in einer App. Über 1.500 geprüfte Werkstätten in Deutschland. Kostenlos für iOS und Android.',
  keywords: 'bereifung24 app, reifen app, werkstatt app, reifenwechsel app, reifen ios android, kfz app, autowerkstatt app',
  alternates: { canonical: 'https://bereifung24.de/app' },
  openGraph: {
    title: 'Bereifung24 App – Reifenservice zum Festpreis',
    description: 'Reifenwechsel buchen, Werkstatt finden, Reifen kaufen – alles in einer App. Kostenlos für iOS und Android.',
    type: 'website',
    url: 'https://bereifung24.de/app',
    siteName: 'Bereifung24',
    locale: 'de_DE',
    images: [{ url: 'https://bereifung24.de/og-image.jpg', width: 1200, height: 630, alt: 'Bereifung24 App' }],
  },
  twitter: { card: 'summary_large_image', title: 'Bereifung24 App', description: 'Reifenservice & Werkstatt per App.' },
  robots: { index: true, follow: true },
}

const FEATURE_ICONS: Record<string, any> = {
  'reifenwechsel-buchen': Calendar,
  'werkstatt-finden': MapPin,
  'reifen-kaufen': ShoppingBag,
  'notdienst': Phone,
  'ki-berater': Bot,
  'fahrzeug-verwaltung': Car,
  'dokumenten-scanner': ScanLine,
}

export default function AppHubPage() {
  const features = getAppPagesByType('feature')
  const audiences = getAppPagesByType('audience')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: APP_META.name,
    operatingSystem: APP_META.os.join(', '),
    applicationCategory: APP_META.category,
    description: 'Reifenwechsel buchen, Werkstatt finden, Reifen kaufen – alles in einer App.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: APP_META.ratingValue,
      ratingCount: APP_META.ratingCount,
    },
    offers: {
      '@type': 'Offer',
      price: APP_META.price,
      priceCurrency: APP_META.priceCurrency,
    },
    downloadUrl: [APP_STORE_URLS.ios, APP_STORE_URLS.android],
    publisher: {
      '@type': 'Organization',
      name: 'Bereifung24',
      url: 'https://bereifung24.de',
    },
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://bereifung24.de' },
      { '@type': 'ListItem', position: 2, name: 'App', item: 'https://bereifung24.de/app' },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumb]) }} />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">Bereifung24</Link>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">← Zur Startseite</Link>
          </div>
        </header>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white py-16 sm:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-6 text-sm">
              <Smartphone className="w-4 h-4" />
              <span>Jetzt verfügbar für iOS und Android</span>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
              Reifenservice und Werkstatt – einfach per App
            </h1>
            <p className="text-xl sm:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Reifenwechsel buchen, Werkstatt finden, Reifen kaufen – alles in einer App.
              Über 1.500 geprüfte Werkstätten in Deutschland.
            </p>

            <AppStoreButtons className="mb-8" />

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-primary-100">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-current text-yellow-300" />
                <span>{APP_META.ratingValue} / 5 ({APP_META.ratingCount} Bewertungen)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Kostenlos</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Keine versteckten Kosten</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Alle Funktionen im Überblick</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Von der Werkstatt-Suche bis zur Online-Buchung – die App vereint alles, was Autofahrer brauchen.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {features.map(f => {
                const Icon = FEATURE_ICONS[f.slug] || Smartphone
                return (
                  <Link
                    key={f.slug}
                    href={`/app/${f.slug}`}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all group"
                  >
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{f.h1}</h3>
                    <p className="text-sm text-gray-600">{f.intro.split('.')[0]}.</p>
                    <span className="inline-flex items-center gap-1 mt-4 text-sm text-primary-600 font-medium">
                      Mehr erfahren →
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* Why our App */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Warum die Bereifung24 App?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚡</div>
                <h3 className="font-bold text-gray-900 mb-2">Termin in 60 Sekunden</h3>
                <p className="text-sm text-gray-600">Kennzeichen scannen, Werkstatt wählen, Termin sichern – fertig.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">💶</div>
                <h3 className="font-bold text-gray-900 mb-2">Festpreis vorab</h3>
                <p className="text-sm text-gray-600">Du siehst den Endpreis, bevor du buchst – ohne versteckte Kosten.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🛡️</div>
                <h3 className="font-bold text-gray-900 mb-2">Geprüfte Werkstätten</h3>
                <p className="text-sm text-gray-600">Über 1.500 verifizierte Partner-Werkstätten in ganz Deutschland.</p>
              </div>
            </div>
          </div>
        </section>

        {/* For whom */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Für wen ist die App?</h2>
              <p className="text-lg text-gray-600">Egal ob Vielfahrer, Familie oder kleiner Fuhrpark – die App passt sich an.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {audiences.map(a => (
                <Link
                  key={a.slug}
                  href={`/app/${a.slug}`}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all"
                >
                  <h3 className="font-bold text-gray-900 mb-2">{a.h1.replace('Die App für ', '').replace('Die App für ', '')}</h3>
                  <p className="text-sm text-gray-600 mb-3">{a.metaDescription.split('.')[0]}.</p>
                  <span className="text-sm text-primary-600 font-medium">Mehr erfahren →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Platform */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Für deine Plattform</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/app/ios" className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-xl p-8 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">🍎</div>
                <h3 className="text-2xl font-bold mb-2">App für iPhone</h3>
                <p className="text-gray-300 mb-4">Optimiert für iOS, Apple Pay und Face ID.</p>
                <span className="text-white font-medium">Mehr erfahren →</span>
              </Link>
              <Link href="/app/android" className="bg-gradient-to-br from-green-700 to-green-900 text-white rounded-xl p-8 hover:scale-105 transition-transform">
                <div className="text-4xl mb-3">🤖</div>
                <h3 className="text-2xl font-bold mb-2">App für Android</h3>
                <p className="text-green-100 mb-4">Mit Material You Design und Google Pay.</p>
                <span className="text-white font-medium">Mehr erfahren →</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-br from-primary-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Jetzt kostenlos laden</h2>
            <p className="text-xl text-primary-100 mb-8">Über 10.000 Autofahrer nutzen bereits die Bereifung24 App.</p>
            <AppStoreButtons />
          </div>
        </section>
      </div>
    </>
  )
}
