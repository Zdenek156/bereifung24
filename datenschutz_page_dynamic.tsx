import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const revalidate = 300

export default async function DatenschutzPage() {
  const legal = await prisma.legalText.findUnique({
    where: { key: 'datenschutz' },
    select: { title: true, content: true, updatedAt: true },
  }).catch(() => null)

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="mb-8">
            <Link href="/" className="text-primary-600 hover:text-primary-700 mb-4 flex items-center inline-flex">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Zurück zur Startseite
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mt-4">
              {legal?.title || 'Datenschutzerklärung'}
            </h1>
          </div>
          {legal?.content ? (
            <div
              className="prose max-w-none space-y-8 text-gray-700"
              dangerouslySetInnerHTML={{ __html: legal.content }}
            />
          ) : (
            <div className="prose max-w-none text-gray-700">
              <p>Die Datenschutzerklärung wird derzeit aktualisiert. Bitte versuchen Sie es später erneut.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
