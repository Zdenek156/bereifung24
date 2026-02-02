# 📊 BEREIFUNG24 BUCHUNGSSYSTEM - KOMPLETTER ABLAUF

**Erstellt am:** 1. Februar 2026  
**Dokumentation des kompletten Buchungsprozesses von Registrierung bis Terminbuchung**

---

## 🎯 Mermaid Flowchart (Visuell)

```mermaid
flowchart TD
    Start([Besucher auf Website]) --> RegChoice{Registriert?}
    
    RegChoice -->|Nein| Register[Registrierung]
    Register --> RegType{Nutzertyp}
    RegType -->|Kunde| RegCustomer[POST /api/auth/register/customer]
    RegType -->|Werkstatt| RegWorkshop[POST /api/auth/register/workshop]
    
    RegCustomer --> DBUser1[(User Tabelle<br/>role: CUSTOMER)]
    DBUser1 --> DBCustomer[(Customer Tabelle)]
    DBCustomer --> Email1[📧 Willkommensmail<br/>welcomeCustomerEmailTemplate]
    
    RegWorkshop --> DBUser2[(User Tabelle<br/>role: WORKSHOP)]
    DBUser2 --> DBWorkshop[(Workshop Tabelle<br/>isVerified: false)]
    DBWorkshop --> Email2[📧 Verifizierung ausstehend<br/>welcomeWorkshopEmailTemplate]
    Email2 --> AdminVerify[Admin verifiziert Werkstatt]
    AdminVerify --> Email3[📧 Werkstatt verifiziert<br/>workshopVerifiedEmailTemplate]
    
    RegChoice -->|Ja| Login[Login mit NextAuth]
    Login --> Dashboard{Dashboard}
    
    Email1 --> Dashboard
    Email3 --> Dashboard
    
    Dashboard -->|Kunde| CustomerDash[/dashboard/customer]
    Dashboard -->|Werkstatt| WorkshopDash[/dashboard/workshop]
    
    CustomerDash --> CreateRequest[Reifenanfrage erstellen]
    CreateRequest --> RequestForm[Formular ausfüllen:<br/>- Reifengröße<br/>- Saison<br/>- Menge<br/>- Termin<br/>- Umkreis]
    
    RequestForm --> PostRequest[POST /api/tire-requests]
    PostRequest --> DBRequest[(TireRequest Tabelle<br/>status: PENDING)]
    
    DBRequest --> Geocode[Geocoding von PLZ<br/>latitude/longitude]
    Geocode --> FindWorkshops[Werkstätten im Umkreis finden<br/>calculateDistance]
    
    FindWorkshops --> DBNotify{Für jede Werkstatt}
    DBNotify --> CheckNotif{emailNotifyRequests<br/>= true?}
    CheckNotif -->|Ja| Email4[📧 Neue Anfrage<br/>newTireRequestEmailTemplate]
    CheckNotif -->|Nein| Skip[Übersprungen]
    
    Email4 --> UpdateStatus1[TireRequest.workshopsNotified++]
    Skip --> UpdateStatus1
    
    UpdateStatus1 --> Email5[📧 Bestätigung an Kunde<br/>Ihre Anfrage wurde erstellt]
    
    Email5 --> WorkshopDash
    WorkshopDash --> BrowseRequests[Anfragen durchsuchen<br/>/dashboard/workshop/browse-requests]
    
    BrowseRequests --> ViewRequest[Anfrage Details ansehen]
    ViewRequest --> CreateOffer[Angebot erstellen]
    
    CreateOffer --> OfferForm[Formular:<br/>- Reifenmarke/Modell<br/>- Preis pro Reifen<br/>- Montagepreis<br/>- Gültig bis<br/>- Dauer]
    
    OfferForm --> PostOffer[POST /api/workshop/tire-requests/id/offers]
    PostOffer --> DBOffer[(Offer Tabelle<br/>status: PENDING)]
    DBOffer --> DBTireOptions[(TireOption Tabelle<br/>Mehrere Optionen möglich)]
    
    DBTireOptions --> UpdateStatus2[TireRequest.status = QUOTED]
    UpdateStatus2 --> Email6[📧 Neues Angebot<br/>newOfferEmailTemplate]
    
    Email6 --> CustomerDash2[Kunde sieht Angebote<br/>/dashboard/customer/requests]
    CustomerDash2 --> CompareOffers[Angebote vergleichen]
    
    CompareOffers --> AcceptChoice{Angebot<br/>annehmen?}
    AcceptChoice -->|Nein| Decline[Ablehnen]
    Decline --> UpdateOffer1[Offer.status = DECLINED]
    
    AcceptChoice -->|Ja| AcceptOffer[POST /api/offers/id/accept]
    AcceptOffer --> UpdateOffer2[Offer.status = ACCEPTED<br/>Offer.acceptedAt = now]
    UpdateOffer2 --> DeclineOthers[Andere Angebote ablehnen]
    DeclineOthers --> UpdateStatus3[TireRequest.status = ACCEPTED]
    
    UpdateStatus3 --> Email7[📧 Angebot angenommen<br/>offerAcceptedEmailTemplate<br/>an Werkstatt]
    
    Email7 --> BookingStep[Termin buchen<br/>/dashboard/customer/offers/id/book]
    
    BookingStep --> CalendarView[Kalender ansehen<br/>Verfügbare Termine]
    CalendarView --> SelectDate[Datum + Uhrzeit wählen]
    
    SelectDate --> BookingForm[Buchungsformular:<br/>- Zahlungsmethode<br/>- Notizen<br/>- Reifenoption]
    
    BookingForm --> PostBooking[POST /api/bookings]
    PostBooking --> DBBooking[(Booking Tabelle<br/>status: CONFIRMED)]
    
    DBBooking --> UpdateStatus4[TireRequest.status = BOOKED]
    UpdateStatus4 --> GoogleCal{Google Calendar<br/>aktiviert?}
    
    GoogleCal -->|Ja| CreateEvent[Google Calendar Event erstellen<br/>Workshop oder Employee Kalender]
    GoogleCal -->|Nein| SkipCal[Kein Event]
    
    CreateEvent --> ICS[ICS Datei generieren<br/>createICS]
    SkipCal --> ICS
    
    ICS --> Email8[📧 Buchungsbestätigung Kunde<br/>bookingConfirmationCustomerEmailTemplate<br/>+ ICS Anhang]
    
    Email8 --> CheckWorkshopNotif{Workshop<br/>emailNotifyBookings?}
    CheckWorkshopNotif -->|Ja| Email9[📧 Neue Buchung<br/>bookingConfirmationWorkshopEmailTemplate]
    CheckWorkshopNotif -->|Nein| SkipEmail[Keine Mail]
    
    Email9 --> Complete([✅ Buchung abgeschlossen])
    SkipEmail --> Complete
    
    Complete --> WorkshopCalendar[Werkstatt sieht Termin<br/>/dashboard/workshop/calendar]
    
    style Start fill:#e1f5e1
    style Complete fill:#e1f5e1
    style DBUser1 fill:#fff4e6
    style DBUser2 fill:#fff4e6
    style DBCustomer fill:#fff4e6
    style DBWorkshop fill:#fff4e6
    style DBRequest fill:#fff4e6
    style DBOffer fill:#fff4e6
    style DBTireOptions fill:#fff4e6
    style DBBooking fill:#fff4e6
    style Email1 fill:#e3f2fd
    style Email2 fill:#e3f2fd
    style Email3 fill:#e3f2fd
    style Email4 fill:#e3f2fd
    style Email5 fill:#e3f2fd
    style Email6 fill:#e3f2fd
    style Email7 fill:#e3f2fd
    style Email8 fill:#e3f2fd
    style Email9 fill:#e3f2fd
```

