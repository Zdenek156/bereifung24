import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const revalidate = 300 // Revalidate every 5 minutes

export default async function AGBPage() {
  const legal = await prisma.legalText.findUnique({
    where: { key: 'agb' },
    select: { title: true, content: true, updatedAt: true },
  }).catch(() => null)

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-lg shadow-lg">
        <Link href="/" className="text-primary-600 hover:text-primary-700 text-sm mb-6 inline-block">
          ← Zurück zur Startseite
        </Link>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {legal?.title || 'Allgemeine Geschäftsbedingungen (AGB)'}
        </h1>
        {legal?.content ? (
          <div
            className="prose max-w-none space-y-6 text-gray-700"
            dangerouslySetInnerHTML={{ __html: legal.content }}
          />
        ) : (
          <div className="prose max-w-none text-gray-700">
            <p>Die AGB werden derzeit aktualisiert. Bitte versuchen Sie es später erneut.</p>
          </div>
        )}
      </div>
    </div>
  )
}
