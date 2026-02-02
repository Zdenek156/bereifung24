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
  const [clientId, setClientId] = useState<string | null>(null)

  // Fetch PayPal Client ID from API
  useEffect(() => {
    console.log('[PayPalButton] Fetching Client ID...')
    const fetchClientId = async () => {
      try {
        const response = await fetch('/api/admin/api-settings/public?key=PAYPAL_CLIENT_ID')
        console.log('[PayPalButton] API Response:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('[PayPalButton] Client ID loaded:', data.value ? 'YES' : 'NO')
          setClientId(data.value)
        } else {
          console.error('[PayPalButton] Failed to fetch PayPal Client ID:', response.status)
          setScriptError(true)
          setLoading(false)
        }
      } catch (error) {
        console.error('[PayPalButton] Error fetching PayPal Client ID:', error)
        setScriptError(true)
        setLoading(false)
      }
    }
    
    fetchClientId()
  }, [])

  useEffect(() => {
    if (!clientId) {
      console.log('[PayPalButton] Waiting for Client ID...')
      return
    }

    console.log('[PayPalButton] Loading PayPal SDK with Client ID:', clientId)

    // Load PayPal SDK script
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR&locale=de_DE`
    script.async = true
    
    script.onload = () => {
      console.log('[PayPalButton] PayPal SDK loaded successfully')
      setLoading(false)
      initializePayPalButton()
    }
    
    script.onerror = () => {
      console.error('[PayPalButton] Failed to load PayPal SDK')
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
  }, [clientId, amount, bookingId])

  const initializePayPalButton = (retryCount = 0) => {
    if (!paypalRef.current) {
      if (retryCount < 10) {
        setTimeout(() => initializePayPalButton(retryCount + 1), 200)
      } else {
        setScriptError(true)
      }
      return
    }

    if (!window.paypal) {
      if (retryCount < 10) {
        setTimeout(() => initializePayPalButton(retryCount + 1), 200)
      } else {
        setScriptError(true)
      }
      return
    }

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
    }).render(paypalRef.current).catch((err: any) => {
      console.error('Error rendering PayPal button:', err)
      setScriptError(true)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 bg-blue-50 rounded-lg border-2 border-blue-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-700 font-medium">PayPal wird geladen...</span>
      </div>
    )
  }

  if (scriptError) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium text-lg">⚠️ PayPal konnte nicht geladen werden</p>
        <p className="text-sm text-red-600 mt-1">Bitte versuchen Sie es später erneut oder wählen Sie eine andere Zahlungsmethode.</p>
      </div>
    )
  }

  return (
    <div className="paypal-container">
      <div ref={paypalRef} className="min-h-[50px]" />
      <p className="text-xs text-gray-600 text-center mt-3">
        Sichere Zahlung mit PayPal. Sie werden nach der Zahlung automatisch zurückgeleitet.
      </p>
    </div>
  )
}