---

## 📝 ASCII Diagramm (Kompakt)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BEREIFUNG24 BUCHUNGSSYSTEM - FLOW                         │
└─────────────────────────────────────────────────────────────────────────────┘

PHASE 1: REGISTRIERUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Besucher → Registrierung

KUNDE:
  POST /api/auth/register/customer
    ├→ [DB] User (role: CUSTOMER)
    ├→ [DB] Customer
    └→ 📧 welcomeCustomerEmailTemplate("Willkommen bei Bereifung24")

WERKSTATT:
  POST /api/auth/register/workshop
    ├→ [DB] User (role: WORKSHOP)
    ├→ [DB] Workshop (isVerified: false)
    ├→ 📧 welcomeWorkshopEmailTemplate("Verifizierung ausstehend")
    ├→ Admin verifiziert manuell
    └→ 📧 workshopVerifiedEmailTemplate("Werkstatt aktiviert")


PHASE 2: REIFENANFRAGE ERSTELLEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kunde → Dashboard → "Neue Anfrage"

  1. Formular ausfüllen:
     - Reifengröße (width, aspectRatio, diameter)
     - Saison (SUMMER, WINTER, ALL_SEASON)
     - Menge (quantity)
     - Benötigt bis (needByDate)
     - Umkreis (radiusKm)
     - Zusatzoptionen (runFlat, tireDisposal)

  2. POST /api/tire-requests
     ├→ [ABFRAGE] Customer.id aus Session
     ├→ Geocoding: PLZ → latitude/longitude
     ├→ [DB] TireRequest erstellen
     │   └─ status: "PENDING"
     │
     ├→ [ABFRAGE] Workshop.findMany() im Umkreis
     │   └─ calculateDistance(lat1, lon1, lat2, lon2)
     │
     ├→ Für jede Werkstatt im Umkreis:
     │   └─ IF Workshop.emailNotifyRequests = true:
     │       └→ 📧 newTireRequestEmailTemplate()
     │           "Neue Reifenanfrage in Ihrer Nähe"
     │
     ├→ [UPDATE] TireRequest.workshopsNotified = count
     └→ 📧 "Ihre Anfrage wurde erstellt"


