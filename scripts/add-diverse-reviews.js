/**
 * Add diverse reviews to database for homepage rotation
 * Run with: node scripts/add-diverse-reviews.js
 */

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const bcrypt = require('bcryptjs')

const WORKSHOPS = [
  { name: 'Reifen Meister', city: 'München', zipCode: '80331' },
  { name: 'AutoService Schmidt', city: 'Hamburg', zipCode: '20095' },
  { name: 'Reifen-Express', city: 'Berlin', zipCode: '10115' },
  { name: 'KFZ-Werkstatt Müller', city: 'Köln', zipCode: '50667' },
  { name: 'Reifenprofi24', city: 'Frankfurt', zipCode: '60311' },
  { name: 'Auto-Center Wagner', city: 'Stuttgart', zipCode: '70173' },
  { name: 'Reifen-Service Plus', city: 'Düsseldorf', zipCode: '40213' },
  { name: 'Meisterwerkstatt Becker', city: 'Dortmund', zipCode: '44135' },
  { name: 'Reifen Fischer', city: 'Essen', zipCode: '45127' },
  { name: 'AutoHaus Klein', city: 'Leipzig', zipCode: '04109' },
  { name: 'Reifen-Team Weber', city: 'Bremen', zipCode: '28195' },
  { name: 'KFZ-Profi Hoffmann', city: 'Hannover', zipCode: '30159' },
  { name: 'Reifen-Center Koch', city: 'Nürnberg', zipCode: '90402' },
  { name: 'Auto-Service Wolf', city: 'Dresden', zipCode: '01067' },
  { name: 'Meisterbetrieb Schulz', city: 'Mannheim', zipCode: '68159' },
  { name: 'Reifen Schwarz', city: 'Duisburg', zipCode: '47051' },
  { name: 'KFZ-Zentrum Braun', city: 'Bochum', zipCode: '44787' },
  { name: 'Reifen-Station Krüger', city: 'Wuppertal', zipCode: '42103' },
  { name: 'Auto-Werkstatt Zimmermann', city: 'Bielefeld', zipCode: '33602' },
  { name: 'Reifen-Shop Neumann', city: 'Bonn', zipCode: '53111' },
]

