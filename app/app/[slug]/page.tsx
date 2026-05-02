import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Star, Check, Download } from 'lucide-react'
import AppStoreButtons from '@/components/AppStoreButtons'
import { APP_META, APP_STORE_URLS, getAppPageBySlug, getAllAppPageSlugs } from '@/lib/seo/app-pages'

interface PageProps {
  params: { slug: string }
}

export function generateStaticParams() {
  return getAllAppPageSlugs().map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = getAppPageBySlug(params.slug)
  if (!page) return { title: 'Seite nicht gefunden' }

  return {
    title: page.title,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: `https://bereifung24.de/app/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.metaDescription,
      type: 'website',
      url: `https://bereifung24.de/app/${page.slug}`,
      siteName: 'Bereifung24',
      locale: 'de_DE',
      images: [{ url: 'https://bereifung24.de/og-image.jpg', width: 1200, height: 630, alt: page.h1 }],
    },
    twitter: { card: 'summary_large_image', title: page.title, description: page.metaDescription },
    robots: { index: true, follow: true },
  }
}

export default function AppSlugPage({ params }: PageProps) {
  const page = getAppPageBySlug(params.slug)
  if (!page) notFound()

  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: APP_META.name,
    operatingSystem: APP_META.os.join(', '),
    applicationCategory: APP_META.category,
    description: page.metaDescription,
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
    mainEntity: page.faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Startseite', item: 'https://bereifung24.de' },
      { '@type': 'ListItem', position: 2, name: 'App', item: 'https://bereifung24.de/app' },
      { '@type': 'ListItem', position: 3, name: page.h1, item: `https://bereifung24.de/app/${page.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([appJsonLd, faqJsonLd, breadcrumb]) }} />

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-primary-600">Bereifung24</Link>
            <Link href="/app" className="text-sm text-gray-600 hover:text-gray-900">← Alle App-Funktionen</Link>
          </div>
        </header>

        {/* Breadcrumb */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="container mx-auto px-4 py-3 text-sm text-gray-600">
            <Link href="/" className="hover:text-primary-600">Startseite</Link>
            <span className="mx-2">/</span>
            <Link href="/app" className="hover:text-primary-600">App</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{page.h1}</span>
          </div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white py-16 sm:py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">{page.h1}</h1>
            <p className="text-xl text-primary-100 mb-8">{page.intro}</p>

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
                <Download className="w-4 h-4" />
                <span>iOS & Android</span>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {page.highlights.map((h, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 flex gap-4">
                  <div className="text-4xl flex-shrink-0">{h.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{h.title}</h3>
                    <p className="text-gray-600">{h.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps (optional) */}
        {page.steps && page.steps.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4 max-w-5xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">So einfach geht&apos;s</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {page.steps.map((s, i) => (
                  <div key={i} className="text-center p-6">
                    <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {i + 1}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-gray-600">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* FAQs */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12 text-center">Häufige Fragen</h2>
            <div className="space-y-4">
              {page.faqs.map((faq, i) => (
                <details key={i} className="bg-white rounded-xl p-6 border border-gray-200 group">
                  <summary className="font-bold text-gray-900 cursor-pointer list-none flex items-center justify-between">
                    {faq.question}
                    <span className="text-primary-600 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                  </summary>
                  <p className="text-gray-600 mt-4">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-gradient-to-br from-primary-600 to-indigo-700 text-white">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Jetzt kostenlos laden</h2>
            <p className="text-xl text-primary-100 mb-8">Verfügbar für iPhone und Android.</p>
            <AppStoreButtons />
          </div>
        </section>

        {/* Related */}
        <section className="py-12 bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Weitere App-Funktionen</h3>
            <Link href="/app" className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
              Alle Funktionen ansehen
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
