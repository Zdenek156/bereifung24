import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function WidgetBookingPage({
  params,
  searchParams,
}: {
  params: { workshopId: string }
  searchParams: { theme?: string; color?: string }
}) {
  const workshop = await prisma.workshop.findUnique({
    where: { id: params.workshopId },
    select: {
      id: true,
      companyName: true,
      logoUrl: true,
      isVerified: true,
      openingHours: true,
      user: { select: { city: true } },
      landingPage: {
        select: {
          slug: true,
          isActive: true,
        }
      },
      workshopServices: {
        select: {
          id: true,
          serviceType: true,
          basePrice: true,
          durationMinutes: true,
          allowsDirectBooking: true,
          servicePackages: {
            select: {
              packageType: true,
              name: true,
              price: true,
              durationMinutes: true,
              isActive: true,
            },
            where: { isActive: true },
            orderBy: { price: 'asc' as const },
          },
        },
        where: { isActive: true }
      },
    }
  })

  if (!workshop) return notFound()

  // Calculate average rating
  const reviews = await prisma.review.findMany({
    where: { workshopId: params.workshopId },
    select: { rating: true }
  })
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  const theme = searchParams.theme || 'light'
  const color = searchParams.color || '#0070f3'
  const isDark = theme === 'dark'

  const serviceLabels: Record<string, string> = {
    'TIRE_CHANGE': 'Reifenwechsel',
    'WHEEL_CHANGE': 'Räderwechsel',
    'TIRE_REPAIR': 'Reifenreparatur',
    'MOTORCYCLE_TIRE': 'Motorrad-Reifenwechsel',
    'ALIGNMENT': 'Achsvermessung',
    'ALIGNMENT_BOTH': 'Achsvermessung',
    'CLIMATE_SERVICE': 'Klimaservice',
    'BRAKE_SERVICE': 'Bremsendienst',
    'BATTERY_SERVICE': 'Batterieservice',
    'OTHER_SERVICES': 'Weitere Services',
  }

  const serviceIcons: Record<string, string> = {
    'TIRE_CHANGE': '🔄',
    'WHEEL_CHANGE': '🔁',
    'TIRE_REPAIR': '🔧',
    'MOTORCYCLE_TIRE': '🏍️',
    'ALIGNMENT': '📐',
    'ALIGNMENT_BOTH': '📐',
    'CLIMATE_SERVICE': '❄️',
    'BRAKE_SERVICE': '🛑',
    'BATTERY_SERVICE': '🔋',
    'OTHER_SERVICES': '⚙️',
  }

  // Preferred package type per service
  const preferredPackage: Record<string, string> = {
    'TIRE_CHANGE': 'four_tires',
    'WHEEL_CHANGE': 'basic',
    'TIRE_REPAIR': 'foreign_object',
    'MOTORCYCLE_TIRE': 'front',
    'ALIGNMENT_BOTH': 'measurement_both',
    'CLIMATE_SERVICE': 'check',
  }

  // Detail text for the selected package
  const detailText: Record<string, Record<string, string>> = {
    'TIRE_CHANGE': { 'four_tires': '4 Reifen', 'two_tires': '2 Reifen' },
    'MOTORCYCLE_TIRE': { 'front': 'pro Reifen', 'rear': 'pro Reifen' },
    'TIRE_REPAIR': { 'foreign_object': 'Fremdkörper' },
    'CLIMATE_SERVICE': { 'check': 'Klimacheck' },
  }

  // Build display services — only those with packages
  const displayServices = workshop.workshopServices
    .filter(s => s.servicePackages.length > 0)
    .map(s => {
      const pref = preferredPackage[s.serviceType]
      const pkg = (pref && s.servicePackages.find(p => p.packageType === pref)) || s.servicePackages[0]
      const detail = detailText[s.serviceType]?.[pkg.packageType] || ''
      return {
        id: s.id,
        serviceType: s.serviceType,
        label: serviceLabels[s.serviceType] || s.serviceType,
        price: pkg.price,
        detail,
        durationMinutes: pkg.durationMinutes || s.durationMinutes,
      }
    })
    .sort((a, b) => {
      const order = ['TIRE_CHANGE', 'WHEEL_CHANGE', 'TIRE_REPAIR', 'MOTORCYCLE_TIRE', 'ALIGNMENT_BOTH', 'ALIGNMENT', 'CLIMATE_SERVICE', 'BRAKE_SERVICE', 'BATTERY_SERVICE', 'OTHER_SERVICES']
      return (order.indexOf(a.serviceType) === -1 ? 99 : order.indexOf(a.serviceType)) - (order.indexOf(b.serviceType) === -1 ? 99 : order.indexOf(b.serviceType))
    })

  // Use landing page URL if available, otherwise workshop profile
  const hasLandingPage = workshop.landingPage?.isActive && workshop.landingPage?.slug
  const primaryUrl = hasLandingPage
    ? `https://bereifung24.de/lp/${workshop.landingPage!.slug}`
    : `https://bereifung24.de/workshop/${workshop.id}`
  const bookingUrl = primaryUrl

  return (
    <html lang="de">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <title>Online-Termin buchen - {workshop.companyName}</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: ${isDark ? '#1a1a2e' : '#ffffff'};
            color: ${isDark ? '#ffffff' : '#1a1a2e'};
            padding: 20px;
          }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
          .header .subtitle { font-size: 12px; color: ${isDark ? '#a0aec0' : '#6b7280'}; }
          .stars { color: #f59e0b; }
          .service-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
          .service-item {
            display: flex; justify-content: space-between; align-items: center;
            padding: 12px 14px; background: ${isDark ? '#252540' : '#f9fafb'};
            border: 1px solid ${isDark ? '#333' : '#e5e7eb'}; border-radius: 10px;
            cursor: pointer; transition: all 0.15s;
          }
          .service-item:hover {
            border-color: ${color}; background: ${isDark ? '#2a2a4a' : '#eff6ff'};
          }
          .service-item.selected {
            border-color: ${color}; background: ${isDark ? '#2a2a4a' : '#eff6ff'};
            box-shadow: 0 0 0 2px ${color}33;
          }
          .service-name { font-size: 13px; font-weight: 500; }
          .service-price { font-size: 14px; font-weight: 700; color: ${color}; }
          .service-duration { font-size: 11px; color: ${isDark ? '#a0aec0' : '#6b7280'}; }
          .cta-btn {
            display: block; width: 100%; padding: 14px; background: ${color};
            color: #fff; border: none; border-radius: 10px; font-size: 14px;
            font-weight: 600; cursor: pointer; text-align: center;
            text-decoration: none; transition: opacity 0.2s;
          }
          .cta-btn:hover { opacity: 0.9; }
          .cta-btn:disabled { opacity: 0.5; cursor: not-allowed; }
          .footer { text-align: center; margin-top: 16px; }
          .footer a { font-size: 11px; color: ${isDark ? '#a0aec0' : '#9ca3af'}; text-decoration: none; }
          .footer a:hover { text-decoration: underline; }
          .verified { color: #10b981; font-size: 11px; font-weight: 600; }
        `}} />
      </head>
      <body>
        <div className="header">
          <h1>{workshop.companyName}</h1>
          <div className="subtitle">
            {workshop.user?.city && <span>{workshop.user.city} · </span>}
            <span className="stars">{'⭐'.repeat(Math.floor(avgRating))}</span>
            {' '}{avgRating.toFixed(1)}/5 · {reviews.length} Bewertungen
            {workshop.isVerified && <span className="verified"> · ✓ Verifiziert</span>}
          </div>
        </div>

        <div style={{ fontSize: '11px', fontWeight: 600, color: isDark ? '#a0aec0' : '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
          Service wählen
        </div>

        <div className="service-list">
          {displayServices.map((service) => (
            <a
              key={service.id}
              href={primaryUrl + (hasLandingPage ? '#services' : `?service=${service.serviceType}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="service-item"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div>
                <div className="service-name">
                  {serviceIcons[service.serviceType] || '🔧'} {service.label}
                  {service.detail && <span style={{ fontSize: 11, color: isDark ? '#a0aec0' : '#6b7280', fontWeight: 400 }}> ({service.detail})</span>}
                </div>
                {service.durationMinutes && (
                  <div className="service-duration">ca. {service.durationMinutes} Min.</div>
                )}
              </div>
              <div className="service-price">
                {service.price > 0 ? `${service.price.toFixed(2).replace('.', ',')} €` : 'Auf Anfrage'}
              </div>
            </a>
          ))}
        </div>

        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cta-btn"
        >
          🔍 Alle Services ansehen & buchen
        </a>

        <div className="footer">
          <a href="https://bereifung24.de" target="_blank" rel="noopener noreferrer">
            Powered by Bereifung24
          </a>
        </div>
      </body>
    </html>
  )
}
