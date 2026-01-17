'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { BookOpen, Search, FileText, Video, HelpCircle } from 'lucide-react'
import BackButton from '@/components/BackButton'

export default function WikiPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'B24_EMPLOYEE') {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-7 h-7 text-purple-600" />
                Wissensdatenbank
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                FAQ, Anleitungen & Vorlagen
              </p>
            </div>
            <BackButton />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Durchsuche die Wissensdatenbank..."
              className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Artikel & Anleitungen</h3>
            <p className="text-sm text-gray-600">
              Schritt-für-Schritt Anleitungen für tägliche Aufgaben
            </p>
            <div className="mt-4 text-sm text-blue-600 font-medium">
              Bald verfügbar →
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <HelpCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">FAQ</h3>
            <p className="text-sm text-gray-600">
              Häufig gestellte Fragen und Antworten
            </p>
            <div className="mt-4 text-sm text-green-600 font-medium">
              Bald verfügbar →
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Vorlagen & Formulare</h3>
            <p className="text-sm text-gray-600">
              Dokumente und Vorlagen zum Download
            </p>
            <div className="mt-4 text-sm text-purple-600 font-medium">
              Bald verfügbar →
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Video className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video-Tutorials</h3>
            <p className="text-sm text-gray-600">
              Lernvideos und Schulungsmaterial
            </p>
            <div className="mt-4 text-sm text-orange-600 font-medium">
              Bald verfügbar →
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Richtlinien & Policies</h3>
            <p className="text-sm text-gray-600">
              Unternehmensrichtlinien und Compliance
            </p>
            <div className="mt-4 text-sm text-red-600 font-medium">
              Bald verfügbar →
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Onboarding</h3>
            <p className="text-sm text-gray-600">
              Informationen für neue Mitarbeiter
            </p>
            <div className="mt-4 text-sm text-indigo-600 font-medium">
              Bald verfügbar →
            </div>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-8 text-center">
          <BookOpen className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Wissensdatenbank wird befüllt
          </h3>
          <p className="text-gray-600">
            Die Wissensdatenbank wird gerade mit Inhalten befüllt. Bald findest du hier
            Anleitungen, FAQs, Vorlagen und vieles mehr.
          </p>
        </div>
      </div>
    </div>
  )
}
