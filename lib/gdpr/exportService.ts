import { prisma } from '@/lib/prisma'

/**
 * GDPR Data Export Service
 * Collects all personal data for a user according to GDPR Art. 15
 * (Right of access by the data subject)
 */

export interface GDPRExportData {
  requestInfo: {
    exportDate: string
    requestedEmail: string
    dataController: {
      name: string
      address: string
      email: string
      phone: string
    }
  }
  userData: {
    customer?: any
    workshop?: any
    employee?: any
  }
  vehicles: any[]
  tireRequests: any[]
  offers: any[]
  bookings: any[]
  reviews: any[]
  sepaMandates: any[]
  commissionInvoices: any[]
  analytics: any[]
  loginHistory: any[]
}

/**
 * Export all personal data for a given email address
 */
export async function exportUserData(email: string): Promise<GDPRExportData> {
  const exportDate = new Date().toISOString()

  // Initialize export structure
  const exportData: GDPRExportData = {
    requestInfo: {
      exportDate,
      requestedEmail: email,
      dataController: {
        name: 'Bereifung24 - Zdenek Kyzlink',
        address: 'Jahnstraße 2, 71706 Markgröningen',
        email: 'datenschutz@bereifung24.de',
        phone: '+49 7147 9679990'
      }
    },
    userData: {},
    vehicles: [],
    tireRequests: [],
    offers: [],
    bookings: [],
    reviews: [],
    sepaMandates: [],
    commissionInvoices: [],
    analytics: [],
    loginHistory: []
  }

  // 1. Check if user is a Customer
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      customer: true
    }
  })

  if (user?.customer) {
    exportData.userData.customer = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      street: user.street,
      zipCode: user.zipCode,
      city: user.city,
      customerType: user.customerType,
      companyName: user.companyName,
      taxId: user.taxId,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
    
    // Load vehicles separately
    const vehicles = await prisma.vehicle.findMany({
      where: { customerId: user.customer.id },
      include: {
        tireHistory: true
      }
    })
    exportData.vehicles = vehicles

    // Load tire requests separately
    const tireRequests = await prisma.tireRequest.findMany({
      where: { customerId: user.customer.id },
      include: {
        offers: {
          include: {
            workshop: true
          }
        }
      }
    })
    exportData.tireRequests = tireRequests

    // Collect offers from tire requests
    tireRequests.forEach((request: any) => {
      if (request.offers) {
        exportData.offers.push(...request.offers)
      }
    })

    // Load bookings separately
    const bookings = await prisma.booking.findMany({
      where: { customerId: user.customer.id },
      include: {
        workshop: true
      }
    })
    exportData.bookings = bookings

    // Load reviews separately
    const reviews = await prisma.review.findMany({
      where: { customerId: user.customer.id }
    })
    exportData.reviews = reviews
  }

  // 2. Check if user is a Workshop
  const workshop = await prisma.workshop.findFirst({
    where: { 
      user: {
        email: email
      }
    },
    include: {
      user: true,
      offers: {
        include: {
          tireRequest: true
        }
      },
      bookings: {
        include: {
          customer: true
        }
      },
      reviews: true,
      commissionInvoices: true,
      landingPage: true,
      employees: true
    }
  })

  if (workshop) {
    // Remove sensitive fields from user relation
    const { password: _, ...workshopData } = workshop
    if (workshopData.user) {
      const { password, ...userData } = workshopData.user
      workshopData.user = userData
    }
    exportData.userData.workshop = workshopData
    exportData.offers = workshop.offers
    exportData.bookings = workshop.bookings
    exportData.reviews = workshop.reviews
    exportData.commissionInvoices = workshop.commissionInvoices
    
    // Extract SEPA mandate data if available
    if (workshop.sepaMandateRef) {
      exportData.sepaMandates.push({
        mandateRef: workshop.sepaMandateRef,
        mandateDate: workshop.sepaMandateDate,
        iban: workshop.iban ? '***' + workshop.iban.slice(-4) : null, // Masked for security
        accountHolder: workshop.accountHolder,
        gocardlessMandateStatus: workshop.gocardlessMandateStatus
      })
    }
  }

  // 3. Check if user is an Employee
  const employee = await prisma.employee.findFirst({
    where: { email },
    include: {
      bookings: true,
      employeeVacations: true
    }
  })

  if (employee) {
    exportData.userData.employee = employee
  }

  // 4. Get Analytics Data (if internal analytics tracked this email)
  try {
    const analyticsData = await prisma.analyticsEvent.findMany({
      where: {
        OR: [
          { metadata: { contains: email } },
          { userAgent: { contains: email } }
        ]
      },
      take: 100,
      orderBy: { createdAt: 'desc' }
    })
    exportData.analytics = analyticsData
  } catch (error) {
    // Analytics table might not exist or email not tracked
    console.log('Analytics data not available')
  }

  // 5. Get Login History
  // Note: Login history is not persistently stored in the database
  // Only active sessions are tracked via NextAuth
  exportData.loginHistory = [{
    note: 'Login-Historie wird aus Sicherheitsgründen nicht dauerhaft gespeichert. Nur aktive Sessions werden verwaltet.'
  }]

  return exportData
}

