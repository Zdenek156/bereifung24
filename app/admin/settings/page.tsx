'use client'

import { Card } from '@/components/ui/card'
import { Settings, Database, Shield, Mail } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
        <p className="mt-2 text-gray-600">
          Systemeinstellungen und Konfiguration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/api-settings">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">API-Einstellungen</h3>
            <p className="text-sm text-gray-600">
              Externe API-Keys und Integrationen
            </p>
          </Card>
        </Link>

        <Link href="/admin/email-settings">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Mail className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">E-Mail-Einstellungen</h3>
            <p className="text-sm text-gray-600">
              SMTP und E-Mail-Konfiguration
            </p>
          </Card>
        </Link>

        <Link href="/admin/security">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sicherheit</h3>
            <p className="text-sm text-gray-600">
              Passwörter, Backups und Sicherheit
            </p>
          </Card>
        </Link>
      </div>
    </div>
  )
}
