'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, TrendingUp, DollarSign, Link as LinkIcon } from 'lucide-react'
import BackButton from '@/components/BackButton'

export default function AffiliatesPage() {
  return (
    <div className="p-6">
      <div className="mb-8 flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Affiliate-Verwaltung</h1>
        <p className="mt-2 text-gray-600">
          Verwalte Affiliate-Partner und Tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Aktive Partner</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversions</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Umsatz</p>
              <p className="text-2xl font-bold text-gray-900">0,00 €</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-12 text-center">
        <div className="max-w-md mx-auto">
          <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Affiliate-System in Entwicklung
          </h2>
          <p className="text-gray-600 mb-6">
            Dieses Feature wird derzeit entwickelt und steht bald zur Verfügung.
          </p>
        </div>
      </Card>
    </div>
  )
}