/**
 * Format export data for human-readable display
 */
export function formatExportDataForDisplay(data: GDPRExportData): string {
  let output = ''

  output += '═══════════════════════════════════════════════════════════\n'
  output += '            DSGVO DATENAUSKUNFT (ART. 15 DSGVO)\n'
  output += '═══════════════════════════════════════════════════════════\n\n'

  output += 'Export-Datum: ' + new Date(data.requestInfo.exportDate).toLocaleString('de-DE') + '\n'
  output += 'Angefordert für: ' + data.requestInfo.requestedEmail + '\n\n'

  output += 'Verantwortliche Stelle:\n'
  output += '  ' + data.requestInfo.dataController.name + '\n'
  output += '  ' + data.requestInfo.dataController.address + '\n'
  output += '  E-Mail: ' + data.requestInfo.dataController.email + '\n'
  output += '  Telefon: ' + data.requestInfo.dataController.phone + '\n\n'

  output += '───────────────────────────────────────────────────────────\n\n'

  // User Data
  if (data.userData.customer) {
    output += '👤 KUNDENDATEN:\n'
    output += JSON.stringify(data.userData.customer, null, 2) + '\n\n'
  }

  if (data.userData.workshop) {
    output += '🏭 WERKSTATTDATEN:\n'
    output += JSON.stringify(data.userData.workshop, null, 2) + '\n\n'
  }

  if (data.userData.employee) {
    output += '👔 MITARBEITERDATEN:\n'
    output += JSON.stringify(data.userData.employee, null, 2) + '\n\n'
  }

  // Additional data
  if (data.vehicles.length > 0) {
    output += '🚗 FAHRZEUGE: ' + data.vehicles.length + ' Einträge\n\n'
  }

  if (data.tireRequests.length > 0) {
    output += '📋 REIFENAUFTRÄGE: ' + data.tireRequests.length + ' Einträge\n\n'
  }

  if (data.offers.length > 0) {
    output += '💰 ANGEBOTE: ' + data.offers.length + ' Einträge\n\n'
  }

  if (data.bookings.length > 0) {
    output += '📅 BUCHUNGEN: ' + data.bookings.length + ' Einträge\n\n'
  }

  if (data.reviews.length > 0) {
    output += '⭐ BEWERTUNGEN: ' + data.reviews.length + ' Einträge\n\n'
  }

  output += '───────────────────────────────────────────────────────────\n'
  output += 'Hinweis: Dies ist eine vollständige Kopie aller bei uns\n'
  output += 'gespeicherten personenbezogenen Daten gemäß Art. 15 DSGVO.\n'
  output += '═══════════════════════════════════════════════════════════\n'

  return output
}
