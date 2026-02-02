'use client'

import { useState } from 'react'
import PayPalButton from './PayPalButton'
import StripeButton from './StripeButton'
import { CreditCard, Smartphone, Banknote, Building2 } from 'lucide-react'

interface PaymentSelectorProps {
  amount: number
  bookingId: string
  workshopPaypalEmail?: string | null
  workshopStripeEnabled?: boolean
  workshopPaymentMethods?: string | null
  onSuccess: () => void
  onError: (error: any) => void
}

type PaymentMethod = 'paypal' | 'stripe' | 'cash' | 'ecCard' | 'creditCard' | 'bankTransfer' | null

export default function PaymentSelector({
  amount,
  bookingId,
  workshopPaypalEmail,
  workshopStripeEnabled,
  workshopPaymentMethods,
  onSuccess,
  onError,
}: PaymentSelectorProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null)

  // Parse payment methods from JSON string
  let paymentMethods: any = {}
  try {
    if (workshopPaymentMethods) {
      paymentMethods = JSON.parse(workshopPaymentMethods)
    }
  } catch (e) {
    console.error('Failed to parse payment methods:', e)
  }

  // Determine available payment options
  const availableOptions = []
  
  // Online payment methods
  if (paymentMethods.paypal && workshopPaypalEmail) {
    availableOptions.push('paypal')
  }
  if (paymentMethods.stripe && workshopStripeEnabled) {
    availableOptions.push('stripe')
  }
  
  // On-site payment methods
  if (paymentMethods.cash) {
    availableOptions.push('cash')
  }
  if (paymentMethods.ecCard) {
    availableOptions.push('ecCard')
  }
  if (paymentMethods.creditCard) {
    availableOptions.push('creditCard')
  }
  if (paymentMethods.bankTransfer) {
    availableOptions.push('bankTransfer')
  }

  // If no payment methods are available, don't show the selector
  if (availableOptions.length === 0) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          Diese Werkstatt hat noch keine Zahlungsmethoden konfiguriert.
        </p>
      </div>
    )
  }

  if (!selectedMethod) {
    return (
      <div className="mt-6 space-y-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            Wie möchten Sie bezahlen?
          </h3>
          <p className="text-sm text-gray-600">
            Wählen Sie Ihre bevorzugte Zahlungsmethode (optional)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PayPal Option */}
          {availableOptions.includes('paypal') && (
            <button
              onClick={() => setSelectedMethod('paypal')}
              className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-2 border-blue-300 hover:border-blue-400 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <img
                    src="https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_74x46.jpg"
                    alt="PayPal"
                    className="h-12"
                  />
                </div>
                <h4 className="font-bold text-blue-900 text-lg mb-1">PayPal</h4>
                <p className="text-sm text-blue-700">
                  Schnell und sicher online bezahlen
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-600">
                  <Smartphone className="h-4 w-4" />
                  <span>Online-Zahlung</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          )}

          {/* Stripe Option (Kreditkarte, SEPA, etc.) */}
          {availableOptions.includes('stripe') && (
            <button
              onClick={() => setSelectedMethod('stripe')}
              className="group relative overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-100 hover:from-indigo-100 hover:to-purple-200 border-2 border-indigo-300 hover:border-indigo-400 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <CreditCard className="h-12 w-12 text-indigo-600" />
                </div>
                <h4 className="font-bold text-indigo-900 text-lg mb-1">
                  Kreditkarte & SEPA
                </h4>
                <p className="text-sm text-indigo-700">
                  Visa, Mastercard, SEPA-Lastschrift
                </p>
                <div className="mt-3 flex gap-2 text-xs text-indigo-600">
                  <span>Online-Zahlung</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-indigo-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          )}

          {/* Barzahlung vor Ort */}
          {availableOptions.includes('cash') && (
            <button
              onClick={() => setSelectedMethod('cash')}
              className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 border-2 border-green-300 hover:border-green-400 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <Banknote className="h-12 w-12 text-green-600" />
                </div>
                <h4 className="font-bold text-green-900 text-lg mb-1">
                  💵 Barzahlung vor Ort
                </h4>
                <p className="text-sm text-green-700">
                  Direkt bei Abholung bar bezahlen
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-green-600">
                  <span>Keine Vorauszahlung</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          )}

          {/* EC-Karte vor Ort */}
          {availableOptions.includes('ecCard') && (
            <button
              onClick={() => setSelectedMethod('ecCard')}
              className="group relative overflow-hidden bg-gradient-to-br from-teal-50 to-cyan-100 hover:from-teal-100 hover:to-cyan-200 border-2 border-teal-300 hover:border-teal-400 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <CreditCard className="h-12 w-12 text-teal-600" />
                </div>
                <h4 className="font-bold text-teal-900 text-lg mb-1">
                  💳 EC-Karte vor Ort
                </h4>
                <p className="text-sm text-teal-700">
                  Mit Girocard direkt vor Ort bezahlen
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-teal-600">
                  <span>Keine Vorauszahlung</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-teal-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          )}

          {/* Kreditkarte vor Ort */}
          {availableOptions.includes('creditCard') && (
            <button
              onClick={() => setSelectedMethod('creditCard')}
              className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100 hover:from-orange-100 hover:to-amber-200 border-2 border-orange-300 hover:border-orange-400 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <CreditCard className="h-12 w-12 text-orange-600" />
                </div>
                <h4 className="font-bold text-orange-900 text-lg mb-1">
                  💳 Kreditkarte vor Ort
                </h4>
                <p className="text-sm text-orange-700">
                  Visa, Mastercard vor Ort bezahlen
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-orange-600">
                  <span>Keine Vorauszahlung</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-orange-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          )}

          {/* Banküberweisung */}
          {availableOptions.includes('bankTransfer') && (
            <button
              onClick={() => setSelectedMethod('bankTransfer')}
              className="group relative overflow-hidden bg-gradient-to-br from-gray-50 to-slate-100 hover:from-gray-100 hover:to-slate-200 border-2 border-gray-300 hover:border-gray-400 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
            >
              <div className="flex flex-col items-center text-center">
                <div className="mb-3">
                  <Building2 className="h-12 w-12 text-gray-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-1">
                  🏦 Banküberweisung
                </h4>
                <p className="text-sm text-gray-700">
                  Per Überweisung bezahlen
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                  <span>Bankdaten bei Werkstatt</span>
                </div>
              </div>
              <div className="absolute inset-0 bg-gray-400 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
            </button>
          )}
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-600">
              <p className="font-semibold mb-1">Hinweis zur Zahlung</p>
              <p>
                Die Zahlung ist optional und keine Voraussetzung für Ihren Termin. 
                Sie können auch direkt vor Ort bei der Werkstatt bezahlen. 
                Wenn Sie jetzt online bezahlen, sieht die Werkstatt, dass Sie bereits bezahlt haben.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Handle selection confirmation
  const getMethodDetails = () => {
    switch (selectedMethod) {
      case 'paypal':
        return {
          title: 'PayPal-Zahlung',
          color: 'blue',
          icon: '💳',
          description: 'Sie bezahlen jetzt sicher online mit PayPal'
        }
      case 'stripe':
        return {
          title: 'Kreditkarte / SEPA',
          color: 'indigo',
          icon: '💳',
          description: 'Sie bezahlen jetzt sicher online'
        }
      case 'cash':
        return {
          title: 'Barzahlung vor Ort',
          color: 'green',
          icon: '💵',
          description: 'Sie bezahlen bar direkt bei der Werkstatt'
        }
      case 'ecCard':
        return {
          title: 'EC-Karte vor Ort',
          color: 'teal',
          icon: '💳',
          description: 'Sie bezahlen mit Girocard direkt bei der Werkstatt'
        }
      case 'creditCard':
        return {
          title: 'Kreditkarte vor Ort',
          color: 'orange',
          icon: '💳',
          description: 'Sie bezahlen mit Kreditkarte direkt bei der Werkstatt'
        }
      case 'bankTransfer':
        return {
          title: 'Banküberweisung',
          color: 'gray',
          icon: '🏦',
          description: 'Sie erhalten die Bankdaten der Werkstatt'
        }
      default:
        return {
          title: 'Zahlung',
          color: 'gray',
          icon: '💰',
          description: ''
        }
    }
  }

  const details = getMethodDetails()

  return (
    <div className="mt-6">
      {/* Online payment methods (PayPal, Stripe) */}
      {(selectedMethod === 'paypal' || selectedMethod === 'stripe') && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">{details.title}</h3>
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Andere Zahlungsart wählen
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-6">
            <div className="bg-white rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-base font-semibold text-gray-700">Zu zahlender Betrag:</span>
                <span className="text-2xl font-bold text-blue-900">{amount.toFixed(2)} €</span>
              </div>
            </div>

            {selectedMethod === 'paypal' ? (
              <PayPalButton
                amount={amount}
                bookingId={bookingId}
                onSuccess={onSuccess}
                onError={onError}
              />
            ) : (
              <StripeButton
                amount={amount}
                bookingId={bookingId}
                onSuccess={onSuccess}
                onError={onError}
              />
            )}
          </div>
        </>
      )}

      {/* On-site payment methods */}
      {selectedMethod && !['paypal', 'stripe'].includes(selectedMethod) && (
        <div className={`bg-${details.color}-50 border-2 border-${details.color}-300 rounded-lg p-6`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className={`w-12 h-12 text-${details.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className={`text-xl font-bold text-${details.color}-900 mb-2`}>
                {details.icon} {details.title}
              </h3>
              <p className={`text-${details.color}-800 mb-3`}>
                {details.description}
              </p>
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-700">Zu zahlender Betrag:</span>
                  <span className={`text-2xl font-bold text-${details.color}-900`}>{amount.toFixed(2)} €</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMethod(null)}
                className={`text-sm text-${details.color}-700 hover:text-${details.color}-900 underline`}
              >
                ← Andere Zahlungsart wählen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
