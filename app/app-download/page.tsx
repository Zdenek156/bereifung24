import Link from 'next/link'
import { Smartphone, Download, Check } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function AppDownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Bereifung24
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
              <Smartphone className="w-10 h-10 text-primary-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bereifung24 Mobile App
            </h1>
            <p className="text-xl text-gray-600">
              Bald verfügbar für iOS und Android
            </p>
          </div>

          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Die App ist in Entwicklung 🚀
            </h2>
            <p className="text-gray-600 mb-6">
              Wir arbeiten derzeit an unserer mobilen App, die Ihnen den Zugriff auf alle 
              Bereifung24-Services noch einfacher macht.
            </p>

            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Geplante Features:
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Schnelle Anfragen</p>
                  <p className="text-sm text-gray-600">Reifenwechsel unterwegs buchen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Push-Benachrichtigungen</p>
                  <p className="text-sm text-gray-600">Sofort über neue Angebote informiert</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Standort-Services</p>
                  <p className="text-sm text-gray-600">Werkstätten in Ihrer Nähe finden</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Termin-Verwaltung</p>
                  <p className="text-sm text-gray-600">Alle Buchungen auf einen Blick</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Smart Reifen-Berater</p>
                  <p className="text-sm text-gray-600">KI-gestützte Empfehlungen</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-900">Wetter-Alarm</p>
                  <p className="text-sm text-gray-600">Automatische Benachrichtigungen</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">
                📧 Benachrichtigung erhalten
              </h3>
              <p className="text-gray-600 mb-4">
                Möchten Sie informiert werden, sobald die App verfügbar ist? 
                Registrieren Sie sich jetzt und wir benachrichtigen Sie als Erster!
              </p>
              <Link 
                href="/register/customer"
                className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
              >
                Jetzt registrieren
              </Link>
            </div>

            <p className="text-sm text-gray-500 text-center">
              Voraussichtlicher Start: Q2 2026
            </p>
          </Card>

          <Card className="p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              In der Zwischenzeit...
            </h2>
            <p className="text-gray-600 mb-6">
              Nutzen Sie unsere vollständig optimierte Web-App! Sie funktioniert auf allen Geräten 
              und bietet bereits alle Features, die Sie benötigen.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                href="/dashboard/customer"
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
              >
                Zum Dashboard
              </Link>
              <Link 
                href="/register/customer"
                className="px-6 py-3 border-2 border-primary-600 text-primary-600 hover:bg-primary-50 rounded-lg font-semibold transition-colors"
              >
                Kostenlos registrieren
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
