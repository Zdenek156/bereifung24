'use client'

import { Card } from '@/components/ui/card'
import { DollarSign, Calendar, FileText, TrendingUp } from 'lucide-react'

export default function PayrollPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lohnabrechnung</h1>
        <p className="mt-2 text-gray-600">
          Gehaltsabrechnungen, Lohnsteuer und Sozialversicherung
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Gesamtlohn</p>
              <p className="text-2xl font-bold text-gray-900">0,00 €</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abrechnungen</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lohnsteuer</p>
              <p className="text-2xl font-bold text-gray-900">0,00 €</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sozialabgaben</p>
              <p className="text-2xl font-bold text-gray-900">0,00 €</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Lohnbuchhaltungs-Modul in Entwicklung
          </h2>
          <p className="text-gray-600 mb-6">
            Dieses Feature wird derzeit entwickelt und steht bald zur Verfügung.
          </p>
        </div>
      </Card>
    </div>
  )
}
