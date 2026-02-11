'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  customItems?: BreadcrumbItem[]
}

export default function Breadcrumb({ items, customItems }: BreadcrumbProps) {
  const pathname = usePathname()
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([])

  useEffect(() => {
    // Use custom items if provided
    if (customItems) {
      setBreadcrumbs(customItems)
      return
    }

    // Use provided items if available
    if (items) {
      setBreadcrumbs(items)
      return
    }

    // Auto-generate breadcrumbs from URL path
    if (pathname === '/') {
      setBreadcrumbs([])
      return
    }

    const pathSegments = pathname.split('/').filter(segment => segment)
    const generatedBreadcrumbs: BreadcrumbItem[] = []

    let currentPath = ''
    for (const segment of pathSegments) {
      currentPath += `/${segment}`
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()

      generatedBreadcrumbs.push({
        label,
        href: currentPath
      })
    }

    setBreadcrumbs(generatedBreadcrumbs)
  }, [pathname, items, customItems])

  // Don't show breadcrumbs on homepage
  if (pathname === '/' || breadcrumbs.length === 0) {
    return null
  }

  // Generate Schema.org BreadcrumbList structured data
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bereifung24.de'}`
      },
      ...breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: crumb.label,
        item: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://bereifung24.de'}${crumb.href}`
      }))
    ]
  }

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Visual Breadcrumb */}
      <nav 
        aria-label="Breadcrumb" 
        className="bg-gray-50 border-b border-gray-200"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            {/* Home Link */}
            <li>
              <Link
                href="/"
                className="text-gray-500 hover:text-primary-600 transition-colors flex items-center gap-1"
                aria-label="Zur Startseite"
              >
                <Home className="w-4 h-4" />
                <span className="sr-only">Home</span>
              </Link>
            </li>

            {/* Breadcrumb Items */}
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1

              return (
                <li key={crumb.href} className="flex items-center space-x-2">
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  
                  {isLast ? (
                    <span 
                      className="text-gray-900 font-medium"
                      aria-current="page"
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-gray-500 hover:text-primary-600 transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      </nav>
    </>
  )
}
