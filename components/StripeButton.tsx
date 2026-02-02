'use client'

import { useEffect, useState } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

interface StripeButtonProps {
  amount: number
  bookingId: string
  onSuccess: () => void
  onError: (error: any) => void
}

export default function StripeButton({ amount, bookingId, onSuccess, onError }: StripeButtonProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load Stripe publishable key from database
    fetch('/api/config/stripe')
      .then((res) => res.json())
      .then((data) => {
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey))
        } else {
          setError('Stripe ist nicht konfiguriert')
        }
      })
      .catch((err) => {
        console.error('Error loading Stripe config:', err)
        setError('Stripe konnte nicht geladen werden')
        onError(err)
      })
  }, [])

  useEffect(() => {
    if (!stripePromise) return

    // Create PaymentIntent on mount
    fetch('/api/payments/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingId,
        amount,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
        } else {
          setError(data.error || 'Fehler beim Initialisieren der Zahlung')
        }
      })
      .catch((err) => {
        console.error('Error creating payment intent:', err)
        setError('Fehler beim Initialisieren der Zahlung')
        onError(err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [bookingId, amount, stripePromise])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Zahlung wird vorbereitet...</span>
      </div>
    )
  }

  if (error || !clientSecret || !stripePromise) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">Zahlung konnte nicht initialisiert werden</p>
        <p className="text-sm text-red-600 mt-1">{error || 'Bitte versuchen Sie es später erneut.'}</p>
      </div>
    )
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
          },
        },
        locale: 'de',
      }}
    >
      <CheckoutForm 
        amount={amount}
        bookingId={bookingId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}

function CheckoutForm({ amount, bookingId, onSuccess, onError }: StripeButtonProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/customer/appointments?payment=success`,
        },
      })

      if (error) {
        setErrorMessage(error.message || 'Ein Fehler ist aufgetreten')
        onError(error)
      } else {
        onSuccess()
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ein Fehler ist aufgetreten')
      onError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Zahlung wird verarbeitet...
          </span>
        ) : (
          `Jetzt ${amount.toFixed(2)} € bezahlen`
        )}
      </button>

      <p className="text-xs text-gray-600 text-center">
        Sichere Zahlung mit Kreditkarte, SEPA-Lastschrift oder anderen Zahlungsmethoden über Stripe.
      </p>
    </form>
  )
}