PHASE 3: WERKSTATT ERSTELLT ANGEBOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Werkstatt → Dashboard → "Anfragen durchsuchen"

  1. [ABFRAGE] TireRequest mit Filters
     - Status: PENDING, QUOTED
     - Im Umkreis der Werkstatt
     - Include: Customer, User

  2. Werkstatt wählt Anfrage → "Angebot erstellen"

  3. Formular ausfüllen:
     - Reifenmarke + Modell (brandModel)
     - Preis pro Reifen (pricePerTire)
     - Montagepreis (installationFee)
     - Gültig bis (validUntil)
     - Geschätzte Dauer (durationMinutes)
     - MEHRERE Reifenoptionen möglich!

  4. POST /api/workshop/tire-requests/[id]/offers
     ├→ [ABFRAGE] Workshop.id aus Session
     ├→ [DB] Offer erstellen
     │   ├─ tireRequestId
     │   ├─ workshopId
     │   ├─ tireBrand, tireModel
     │   ├─ price (Gesamtpreis)
     │   ├─ installationFee
     │   ├─ validUntil
     │   ├─ durationMinutes
     │   └─ status: "PENDING"
     │
     ├→ [DB] TireOption.create() (1-3 Optionen)
     │   ├─ offerId
     │   ├─ brand, model
     │   ├─ pricePerTire
     │   └─ montagePrice
     │
     ├→ [UPDATE] TireRequest.status = "QUOTED"
     └→ 📧 newOfferEmailTemplate()
         "Neues Angebot von [Werkstatt]"