const DIVERSE_REVIEWS = [
  {
    firstName: 'Michael',
    lastName: 'Schneider',
    rating: 5,
    comment: 'Superschnelle Abwicklung! Termin online gebucht, pünktlich zum Reifenwechsel erschienen und nach 30 Minuten war alles erledigt. Preis war genau wie angegeben.',
  },
  {
    firstName: 'Sarah',
    lastName: 'Müller',
    rating: 5,
    comment: 'Sehr freundliches Personal und faire Preise. Die Online-Buchung hat einwandfrei funktioniert. Werde ich definitiv weiterempfehlen!',
  },
  {
    firstName: 'Thomas',
    lastName: 'Weber',
    rating: 5,
    comment: 'Endlich eine Plattform, die transparent zeigt, was der Service kostet. Keine versteckten Gebühren, alles lief problemlos.',
  },
  {
    firstName: 'Julia',
    lastName: 'Fischer',
    rating: 5,
    comment: 'Ich war skeptisch, aber das System hat perfekt funktioniert. Online bezahlt, hingegangen, fertig. Kann ich nur empfehlen!',
  },
  {
    firstName: 'Markus',
    lastName: 'Meyer',
    rating: 5,
    comment: 'Mega Service! Habe drei Werkstätten verglichen und die günstigste ausgewählt. War tatsächlich 45€ günstiger als beim letzten Mal. Top!',
  },
  {
    firstName: 'Anna',
    lastName: 'Wagner',
    rating: 5,
    comment: 'Sehr professionelle Abwicklung. Die Werkstatt wusste Bescheid über meine Buchung und hatte alles vorbereitet. Klare 5 Sterne!',
  },
  {
    firstName: 'Patrick',
    lastName: 'Becker',
    rating: 5,
    comment: 'Genial einfach! Keine Anrufe, kein Hin und Her. Online gebucht, bezahlt und zum Termin erschienen. Läuft!',
  },
  {
    firstName: 'Laura',
    lastName: 'Schulz',
    rating: 5,
    comment: 'Ich bin begeistert! Endlich weiß man vorher, was man zahlt. Die Werkstatt war super und der Preis war fair.',
  },
  {
    firstName: 'Christian',
    lastName: 'Hoffmann',
    rating: 4,
    comment: 'Gute Plattform mit transparenten Preisen. Kleiner Abzug weil die Werkstatt 10 Minuten später angefangen hat, aber ansonsten top!',
  },
  {
    firstName: 'Nina',
    lastName: 'Schäfer',
    rating: 5,
    comment: 'Hatte vorher noch nie online eine Werkstatt gebucht. War überraschend einfach und hat einwandfrei geklappt. Danke!',
  },
  {
    firstName: 'David',
    lastName: 'Koch',
    rating: 5,
    comment: 'Preisvergleich hat sich gelohnt! Habe 38€ gespart im Vergleich zu meiner alten Werkstatt. System ist durchdacht.',
  },
  {
    firstName: 'Lisa',
    lastName: 'Bauer',
    rating: 5,
    comment: 'Super schnell und unkompliziert. Genau so muss das sein im Jahr 2026! Keine unnötige Warterei am Telefon.',
  },
  {
    firstName: 'Stefan',
    lastName: 'Klein',
    rating: 5,
    comment: 'Hab die Plattform meinem Bruder empfohlen. Transparenz bei Werkstattpreisen ist längst überfällig. Weiter so!',
  },
  {
    firstName: 'Melanie',
    lastName: 'Wolf',
    rating: 4,
    comment: 'Funktioniert gut, nur die Auswahl an Werkstätten könnte in manchen Regionen größer sein. Aber Service war top!',
  },
  {
    firstName: 'Felix',
    lastName: 'Schröder',
    rating: 5,
    comment: 'Endlich mal eine digitale Lösung die funktioniert! Keine Telefonschleifen mehr. Bin begeistert!',
  },
  {
    firstName: 'Jennifer',
    lastName: 'Neumann',
    rating: 5,
    comment: 'Hatte etwas Sorge wegen Online-Zahlung, aber alles lief sicher und seriös ab. Werkstatt war professionell.',
  },
  {
    firstName: 'Marco',
    lastName: 'Schwarz',
    rating: 5,
    comment: 'Preise waren fair, Buchung einfach, Service schnell. Was will man mehr? Klare Empfehlung!',
  },
  {
    firstName: 'Sabrina',
    lastName: 'Zimmermann',
    rating: 5,
    comment: 'Ich bin kein Tech-Mensch, aber selbst ich kam problemlos durch die Buchung. Sehr benutzerfreundlich!',
  },
  {
    firstName: 'Tim',
    lastName: 'Braun',
    rating: 4,
    comment: 'Gute Idee und funktioniert meistens gut. Einmal musste ich nachfragen, aber Support war hilfreich.',
  },
  {
    firstName: 'Katharina',
    lastName: 'Krüger',
    rating: 5,
    comment: 'Wahnsinn, wie einfach das war! 2 Minuten buchen, bezahlen, fertig. Nie wieder stundenlang Werkstätten anrufen!',
  }
]

