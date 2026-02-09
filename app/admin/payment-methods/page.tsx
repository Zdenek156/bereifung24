'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import BackButton from '@/components/BackButton'

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: string
  available: boolean
  category: 'must-have' | 'nice-to-have'
}

interface PaymentMethodsData {
  paymentMethods: PaymentMethod[]
  categories: {
    mustHave: PaymentMethod[]
    niceToHave: PaymentMethod[]
  }
  summary: {
    total: number
    active: number
    inactive: number
  }
}

export default function PaymentMethodsPage() {
  const [data, setData] = useState<PaymentMethodsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/admin/payment-methods')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Lade Zahlungsmethoden...</div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Fehler beim Laden der Zahlungsmethoden</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <h1 className="text-3xl font-bold">Zahlungsmethoden</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">Gesamt</div>
          <div className="text-3xl font-bold">{data.summary.total}</div>
        </Card>
        <Card className="p-6 bg-green-50 dark:bg-green-900/20">
          <div className="text-sm text-green-800 dark:text-green-400">Aktiviert</div>
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {data.summary.active}
          </div>
        </Card>
        <Card className="p-6 bg-gray-50 dark:bg-gray-800">
          <div className="text-sm text-gray-600 dark:text-gray-400">Deaktiviert</div>
          <div className="text-3xl font-bold text-gray-600 dark:text-gray-400">
            {data.summary.inactive}
          </div>
        </Card>
      </div>

      {/* Info Box */}
      <Card className="p-4 mb-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <div className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
              Zentrale Konfiguration
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-400">
              Diese Zahlungsmethoden sind für <strong>alle Werkstätten</strong> verfügbar.
              Änderungen müssen im{' '}
              <a 
                href="https://dashboard.stripe.com/settings/payment_methods" 
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold hover:text-blue-600"
              >
                Stripe Dashboard
              </a>{' '}
              vorgenommen werden.
            </div>
          </div>
        </div>
      </Card>

      {/* Must-Have Methods */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Must-Have</h2>
          <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 px-2 py-1 rounded">
            Wichtig für DE
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.categories.mustHave.map((method) => (
            <Card 
              key={method.id} 
              className={`p-6 ${method.available 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-4xl">{method.icon}</div>
                {method.available ? (
                  <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400 px-2 py-1 rounded">
                    Aktiv
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    Inaktiv
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1">{method.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Nice-to-Have Methods */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Nice-to-Have</h2>
          <span className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
            Optional
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.categories.niceToHave.map((method) => (
            <Card 
              key={method.id} 
              className={`p-6 ${method.available 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                : 'opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-4xl">{method.icon}</div>
                {method.available ? (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-400 px-2 py-1 rounded">
                    Aktiv
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    Inaktiv
                  </span>
                )}
              </div>
              <h3 className="font-bold text-lg mb-1">{method.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{method.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* PayPal Note */}
      <Card className="p-4 mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🅿️</div>
          <div>
            <div className="font-semibold text-yellow-900 dark:text-yellow-300 mb-1">
              PayPal (separat implementiert)
            </div>
            <div className="text-sm text-yellow-800 dark:text-yellow-400">
              PayPal läuft parallel zu Stripe und wird über die Workshop-Einstellungen konfiguriert.
              Werkstätten müssen ihre <code className="bg-yellow-100 dark:bg-yellow-900/50 px-1 py-0.5 rounded">paypalEmail</code> hinterlegen.
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