PHASE 4: KUNDE NIMMT ANGEBOT AN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kunde → Dashboard → "Meine Anfragen" → Angebote vergleichen

  1. [ABFRAGE] Offer.findMany()
     WHERE: tireRequestId = X
     INCLUDE: Workshop, TireOptions

  2. Kunde wählt Angebot → "Annehmen"

  3. POST /api/offers/[id]/accept
     ├→ [ABFRAGE] Offer mit allen Relations
     │
     ├→ [UPDATE] Offer.status = "ACCEPTED"
     ├→ [UPDATE] Offer.acceptedAt = now()
     │
     ├→ [UPDATE] Andere Angebote → status = "DECLINED"
     │
     ├→ [UPDATE] TireRequest.status = "ACCEPTED"
     │
     └→ 📧 offerAcceptedEmailTemplate()
         "Ihr Angebot wurde angenommen" → Werkstatt


PHASE 5: TERMIN BUCHEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Kunde → "Termin buchen"

  1. Kalender-Ansicht:
     ├→ [ABFRAGE] Workshop.workingHours
     ├→ [ABFRAGE] Workshop.workingDays
     ├→ [ABFRAGE] WorkshopVacation (Urlaubszeiten)
     ├→ [ABFRAGE] Booking.findMany() (gebuchte Termine)
     └→ Verfügbare Slots berechnen

  2. Kunde wählt:
     - Datum (appointmentDate)
     - Uhrzeit (appointmentTime)
     - Zahlungsmethode (paymentMethod)
     - Notizen (customerMessage)
     - Reifenoption (selectedTireOptionId)

  3. POST /api/bookings
     ├→ [ABFRAGE] Offer mit allen Daten
     │   INCLUDE: Workshop, Customer, TireRequest, TireOptions
     │
     ├→ [DB] Booking erstellen
     │   ├─ tireRequestId
     │   ├─ offerId
     │   ├─ customerId
     │   ├─ workshopId
     │   ├─ appointmentDate
     │   ├─ appointmentTime
     │   ├─ status: "CONFIRMED"
     │   ├─ estimatedDuration
     │   ├─ paymentMethod
     │   └─ customerNotes
     │
     ├→ [UPDATE] TireRequest.status = "BOOKED"
     │
     ├→ Google Calendar Integration:
     │   IF Workshop.googleAccessToken:
     │     ├→ Create Event in Workshop Calendar
     │     OR Employee Calendar (IF Employee.googleAccessToken)
     │     └→ [UPDATE] Booking.googleEventId
     │
     ├→ ICS File generieren (createICS):
     │   ├─ DTSTART, DTEND
     │   ├─ SUMMARY: "Reifenmontage bei [Werkstatt]"
     │   ├─ LOCATION: Werkstatt Adresse
     │   └─ ORGANIZER: Workshop Email
     │
     ├→ 📧 bookingConfirmationCustomerEmailTemplate()
     │   ├─ Empfänger: Kunde
     │   ├─ Anhang: termin.ics
     │   └─ Inhalt:
     │       - Werkstatt Name/Adresse/Telefon
     │       - Termin (Datum + Uhrzeit)
     │       - Reifen (Marke + Modell + Größe)
     │       - Gesamtpreis
     │       - Zahlungsmethode
     │
     └→ IF Workshop.emailNotifyBookings = true:
         └→ 📧 bookingConfirmationWorkshopEmailTemplate()
             ├─ Empfänger: Werkstatt
             └─ Inhalt:
                 - Kundendaten (Name, Tel, Email, Adresse)
                 - Termin
                 - Fahrzeuginfo
                 - Reifendetails
                 - Kundennotizen


PHASE 6: NACH DER BUCHUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Werkstatt → Dashboard → Kalender

  1. [ABFRAGE] Booking.findMany()
     WHERE: workshopId = X
     INCLUDE: Customer, TireRequest, Offer

  2. Termine im Kalender anzeigen

  3. Werkstatt kann:
     - Termin Details ansehen
     - Google Calendar Sync
     - Termin als "COMPLETED" markieren
     - Rechnung erstellen