async function addDiverseReviews() {
  console.log('🔄 Adding diverse reviews with fake German customers and workshops...')

  try {
    // Hash a dummy password for fake users
    const dummyPassword = await bcrypt.hash('DummyPassword2026!', 10)

    let reviewsAdded = 0

    // Create fake customers, workshops and reviews
    for (let i = 0; i < DIVERSE_REVIEWS.length; i++) {
      const review = DIVERSE_REVIEWS[i]
      const workshop = WORKSHOPS[i % WORKSHOPS.length] // Rotate through workshops

      try {
        // Create customer email
        const customerEmail = `${review.firstName.toLowerCase()}.${review.lastName.toLowerCase()}@review-customer.bereifung24.de`
        
        // Check if customer user already exists
        let customerUser = await prisma.user.findUnique({
          where: { email: customerEmail }
        })

        let customer

        if (!customerUser) {
          // Create fake customer user
          customerUser = await prisma.user.create({
            data: {
              email: customerEmail,
              password: dummyPassword,
              role: 'CUSTOMER',
              firstName: review.firstName,
              lastName: review.lastName,
              phone: '+49 000 00000000',
              zipCode: '10115',
              city: 'Berlin',
              emailVerified: new Date(),
              isActive: true
            }
          })

          // Create customer profile
          customer = await prisma.customer.create({
            data: {
              userId: customerUser.id
            }
          })

          console.log(`✅ Created fake customer: ${review.firstName} ${review.lastName}`)
        } else {
          // Get existing customer
          customer = await prisma.customer.findUnique({
            where: { userId: customerUser.id }
          })
        }

        if (!customer) {
          console.log(`⚠️ Could not find/create customer for ${review.firstName}, skipping`)
          continue
        }

        // Create workshop email
        const workshopEmail = `${workshop.name.toLowerCase().replace(/\s+/g, '.')}@review-workshop.bereifung24.de`

        // Check if workshop user already exists
        let workshopUser = await prisma.user.findUnique({
          where: { email: workshopEmail }
        })

        let workshopProfile

        if (!workshopUser) {
          // Create fake workshop user
          workshopUser = await prisma.user.create({
            data: {
              email: workshopEmail,
              password: dummyPassword,
              role: 'WORKSHOP',
              firstName: 'Inhaber',
              lastName: workshop.name,
              phone: '+49 000 00000000',
              zipCode: workshop.zipCode,
              city: workshop.city,
              emailVerified: new Date(),
              isActive: true
            }
          })

          // Create workshop profile
          workshopProfile = await prisma.workshop.create({
            data: {
              userId: workshopUser.id,
              companyName: workshop.name,
              customerNumber: `WS${Math.floor(100000 + Math.random() * 900000)}`, // Random 6-digit number
              verifiedAt: new Date() // Auto-verify fake workshops
            }
          })

          console.log(`✅ Created fake workshop: ${workshop.name} in ${workshop.city}`)
        } else {
          // Get existing workshop
          workshopProfile = await prisma.workshop.findUnique({
            where: { userId: workshopUser.id }
          })
        }

        if (!workshopProfile) {
          console.log(`⚠️ Could not find/create workshop ${workshop.name}, skipping`)
          continue
        }

        // Check if this customer already has a review for this workshop
        const existingReview = await prisma.review.findFirst({
          where: {
            customerId: customer.id,
            workshopId: workshopProfile.id
          }
        })

        if (existingReview) {
          console.log(`⏭️ Review already exists for ${review.firstName} ${review.lastName} at ${workshop.name}`)
          continue
        }

        // Create a fake booking first (required for review)
        const daysAgo = Math.floor(Math.random() * 60)
        const bookingDate = new Date()
        bookingDate.setDate(bookingDate.getDate() - daysAgo - 7) // Booking 7 days before review

        const reviewDate = new Date()
        reviewDate.setDate(reviewDate.getDate() - daysAgo)

        // Create fake tire request
        const needByDate = new Date(bookingDate)
        needByDate.setDate(needByDate.getDate() + 14) // Need tires 2 weeks after booking

        const tireRequest = await prisma.tireRequest.create({
          data: {
            customerId: customer.id,
            serviceType: 'WHEEL_CHANGE',
            season: 'SUMMER',
            width: 225,
            aspectRatio: 45,
            diameter: 17,
            quantity: 4,
            zipCode: '10115',
            city: 'Berlin',
            radiusKm: 10,
            latitude: 52.5200,
            longitude: 13.4050,
            needByDate: needByDate,
            status: 'COMPLETED'
          }
        })

        // Create fake offer
        const offer = await prisma.offer.create({
          data: {
            tireRequestId: tireRequest.id,
            workshopId: workshopProfile.id,
            tireBrand: 'Continental',
            tireModel: 'PremiumContact 6',
            price: 560.0, // Total price (4 tires * 120 + 80 service)
            pricePerTire: 120.0,
            installationFee: 80.0,
            status: 'ACCEPTED',
            validUntil: bookingDate
          }
        })

        // Create booking
        const booking = await prisma.booking.create({
          data: {
            tireRequestId: tireRequest.id,
            customerId: customer.id,
            workshopId: workshopProfile.id,
            offerId: offer.id,
            appointmentDate: bookingDate,
            appointmentTime: '10:00',
            estimatedDuration: 60,
            paymentMethod: 'CREDIT_CARD',
            paymentStatus: 'PAID',
            paidAt: bookingDate,
            status: 'COMPLETED',
            completedAt: reviewDate
          }
        })

        // Create review
        await prisma.review.create({
          data: {
            bookingId: booking.id,
            customerId: customer.id,
            workshopId: workshopProfile.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: reviewDate
          }
        })

        reviewsAdded++
        console.log(`✅ Added review from ${review.firstName} ${review.lastName} for ${workshop.name}: "${review.comment.substring(0, 50)}..."`)

      } catch (error) {
        console.error(`❌ Error adding review for ${review.firstName}:`, error.message)
      }
    }

    console.log('\n✅ Diverse reviews added successfully!')
    
    // Show stats
    const totalReviews = await prisma.review.count()
    const avgRating = await prisma.review.aggregate({
      _avg: { rating: true }
    })
    
    console.log(`\n📊 Review Stats:`)
    console.log(`   Total Reviews: ${totalReviews}`)
    console.log(`   Average Rating: ${avgRating._avg.rating?.toFixed(2)} ⭐`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addDiverseReviews()
