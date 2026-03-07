'use client'

import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Clock, ChevronRight } from 'lucide-react'

interface Appointment {
  id: string
  type: string
  date: string
  time: string
  workshopName: string
  workshopId: string
  workshopAddress: string
  serviceType: string
  vehicleName: string
  status: string
  totalPrice: number
}

interface RecentBooking {
  id: string
  date: string
  workshopName: string
  serviceType: string
  totalPrice: number
}

interface NextAppointmentCardProps {
  nextAppointment: Appointment | null
  recentBookings: RecentBooking[]
  loading: boolean
}

const statusBadge: Record<string, { label: string; classes: string }> = {
  CONFIRMED: {
    label: 'Bestätigt',
    classes: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
  },
  RESERVED: {
    label: 'Reserviert',
    classes: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  },
  PENDING: {
    label: 'Ausstehend',
    classes: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  }
}

export default function NextAppointmentCard({ nextAppointment, recentBookings, loading }: NextAppointmentCardProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex flex-col">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-700 p-5 h-full flex flex-col">
      {nextAppointment ? (
        <>
          {/* Has upcoming appointment */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            Ihr nächster Termin
          </h3>

          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-3 border border-primary-100 dark:border-primary-800">
            {/* Date & Time */}
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="font-semibold text-gray-900 dark:text-white text-sm">
                {new Date(nextAppointment.date).toLocaleDateString('de-DE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {nextAppointment.time} Uhr
              </span>
            </div>

            {/* Workshop */}
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {nextAppointment.workshopName}
              </span>
            </div>

            {/* Service */}
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {nextAppointment.serviceType}
              </span>
              {nextAppointment.vehicleName && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  · {nextAppointment.vehicleName}
                </span>
              )}
            </div>

            {/* Status badge */}
            <div className="flex items-center justify-between mt-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[nextAppointment.status]?.classes || 'bg-gray-100 text-gray-800'}`}>
                {statusBadge[nextAppointment.status]?.label || nextAppointment.status}
              </span>
              <button
                onClick={() => router.push('/dashboard/customer/bookings')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
              >
                Details
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* No upcoming appointment */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            Meine Buchungen
          </h3>

          <div className="flex-1 flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Keine offenen Buchungen</p>
            <button
              onClick={() => router.push('/home')}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              Reifenservice buchen
            </button>
          </div>
        </>
      )}

      {/* Recent bookings */}
      {recentBookings.length > 0 && (
        <div className="mt-auto pt-3 border-t dark:border-gray-700">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Letzte Buchungen
          </h4>
          <div className="space-y-2">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {new Date(booking.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {booking.workshopName}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400 flex-shrink-0 ml-2">
                  {booking.totalPrice > 0 ? `${booking.totalPrice.toFixed(2)} €` : ''}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={() => router.push('/dashboard/customer/bookings')}
            className="mt-2 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center gap-1"
          >
            Alle Buchungen anzeigen
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
