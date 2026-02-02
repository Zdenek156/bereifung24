'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface StripeButtonProps {
  amount: number
  bookingId: string
  onSuccess: () => void
  onError: (error: any) => void
}

export default function StripeButton({ amount, bookingId, onSuccess, onError }: StripeButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calculate total with Stripe fee
  const stripeFeePercent = 0.015 // 1.5%
  const stripeFeeFixed = 0.25 // €0.25
  const stripeFee = (amount * stripeFeePercent) + stripeFeeFixed
  const totalAmount = amount + stripeFee

  const handlePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          amount,
        }),
      })

      const data = await response.json()

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      } else {
        setError(data.error || 'Fehler beim Erstellen der Zahlung')
        onError(new Error(data.error))
      }
    } catch (err: any) {
      console.error('Stripe payment error:', err)
      setError('Fehler beim Initialisieren der Zahlung')
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">Zahlung konnte nicht initialisiert werden</p>
        <p className="text-sm text-red-600 mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">Servicebetrag:</span>
          <span className="font-mono">{amount.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-700">Stripe-Gebühr (1,5% + 0,25 €):</span>
          <span className="font-mono text-sm text-gray-600">+ {stripeFee.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-blue-300">
          <span className="font-semibold text-gray-900">Gesamt:</span>
          <span className="font-bold text-lg">{totalAmount.toFixed(2)} €</span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full bg-[#635bff] hover:bg-[#4f46e5] text-white font-semibold py-6 text-lg"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Weiterleitung zu Stripe...
          </span>
        ) : (
          <span className="flex flex-col items-center justify-center gap-3">
            <span className="text-base font-semibold">Jetzt bezahlen ({totalAmount.toFixed(2)} €)</span>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {/* Verwende Text-Badges statt eigene Logos */}
              <div className="flex items-center gap-1 bg-white/90 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
                Kreditkarte
              </div>
              <div className="flex items-center gap-1 bg-white/90 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                PayPal
              </div>
              <div className="flex items-center gap-1 bg-white/90 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                Klarna
              </div>
              <div className="flex items-center gap-1 bg-white/90 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                giropay
              </div>
              <div className="flex items-center gap-1 bg-white/90 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                SOFORT
              </div>
              <div className="flex items-center gap-1 bg-white/90 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-semibold text-gray-700 shadow-sm">
                SEPA
              </div>
            </div>
          </span>
        )}
      </Button>

      <p className="text-xs text-gray-600 text-center">
        Sichere Zahlung über Stripe. Die Werkstatt erhält {amount.toFixed(2)} €. Google Pay & Apple Pay automatisch verfügbar auf unterstützten Geräten.
      </p>
    </div>
  )
}
