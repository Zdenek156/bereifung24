const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkBooking() {
  try {
    // Find booking for Dec 26 at 8:00
    const booking = await prisma.booking.findFirst({
      where: {
        appointmentDate: {
          gte: new Date('2025-12-26T00:00:00Z'),
          lt: new Date('2025-12-27T00:00:00Z')
        }
      },
      include: {
        offer: {
          include: {
            tireRequest: {
              include: {
                customer: {
                  include: {
                    user: true
                  }
                },
                vehicle: true
              }
            },
            workshop: true,
            employee: {
              include: {
                user: true
              }
            },
            tireOptions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    if (!booking) {
      console.log('❌ Keine Buchung für 26.12. gefunden')
      return
    }

    console.log('\n=== BOOKING DETAILS ===')
    console.log('Booking ID:', booking.id)
    console.log('Status:', booking.status)
    console.log('Appointment Date:', booking.appointmentDate)
    console.log('Appointment Time:', booking.appointmentTime)
    console.log('Duration:', booking.duration, 'minutes')
    console.log('Google Event ID:', booking.googleEventId || '❌ NICHT GESETZT')
    console.log('Created At:', booking.createdAt)
    console.log('Updated At:', booking.updatedAt)

    console.log('\n=== OFFER DETAILS ===')
    console.log('Offer ID:', booking.offer?.id)
    console.log('Service Type:', booking.offer?.serviceType)
    console.log('Price:', booking.offer?.price, '€')
    console.log('Selected Tire Option IDs:', booking.offer?.selectedTireOptionIds)

    console.log('\n=== WORKSHOP/EMPLOYEE ===')
    console.log('Workshop ID:', booking.offer?.workshop?.id)
    console.log('Workshop Name:', booking.offer?.workshop?.name)
    console.log('Workshop Calendar Mode:', booking.offer?.workshop?.calendarMode)
    console.log('Workshop Google Calendar ID:', booking.offer?.workshop?.googleCalendarId || '❌ NICHT GESETZT')
    
    console.log('\nEmployee ID:', booking.offer?.employee?.id)
    console.log('Employee Name:', booking.offer?.employee?.user?.name)
    console.log('Employee Google Calendar ID:', booking.offer?.employee?.googleCalendarId || '❌ NICHT GESETZT')
    console.log('Employee Google Access Token:', booking.offer?.employee?.googleAccessToken ? '✅ VORHANDEN' : '❌ NICHT GESETZT')
    console.log('Employee Google Refresh Token:', booking.offer?.employee?.googleRefreshToken ? '✅ VORHANDEN' : '❌ NICHT GESETZT')

    console.log('\n=== CUSTOMER DETAILS ===')
    console.log('Customer Name:', booking.offer?.tireRequest?.customer?.user?.name)
    console.log('Customer Email:', booking.offer?.tireRequest?.customer?.user?.email)
    console.log('Customer Google Access Token:', booking.offer?.tireRequest?.customer?.user?.googleAccessToken ? '✅ VORHANDEN' : '❌ NICHT GESETZT')

    if (booking.offer?.serviceType === 'BRAKE_SERVICE') {
      console.log('\n=== BRAKE PACKAGES ===')
      const selectedPackages = booking.offer.tireOptions?.filter(opt => 
        booking.offer.selectedTireOptionIds?.includes(opt.id)
      ) || []
      
      selectedPackages.forEach((pkg, index) => {
        console.log(`\nPaket ${index + 1}:`)
        console.log('  ID:', pkg.id)
        console.log('  Brand:', pkg.brand)
        console.log('  Price per tire:', pkg.pricePerTire, '€')
        console.log('  Montage price:', pkg.montagePrice, '€')
        console.log('  Total:', (pkg.pricePerTire + pkg.montagePrice), '€')
      })
      
      const totalCalculated = selectedPackages.reduce((sum, pkg) => 
        sum + (pkg.pricePerTire || 0) + (pkg.montagePrice || 0), 0
      )
      console.log('\n📊 Berechneter Gesamtpreis:', totalCalculated, '€')
      console.log('💰 Offer.price:', booking.offer.price, '€')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBooking()
