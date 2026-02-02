'use client'

import { useEffect, useRef, useState } from 'react'

interface PayPalButtonProps {
  amount: number
  bookingId: string
  onSuccess: () => void
  onError: (error: any) => void
}

declare global {
  interface Window {
    paypal?: any
  }
}

/**
 * Official PayPal Smart Payment Button
 * Uses PayPal JavaScript SDK for secure payments
 */
export default function PayPalButton({ amount, bookingId, onSuccess, onError }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [scriptError, setScriptError] = useState(false)

  useEffect(() => {
    // Load PayPal SDK script
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=EUR&locale=de_DE`
    script.async = true
    
    script.onload = () => {
      setLoading(false)
      initializePayPalButton()
    }
    
    script.onerror = () => {
      console.error('Failed to load PayPal SDK')
      setScriptError(true)
      setLoading(false)
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [amount, bookingId])

  const initializePayPalButton = () => {
    if (!window.paypal || !paypalRef.current) return

    // Clear any existing buttons
    paypalRef.current.innerHTML = ''

    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 45
      },

      // Create order on our server
      createOrder: async () => {
        try {
          const response = await fetch('/api/payments/paypal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              bookingId,
              amount
            })
          })

          if (!response.ok) {
            throw new Error('Failed to create PayPal order')
          }

          const data = await response.json()
          return data.orderID
        } catch (error) {
          console.error('Error creating order:', error)
          onError(error)
          throw error
        }
      },

      // Capture order after approval
      onApprove: async (data: any) => {
        try {
          const response = await fetch('/api/payments/paypal', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderID: data.orderID
            })
          })

          if (!response.ok) {
            throw new Error('Failed to capture payment')
          }

          const captureData = await response.json()
          
          if (captureData.status === 'COMPLETED') {
            onSuccess()
          } else {
            throw new Error('Payment not completed')
          }
        } catch (error) {
          console.error('Error capturing payment:', error)
          onError(error)
        }
      },

      onCancel: () => {
        console.log('Payment cancelled by user')
      },

      onError: (err: any) => {
        console.error('PayPal error:', err)
        onError(err)
      }
    }).render(paypalRef.current)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">PayPal wird geladen...</span>
      </div>
    )
  }

  if (scriptError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-800 font-medium">PayPal konnte nicht geladen werden</p>
        <p className="text-sm text-red-600 mt-1">Bitte versuchen Sie es später erneut oder wählen Sie eine andere Zahlungsmethode.</p>
      </div>
    )
  }

  return (
    <div>
      <div ref={paypalRef} />
      <p className="text-xs text-gray-600 text-center mt-3">
        Sichere Zahlung mit PayPal. Sie werden nach der Zahlung automatisch zurückgeleitet.
      </p>
    </div>
  )
}