```

---

## 🗄️ DATENBANK TABELLEN

### User Tabelle
```prisma
model User {
  id              String
  email           String   @unique
  password        String
  role            Role     (CUSTOMER, WORKSHOP, ADMIN, EMPLOYEE)
  firstName       String
  lastName        String
  phone           String?
  street          String?
  zipCode         String?
  city            String?
  emailVerified   DateTime?
  isActive        Boolean
  
  customer        Customer?
  workshop        Workshop?
  employee        Employee?
}
```

### Customer Tabelle
```prisma
model Customer {
  id              String
  userId          String   @unique
  user            User
  
  tireRequests    TireRequest[]
  bookings        Booking[]
}
```

### Workshop Tabelle
```prisma
model Workshop {
  id                      String
  userId                  String   @unique
  user                    User
  companyName             String
  customerNumber          String   @unique
  isVerified              Boolean  @default(false)
  emailNotifyRequests     Boolean  @default(true)
  emailNotifyBookings     Boolean  @default(true)
  googleAccessToken       String?
  googleRefreshToken      String?
  googleCalendarId        String?
  workingHours            Json?
  workingDays             Json?
  
  offers                  Offer[]
  bookings                Booking[]
  workshopServices        WorkshopService[]
  workshopVacations       WorkshopVacation[]
}
```

### TireRequest Tabelle
```prisma
model TireRequest {
  id                  String
  customerId          String
  customer            Customer
  season              Season   (SUMMER, WINTER, ALL_SEASON)
  width               Int
  aspectRatio         Int
  diameter            Int
  quantity            Int
  status              RequestStatus   (PENDING, QUOTED, ACCEPTED, BOOKED, COMPLETED, CANCELLED)
  latitude            Float?
  longitude           Float?
  zipCode             String
  city                String?
  radiusKm            Int
  needByDate          DateTime
  additionalNotes     String?
  preferredBrands     String?
  runFlat             Boolean
  tireDisposal        Boolean
  workshopsNotified   Int      @default(0)
  
  offers              Offer[]
  booking             Booking?
  vehicle             Vehicle?
  
  createdAt           DateTime @default(now())
}
```

### Offer Tabelle
```prisma
model Offer {
  id                  String
  tireRequestId       String
  tireRequest         TireRequest
  workshopId          String
  workshop            Workshop
  tireBrand           String
  tireModel           String
  price               Decimal
  installationFee     Decimal
  validUntil          DateTime
  durationMinutes     Int
  status              OfferStatus   (PENDING, ACCEPTED, DECLINED)
  acceptedAt          DateTime?
  declinedAt          DateTime?
  
  tireOptions         TireOption[]
  booking             Booking?
  
  createdAt           DateTime @default(now())
}
```

### TireOption Tabelle
```prisma
model TireOption {
  id                  String
  offerId             String
  offer               Offer
  brand               String
  model               String
  pricePerTire        Decimal
  montagePrice        Decimal?
  motorcycleTireType  MotorcycleTireType?   (FRONT, REAR, BOTH)
  carTireType         String?   (ALL_FOUR, FRONT_TWO, REAR_TWO)
  description         String?
  
  bookings            Booking[]
  createdAt           DateTime @default(now())
}
```

### Booking Tabelle
```prisma
model Booking {
  id                  String
  tireRequestId       String   @unique
  tireRequest         TireRequest
  customerId          String
  customer            Customer
  workshopId          String
  workshop            Workshop
  offerId             String   @unique
  offer               Offer
  appointmentDate     DateTime
  appointmentTime     String
  status              BookingStatus   (CONFIRMED, COMPLETED, CANCELLED)
  estimatedDuration   Int
  paymentMethod       PaymentMethod   (PAY_ONSITE, SEPA_MANDATE, PAYPAL)
  customerNotes       String?
  googleEventId       String?
  selectedTireOptionId String?
  employeeId          String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

---

## 📧 EMAIL-ÜBERSICHT

### 1. welcomeCustomerEmailTemplate
**Trigger:** Kundenregistrierung  
**Empfänger:** Neuer Kunde  
**Inhalt:**
- Willkommensgruß
- Übersicht der Plattform
- Link zum Dashboard

### 2. welcomeWorkshopEmailTemplate
**Trigger:** Werkstattregistrierung  
**Empfänger:** Neue Werkstatt  
**Inhalt:**
- Verifizierung ausstehend
- Was passiert als nächstes
- Admin wird informiert

### 3. workshopVerifiedEmailTemplate
**Trigger:** Admin verifiziert Werkstatt  
**Empfänger:** Werkstatt  
**Inhalt:**
- Konto ist aktiviert
- Link zum Dashboard
- Nächste Schritte

### 4. newTireRequestEmailTemplate
**Trigger:** Neue Reifenanfrage im Umkreis  
**Empfänger:** Werkstätten (mit emailNotifyRequests=true)  
**Inhalt:**
- Reifendetails (Größe, Saison, Menge)
- Kundennähe (Distanz in km)
- Link zum Angebot erstellen

### 5. Bestätigungsmail Anfrage
**Trigger:** Kunde erstellt Anfrage  
**Empfänger:** Kunde  
**Inhalt:**
- Anfrage wurde erstellt
- Anzahl benachrichtigter Werkstätten
- Was passiert als nächstes

### 6. newOfferEmailTemplate / newServiceOfferEmailTemplate
**Trigger:** Werkstatt erstellt Angebot  
**Empfänger:** Kunde  
**Inhalt:**
- Werkstattname und Details
- Reifenoptionen mit Preisen
- Montagekosten
- Gültigkeitsdauer
- Link zum Angebot ansehen

### 7. offerAcceptedEmailTemplate
**Trigger:** Kunde nimmt Angebot an  
**Empfänger:** Werkstatt  
**Inhalt:**
- Angebot wurde angenommen
- Kundenkontaktdaten
- Fahrzeuginfos
- Link zur Terminbuchung

### 8. bookingConfirmationCustomerEmailTemplate
**Trigger:** Kunde bucht Termin  
**Empfänger:** Kunde  
**Anhang:** termin.ics (Kalenderdatei)  
**Inhalt:**
- Werkstatt (Name, Adresse, Telefon)
- Termindetails (Datum, Uhrzeit)
- Reifendetails (Marke, Modell, Größe)
- Gesamtpreis
- Zahlungsmethode
- ICS-Datei für Kalender

### 9. bookingConfirmationWorkshopEmailTemplate
**Trigger:** Kunde bucht Termin (nur wenn emailNotifyBookings=true)  
**Empfänger:** Werkstatt  
**Inhalt:**
- Kundendaten (Name, Telefon, Email, Adresse)
- Termindetails
- Fahrzeuginfo
- Reifendetails
- Kundennotizen
- Zahlungsmethode

---

## 🔄 STATUS-ÜBERGÄNGE

### TireRequest.status
```
PENDING → QUOTED → ACCEPTED → BOOKED → COMPLETED
                                   ↓
                               CANCELLED
```

**PENDING:** Anfrage wurde erstellt, wartet auf Angebote  
**QUOTED:** Mindestens ein Angebot liegt vor  
**ACCEPTED:** Kunde hat ein Angebot angenommen  
**BOOKED:** Termin wurde gebucht  
**COMPLETED:** Service wurde durchgeführt  
**CANCELLED:** Anfrage wurde storniert

### Offer.status
```
PENDING → ACCEPTED
       ↓
    DECLINED
```

**PENDING:** Angebot wartet auf Antwort  
**ACCEPTED:** Kunde hat angenommen  
**DECLINED:** Kunde hat abgelehnt oder anderes Angebot gewählt

### Booking.status
```
CONFIRMED → COMPLETED
         ↓
     CANCELLED
```

**CONFIRMED:** Termin ist bestätigt  
**COMPLETED:** Service wurde durchgeführt  
**CANCELLED:** Termin wurde storniert

---

## 🔗 WICHTIGE API-ENDPOINTS

### Auth
- `POST /api/auth/register/customer` - Kundenregistrierung
- `POST /api/auth/register/workshop` - Werkstattregistrierung
- `POST /api/auth/login` - NextAuth Login

### Anfragen (Customer)
- `POST /api/tire-requests` - Neue Anfrage erstellen
- `GET /api/tire-requests` - Eigene Anfragen ansehen

### Anfragen (Workshop)
- `GET /api/workshop/tire-requests` - Verfügbare Anfragen im Umkreis

### Angebote (Workshop)
- `POST /api/workshop/tire-requests/[id]/offers` - Angebot erstellen
- `GET /api/workshop/offers` - Eigene Angebote ansehen

### Angebote (Customer)
- `GET /api/customer/offers` - Erhaltene Angebote ansehen
- `POST /api/offers/[id]/accept` - Angebot annehmen

### Buchungen
- `POST /api/bookings` - Termin buchen
- `GET /api/bookings` - Buchungen ansehen
- `GET /api/bookings/calendar` - Kalenderansicht

---

## 🛠️ ZUSÄTZLICHE FEATURES

### Google Calendar Integration
1. Workshop verbindet Google-Konto in Einstellungen
2. Bei Buchung wird automatisch Event erstellt
3. Fallback-Hierarchie:
   - Workshop-Kalender (googleCalendarId)
   - Employee-Kalender (wenn zugewiesen)
4. Event-ID wird in `Booking.googleEventId` gespeichert
5. Sync bei Änderungen/Stornierung

### ICS-Datei für Kunden
- Wird bei Buchungsbestätigung als Anhang mitgeschickt
- Enthält:
  - Termindetails (DTSTART, DTEND)
  - Werkstatt-Location
  - Beschreibung (Reifendetails)
  - Organisator (Workshop Email)
  - Teilnehmer (Kunde Email)
- Kann in jedem Kalender importiert werden

### Benachrichtigungs-Einstellungen
Werkstätten können in den Einstellungen steuern:
- `emailNotifyRequests` - Email bei neuen Anfragen im Umkreis
- `emailNotifyBookings` - Email bei neuen Buchungen

### Distanzberechnung
- Verwendet Haversine-Formel
- Berechnet Luftlinie zwischen Koordinaten
- Funktion: `calculateDistance(lat1, lon1, lat2, lon2)`
- Werkstätten können Radius definieren

### Mehrere Reifenoptionen
- Workshop kann 1-3 Optionen pro Angebot anbieten
- Kunde wählt bei Buchung eine Option
- Unterschiedliche Preise je Option möglich

---

## 📍 DATEI-LOCATIONS

### API Routes
- `app/api/auth/register/customer/route.ts`
- `app/api/auth/register/workshop/route.ts`
- `app/api/tire-requests/route.ts`
- `app/api/workshop/tire-requests/[id]/offers/route.ts`
- `app/api/offers/[id]/accept/route.ts`
- `app/api/bookings/route.ts`

### Services
- `lib/email.ts` - Email Templates & Versand
- `lib/distanceCalculator.ts` - Distanzberechnung
- `lib/auth.ts` - NextAuth Konfiguration
- `lib/prisma.ts` - Prisma Client

### Components
- `app/dashboard/customer/` - Kunden-Dashboard
- `app/dashboard/workshop/` - Werkstatt-Dashboard
- `components/BackButton.tsx` - Navigation

### Database
- `prisma/schema.prisma` - Datenbankschema
- `prisma/migrations/` - Migrationen

---

**Dokumentationsstand:** Februar 2026  
**Version:** 1.0
