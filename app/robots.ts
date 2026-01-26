import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/employee/', '/api/auth/']
      }
    ],
    sitemap: [
      'https://bereifung24.de/sitemap.xml',
      'https://bereifung24.de/sitemap-blog.xml'
    ]
  }
}
