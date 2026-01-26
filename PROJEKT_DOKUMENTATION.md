# Bereifung24 Projekt - Vollständige Dokumentation

## 📋 Projekt-Übersicht

**Bereifung24** ist eine digitale B2B/B2C-Plattform für Reifenservice und Werkstatt-Management in Deutschland.
Die Plattform verbindet Endkunden mit Werkstätten und bietet interne Tools für Mitarbeiterverwaltung, Buchhaltung und Geschäftsprozesse.

---

## 🛠️ Technischer Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui + Radix UI
- **Formulare**: React Hook Form + Zod Validation
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js (via Next.js API Routes)
- **API**: Next.js App Router API (Route Handlers)
- **Authentication**: NextAuth.js (v4)
- **Session Management**: JWT + Database Sessions

### Datenbank
- **DBMS**: PostgreSQL
- **ORM**: Prisma 5.22.0
- **Schema**: 50+ Models (siehe prisma/schema.prisma)
- **Migrations**: Prisma Migrate

### External Services
- **Payment**: GoCardless (SEPA Direct Debit)
- **Email**: IMAP/SMTP Integration (Postfix on server)
- **Calendar**: Google Calendar API (OAuth2)
- **Maps**: Google Places API
- **CO2 Data**: EPREL API (EU Energy Label)

### Hosting & Infrastructure
- **Server**: Hetzner Cloud (167.235.24.110)
- **OS**: Ubuntu/Debian Linux
- **Reverse Proxy**: Nginx
- **Process Manager**: PM2 (bereifung24)
- **SSL**: Let's Encrypt (certbot)
- **Domain**: bereifung24.de

### Development Tools
- **Version Control**: Git + GitHub (Zdenek156/bereifung24)
- **Package Manager**: npm
- **TypeScript**: 5.x (strict mode)
- **Linting**: ESLint (Next.js config)
- **SSH**: bereifung24_hetzner key (C:\Users\zdene\.ssh\)

---

## 🎯 Hauptfunktionen

### 1. Customer Portal (B2C)
- **Reifenwechsel-Anfragen**: Kunden können Terminanfragen für verschiedene Services erstellen
  - Reifenwechsel (Sommer/Winter)
  - Räderwechsel (komplett)
  - Motorrad-Service
  - Bremsen-Service
  - Batterie-Wechsel
  - Klimaanlagen-Service
  - Achsvermessung
  - Reparaturen
- **Fahrzeugverwaltung**: Kunden können ihre Fahrzeuge speichern
- **CO2-Tracking**: Automatische CO2-Berechnung pro Service
- **Weather Alert**: Warnung bei Kälteeinbruch für Reifenwechsel
- **Terminbuchung**: Online-Buchung mit Google Calendar Integration
- **Reifenhistorie**: Übersicht über vergangene Services
- **Bewertungen**: Kunden können Werkstätten bewerten

### 2. Workshop Portal (B2B)
- **Angebotserstellung**: Werkstätten können Angebote auf Kundenanfragen abgeben
- **Terminverwaltung**: Kalender-Integration (Google Calendar)
- **Mitarbeiterverwaltung**: Werkstatt-Mitarbeiter und deren Urlaube
- **Pricing Management**: Individuelle Preise pro Service-Typ
- **Landing Pages**: Eigene Marketing-Landingpages (bereifung24.de/lp/[slug])
- **SEPA-Mandate**: GoCardless Integration für Provisionsabrechnung
- **Kommissionsabrechnung**: Automatische monatliche Rechnungserstellung
- **Service-Packages**: Vordefinierte Service-Pakete (z.B. "Kompletter Reifenwechsel")
- **Reviews Management**: Antworten auf Kundenbewertungen

### 3. Admin-Panel
#### HR-Modul (Personalverwaltung)
- **Mitarbeiterverwaltung**: Vollständiges HR-System
  - Hierarchie-System (Geschäftsführer → Manager → Teamleiter → Mitarbeiter)
  - Employee Status: DRAFT, ACTIVE, PROBATION, TERMINATED
  - HR-Daten: Verträge, Gehalt, Steuer, Sozialversicherung
  - Bank-Daten (verschlüsselt mit AES-256-GCM)
- **Bewerbungsmanagement**: 
  - Stellenanzeigen (public jobs auf /karriere)
  - Bewerbungseingang
  - Status-Workflow: PENDING → HIRED/REJECTED
  - Automatische Email-Absagen bei Ablehnung
  - Automatische Mitarbeiter-Erstellung bei Einstellung (DRAFT Status)
- **Gehaltsabrechnung** (Phase 2 in Planung):
  - Basis-Struktur vorhanden (Payroll Model)
  - SV-Beiträge und Lohnsteuer-Berechnung fehlt noch
- **Genehmigungen**: Workflow für Urlaubsanträge, Spesenfreigaben
- **Hierarchie**: Manager-Struktur mit Berichtslinien

#### Buchhaltungs-Modul (HGB-konform)
- **Kontenplan**: SKR04 mit 66 vordefinierten Konten
- **Journal**: Vollständiges Buchungsjournal mit Storno-Funktion
- **Belege**: Belegverwaltung mit PDF-Upload
- **Bilanz (Balance Sheet)**: 
  - Automatische Generierung nach HGB §266
  - Lock/Approve Workflow (Sperre → Freigabe durch Geschäftsführer)
  - Export: PDF, Excel, CSV
  - Jahresvergleich
- **GuV (Income Statement)**: 
  - Gewinn- und Verlustrechnung nach HGB
  - Monats- und Jahresauswertungen
  - Vergleichsberichte
- **Anlagenverwaltung**: 
  - Anlagegüter mit Abschreibungsplan
  - Lineare und degressive Abschreibung
  - Automatische monatliche Abschreibung (Cron-Job geplant)
- **Rückstellungen**: 
  - Steuer-, Urlaubs-, Gewährleistungsrückstellungen
  - Release-Workflow
- **Auswertungen**:
  - BWA (Betriebswirtschaftliche Auswertung)
  - EÜR (Einnahmen-Überschuss-Rechnung)
  - UStVA (Umsatzsteuervoranmeldung)
  - Summen- und Saldenliste
- **Jahresabschluss**: 
  - Strukturierter 5-Schritte-Prozess
  - Vorprüfungen, Abschreibungen, Rückstellungen
  - Bilanz- und GuV-Generierung
- **Steuerberater-Integration**: 
  - Email-Versand von Bilanz + GuV als PDF
  - DATEV-Export geplant

#### Weitere Admin-Features
- **Sales/CRM**: Prospect Management, Lead-Tracking
- **Invoicing**: Automatische Rechnungserstellung
- **Territories**: Verkaufsgebiete für Außendienst
- **Fleet Management**: Fahrzeugverwaltung
- **Commission Tracking**: Affiliate-Provisionen
- **Influencer Portal**: Influencer-Management mit Zahlungen
- **API Settings**: Externe API-Keys (GoCardless, EPREL, Google)
- **Email Settings**: SMTP/IMAP Konfiguration
- **Security**: Backup-System, Session-Management
- **Server Info**: System-Monitoring

### 4. Employee Portal (Mitarbeiter-App)
- **Dashboard**: Übersicht über Aufgaben und Termine
- **Aufgaben**: Task-Management mit Prioritäten
- **Email**: Integriertes Email-System (IMAP)
- **Dokumente**: Persönliche Dokumente (Verträge, Zeugnisse)
- **Zeiterfassung**: Arbeitszeiterfassung
- **Urlaub**: Urlaubsanträge mit Genehmigung
- **Krankmeldung**: Krankheitserfassung
- **Spesen**: Spesenabrechnung mit Belegen
- **Reisekosten**: Fahrtenbuch
- **Profil**: Persönliche Daten und Bankverbindung
- **Wiki**: Internes Wissenssystem
- **Roadmap**: Projekt-Roadmap mit Team-Aufgaben
- **Files**: Gemeinsamer Dateispeicher

### 5. Influencer Portal
- **Bewerbung**: Influencer können sich bewerben
- **Dashboard**: Übersicht über generierte Leads
- **Zahlungen**: Provisionszahlungen einsehen
- **Statistiken**: Conversion-Tracking
- **Affiliate-Links**: Eindeutige Tracking-URLs

---

## 🏗️ Architektur

### Ordner-Struktur

```
bereifung24/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth-Layout (Login, Register)
│   ├── admin/                    # Admin-Panel
│   │   ├── hr/                   # HR-Modul
│   │   │   ├── mitarbeiter/      # Mitarbeiterverwaltung
│   │   │   ├── bewerbungen/      # Bewerbungsmanagement
│   │   │   ├── gehaltsabrechnungen/  # Payroll
│   │   │   ├── hierarchie/       # Organigramm
│   │   │   └── stellen/          # Stellenanzeigen
│   │   ├── buchhaltung/          # Buchhaltungs-Modul
│   │   │   ├── bilanz/           # Balance Sheet
│   │   │   ├── guv/              # Income Statement
│   │   │   ├── journal/          # Buchungsjournal
│   │   │   ├── anlagen/          # Asset Management
│   │   │   ├── rueckstellungen/  # Provisions
│   │   │   └── auswertungen/     # Reports (BWA, EÜR, UStVA)
│   │   ├── sales/                # CRM
│   │   ├── workshops/            # Werkstatt-Verwaltung
│   │   ├── customers/            # Kunden-Verwaltung
│   │   └── ...
│   ├── dashboard/                # Dashboards (Customer, Workshop)
│   │   ├── customer/             # Kunden-Dashboard
│   │   └── workshop/             # Werkstatt-Dashboard
│   ├── mitarbeiter/              # Mitarbeiter-Portal
│   ├── influencer/               # Influencer-Portal
│   ├── karriere/                 # Public Job Listings
│   ├── api/                      # API Routes
│   │   ├── admin/                # Admin-APIs
│   │   │   ├── hr/               # HR-APIs
│   │   │   ├── accounting/       # Accounting-APIs
│   │   │   └── ...
│   │   ├── auth/                 # Auth-APIs
│   │   ├── customer/             # Customer-APIs
│   │   ├── workshop/             # Workshop-APIs
│   │   └── ...
│   └── (marketing)/              # Public Pages (Landing)
├── components/                   # React Components
│   ├── ui/                       # Shadcn UI Components
│   ├── BackButton.tsx            # Navigation Helper
│   └── ...
├── lib/                          # Utilities & Services
│   ├── auth.ts                   # NextAuth Config
│   ├── prisma.ts                 # Prisma Client
│   ├── encryption.ts             # AES-256-GCM Encryption
│   ├── email.ts                  # Email Service (Nodemailer)
│   ├── applications.ts           # Employee Applications Check
│   ├── accounting/               # Accounting Services
│   │   ├── balanceSheetService.ts
│   │   ├── incomeStatementService.ts
│   │   ├── depreciationService.ts
│   │   └── ...
│   └── ...
├── prisma/                       # Database Schema
│   ├── schema.prisma             # 50+ Models
│   └── migrations/               # Database Migrations
├── public/                       # Static Assets
├── .github/                      # GitHub Config
│   └── copilot-instructions.md   # Project Instructions
├── deploy.sh                     # Deployment Script
└── package.json                  # Dependencies
```

### Datenbank-Schema (Prisma)

**Wichtigste Models:**

**User Management:**
- `User` - Hauptbenutzer (Kunden, Werkstätten, Admins, Mitarbeiter)
- `B24Employee` - Mitarbeiter (erweitert User)
- `EmployeeProfile` - Persönliche Daten (verschlüsselt)
- `JobApplication` - Bewerbungen

**Business Logic:**
- `Workshop` - Werkstätten
- `TireRequest` - Kundenanfragen
- `Offer` - Angebote von Werkstätten
- `Booking` - Bestätigte Buchungen
- `Review` - Bewertungen
- `Vehicle` - Fahrzeuge
- `Invoice` - Rechnungen
- `Commission` - Provisionen

**Accounting (HGB):**
- `Account` - Kontenplan (SKR04)
- `AccountingEntry` - Buchungsjournal
- `BalanceSheet` - Bilanz
- `IncomeStatement` - GuV
- `Depreciation` - Abschreibungen
- `Provision` - Rückstellungen
- `Asset` - Anlagegüter
- `YearEndClosing` - Jahresabschluss

**HR:**
- `Payroll` - Gehaltsabrechnungen
- `EmployeeDocument` - Mitarbeiter-Dokumente
- `Leave` - Urlaubsanträge
- `SickLeave` - Krankmeldungen
- `Expense` - Spesenabrechnung
- `Trip` - Fahrtenbuch

**CRM:**
- `Prospect` - Leads
- `SalesInteraction` - Interaktionen
- `SalesNote` - Notizen
- `SalesTask` - Aufgaben
- `Territory` - Verkaufsgebiete

**Content:**
- `JobPosting` - Stellenanzeigen
- `LandingPage` - Marketing-Pages
- `Announcement` - Ankündigungen
- `WikiArticle` - Wiki

---

## 💼 Geschäftsmodell

### Kernkonzept
**Bereifung24** ist eine digitale Vermittlungsplattform zwischen Endkunden und Werkstätten:

1. **Kunde** erstellt Serviceanfrage (z.B. Reifenwechsel)
2. **Werkstätten** geben Angebote ab
3. **Kunde** wählt Angebot und bucht Termin
4. **Werkstatt** führt Service durch
5. **Bereifung24** erhält Provision (via SEPA)

### Revenue Streams
- **Provisionen**: 10-15% Provision pro Buchung
- **SEPA Direct Debit**: Automatischer Einzug via GoCardless
- **Affiliate**: Influencer-Marketing mit Provisionen
- **Premium Features**: Geplant für Werkstätten

### Zielgruppen
- **B2C**: Privatpersonen (Reifenwechsel, Wartung)
- **B2B**: Werkstätten (Lead-Generierung)
- **B2B2**: Influencer (Affiliate-Marketing)

---

## 📂 Wichtige Dateien & Konfigurationen

### Kritische Config-Files
```
prisma/schema.prisma              # Datenbank-Schema (50+ Models)
lib/auth.ts                       # NextAuth Konfiguration
.env.local                        # Environment Variables (NICHT in Git!)
next.config.js                    # Next.js Config
package.json                      # Dependencies
tsconfig.json                     # TypeScript Config
tailwind.config.ts                # Tailwind CSS Config
```

### Environment Variables (.env.local)
```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://bereifung24.de
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOCARDLESS_TOKEN=...
EPREL_API_KEY=...
EMAIL_HOST=...
EMAIL_USER=...
EMAIL_PASSWORD=...
ENCRYPTION_KEY=...              # AES-256-GCM für Bank-Daten
```

### Server-Setup
**Nginx Config:** `/etc/nginx/sites-available/bereifung24`
```nginx
server {
    server_name bereifung24.de www.bereifung24.de;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**PM2 Prozess:**
```bash
pm2 start npm --name "bereifung24" -- start
pm2 save
pm2 startup
```

**Deployment:**
```bash
bash /root/deploy-bereifung24.sh
# 1. Git pull
# 2. npm install
# 3. Prisma generate
# 4. npm run build
# 5. pm2 restart bereifung24
```

---

## 🚧 Offene Punkte & Roadmap

### Phase 1: Basis-Features ✅ COMPLETED
- [x] User Management (Kunden, Werkstätten, Admins)
- [x] Reifenwechsel-Anfragen
- [x] Angebotserstellung
- [x] Terminbuchung mit Google Calendar
- [x] SEPA-Integration (GoCardless)
- [x] Provisionsabrechnung
- [x] Bewertungssystem
- [x] CO2-Tracking
- [x] Mitarbeiterverwaltung (HR)
- [x] Buchhaltung (HGB-konform)
- [x] Bewerbungsmanagement mit Workflow

### Phase 2: Automation & Compliance (IN PROGRESS)
- [x] Lock/Approve Workflow für Bilanz
- [x] Email-Versand an Steuerberater
- [ ] Automatische Buchungsgenerierung aus Rechnungen
- [ ] Monatliche Abschreibung (Cron-Job)
- [ ] DATEV-Export
- [ ] Rückstellungen-Tracking
- [ ] Gehaltsabrechnung:
  - [ ] Sozialversicherungsbeiträge 2026
  - [ ] Lohnsteuer-Berechnung
  - [ ] GoBD-konforme PDF-Generierung
  - [ ] Arbeitgeber-Umlagen (U1, U2, U3, BG)

### Phase 3: Advanced Features (PLANNED)
- [ ] Multi-Werkstatt-Standorte
- [ ] Mobile App (React Native)
- [ ] Push-Notifications
- [ ] WhatsApp-Integration
- [ ] KI-gestützte Preisempfehlungen
- [ ] Lagerbestandsverwaltung
- [ ] Teilebestellung
- [ ] Flottenmanagement erweitern

### Phase 4: Scale & Optimize (FUTURE)
- [ ] Microservices-Architektur
- [ ] Kubernetes Deployment
- [ ] Multi-Tenancy (Franchise-Modell)
- [ ] Europäische Expansion
- [ ] API für Drittanbieter

---

## 🔥 Besondere Implementierungen & Herausforderungen

### 1. Lock/Approve Workflow Pattern
**Problem:** Buchhaltungsdaten müssen revisionssicher gesperrt und freigegeben werden.

**Lösung:**
```typescript
// 3-Stufen-Workflow:
// 1. NORMAL (bearbeitbar)
// 2. LOCKED (gesperrt, locked: true, lockedAt: timestamp)
// 3. APPROVED (freigegeben, approvedBy: userId)

// Verwendung in: Bilanz, GuV, Jahresabschluss
// Zukünftig: HR-Dokumente, Urlaubsanträge, Spesenfreigaben
```

**Implementiert in:**
- `app/admin/buchhaltung/bilanz/page.tsx`
- `lib/accounting/balanceSheetService.ts`
- APIs: `/api/admin/accounting/balance-sheet/[id]/lock` + `/approve`

### 2. Bank-Daten Verschlüsselung
**Problem:** DSGVO-konform Bank-Daten speichern.

**Lösung:** AES-256-GCM Encryption
```typescript
// lib/encryption.ts
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY // 32-Byte Key
const algorithm = 'aes-256-gcm'

encrypt(text: string) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
}

decrypt(text: string) {
  const [ivHex, authTagHex, encrypted] = text.split(':')
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
```

**Single Source of Truth:** Bank-Daten nur in `EmployeeProfile`, nicht in `B24Employee`.

### 3. Hierarchie-System (HR)
**Problem:** Multi-Level-Hierarchie mit Berichtslinien und Berechtigungen.

**Lösung:**
```typescript
// 0 = Geschäftsführung (höchste Ebene)
// 1 = Manager / Head of Department
// 2 = Teamleiter
// 3+ = Mitarbeiter

// Self-referencing Prisma Model:
model B24Employee {
  id            String  @id @default(cuid())
  managerId     String?
  hierarchyLevel Int    @default(3)
  
  manager       B24Employee?  @relation("ManagerSubordinates", fields: [managerId], references: [id])
  subordinates  B24Employee[] @relation("ManagerSubordinates")
}

// Berechtigungsprüfung:
const isManager = employee.hierarchyLevel <= 1
const canEditOthers = employee.hierarchyLevel === 0 || 
                      employee.position.includes('geschäftsführer')
```

### 4. SKR04 Kontenrahmen
**Problem:** HGB-konforme Buchhaltung benötigt deutschen Kontenrahmen.

**Lösung:** 66 vordefinierte Konten aus SKR04
```typescript
// prisma/migrations/20250119_add_skr04_accounts.sql
INSERT INTO "Account" (number, name, type, category) VALUES
  -- Aktiva (0xxx)
  ('0100', 'Immaterielle Vermögensgegenstände', 'ASSET', 'ANLAGEVERMOEGEN'),
  ('0200', 'Grund und Boden', 'ASSET', 'ANLAGEVERMOEGEN'),
  ('0210', 'Gebäude', 'ASSET', 'ANLAGEVERMOEGEN'),
  ('0270', 'Betriebs- und Geschäftsausstattung', 'ASSET', 'ANLAGEVERMOEGEN'),
  -- Passiva (2xxx)
  ('2800', 'Gezeichnetes Kapital', 'EQUITY', 'EIGENKAPITAL'),
  ('3000', 'Rückstellungen für Pensionen', 'LIABILITY', 'RUECKSTELLUNGEN'),
  ('3100', 'Verbindlichkeiten gegenüber Kreditinstituten', 'LIABILITY', 'VERBINDLICHKEITEN'),
  -- Aufwendungen (4xxx-6xxx)
  ('4400', 'Wareneingang', 'EXPENSE', 'WARENEINKAUF'),
  ('6000', 'Löhne und Gehälter', 'EXPENSE', 'PERSONALKOSTEN'),
  -- Erträge (8xxx)
  ('8400', 'Erlöse 19% USt', 'INCOME', 'UMSATZERLOESE'),
  ...
```

### 5. GoCardless SEPA Integration
**Problem:** Automatische Provisionsabrechnung per Lastschrift.

**Lösung:** GoCardless API + Webhook-Handling
```typescript
// Workflow:
// 1. Werkstatt erstellt SEPA-Mandat (redirect_flow)
// 2. GoCardless sendet Webhook bei Status-Änderung
// 3. Monatliche Rechnung → automatischer Payment-Request
// 4. GoCardless zieht Betrag ein
// 5. Webhook bestätigt Zahlung

// api/webhooks/gocardless/route.ts
export async function POST(request: NextRequest) {
  const signature = request.headers.get('webhook-signature')
  const body = await request.text()
  
  // Verify webhook signature
  const calculatedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(body)
    .digest('hex')
  
  if (signature !== calculatedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  const event = JSON.parse(body)
  
  switch (event.resource_type) {
    case 'mandates':
      await handleMandateEvent(event)
      break
    case 'payments':
      await handlePaymentEvent(event)
      break
  }
  
  return NextResponse.json({ success: true })
}
```

### 6. Google Calendar Integration
**Problem:** Synchronisation von Werkstatt-Terminen mit Google Calendar.

**Lösung:** OAuth2 + Calendar API
```typescript
// lib/gcal.ts
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
)

// Termin erstellen:
async function createBookingEvent(booking: Booking) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })
  
  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `Reifenwechsel - ${booking.customerName}`,
      start: { dateTime: booking.startTime },
      end: { dateTime: booking.endTime },
      attendees: [{ email: booking.customerEmail }],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    }
  })
  
  return event.data.id
}
```

### 7. Multi-Role Authentication
**Problem:** 5 verschiedene Benutzertypen mit unterschiedlichen Berechtigungen.

**Lösung:** NextAuth mit Custom Session Strategy
```typescript
// lib/auth.ts
export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email }
        })
        
        if (!user || !bcrypt.compareSync(credentials?.password, user.password)) {
          throw new Error('Invalid credentials')
        }
        
        return user
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role // ADMIN | CUSTOMER | WORKSHOP | B24_EMPLOYEE | INFLUENCER
        session.user.workshopId = token.workshopId
      }
      return session
    }
  }
}

// Role-based Routing:
if (session.user.role === 'ADMIN') {
  return NextResponse.redirect('/admin')
} else if (session.user.role === 'WORKSHOP') {
  return NextResponse.redirect('/dashboard/workshop')
} else if (session.user.role === 'B24_EMPLOYEE') {
  return NextResponse.redirect('/mitarbeiter')
}
```

### 8. Employee Status Migration
**Problem:** Bestehende Bewerbungen hatten keinen Status in Mitarbeiter-Tabelle.

**Herausforderung:**
- Database hatte bereits Daten
- Migration konnte nicht automatisch laufen
- Status-Spalte fehlte in `b24_employees`

**Lösung:**
```sql
-- Manuelle Migration via psql
ALTER TABLE "b24_employees" 
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Bestehende HIRED Applications → DRAFT Employees
INSERT INTO "b24_employees" (...)
SELECT ... FROM "JobApplication" 
WHERE status = 'HIRED' AND email NOT IN (SELECT email FROM "b24_employees");
```

### 9. Case-Insensitive Admin-Filter
**Problem:** Admin-Account (admin@bereifung24.de) wurde trotz Filter angezeigt.

**Root Cause:** PostgreSQL `contains` ist case-sensitive.

**Lösung:**
```typescript
// VORHER (FALSCH):
where: {
  email: { not: { contains: 'admin@bereifung24.de' } }
}

// NACHHER (KORREKT):
where: {
  NOT: [
    { email: { contains: 'admin@bereifung24.de', mode: 'insensitive' } },
    { email: { contains: 'system@', mode: 'insensitive' } }
  ]
}
```

### 10. Browser-Cache Problem
**Problem:** Nach Deployment wurde alter JavaScript-Code ausgeführt (404-Fehler).

**Root Cause:**
- Next.js generierte identischen Hash (`page-5d6d28ed2a446503.js`)
- Browser cachte alten Code trotz neuer API-Pfade
- Hard Refresh half nicht

**Lösung:**
```bash
# Server-seitig:
rm -rf .next/
npm run build

# Client-seitig:
Ctrl + Shift + R (Hard Refresh)
Chrome DevTools → Application → Clear Storage
```

---

## 🔐 Sicherheit & Compliance

### DSGVO-Maßnahmen
- ✅ Bank-Daten verschlüsselt (AES-256-GCM)
- ✅ Passwörter gehasht (bcrypt)
- ✅ Session-Tokens (JWT)
- ✅ SSL/TLS (Let's Encrypt)
- ✅ Cookie-Consent
- ✅ Datenschutzerklärung
- ✅ Recht auf Löschung (GDPR)

### HGB-Compliance (Buchhaltung)
- ✅ Revisionssichere Buchungen (kein Edit, nur Storno)
- ✅ Lückenlose Belegnummern
- ✅ 10-Jahre Aufbewahrungspflicht
- ✅ GoBD-konforme Archivierung
- ✅ 4-Augen-Prinzip (Lock/Approve)

---

## 📊 Performance & Monitoring

### Aktuelle Metriken
- **Build Time**: ~3-4 Minuten
- **First Load JS**: 82.7 KB (shared)
- **PM2 Memory**: ~40 MB (idle)
- **Database**: PostgreSQL (managed by Prisma)

### Monitoring Tools
- PM2 Dashboard: `pm2 monit`
- Server Info: `/admin/server-info`
- Error Logs: `pm2 logs bereifung24`
- Database: Prisma Studio (`npx prisma studio`)

---

## 🚀 Deployment-Prozess

### Standard-Deployment
```bash
# Lokal:
git add -A
git commit -m "Your message"
git push origin main

# Server (automatisch via deploy.sh):
cd /var/www/bereifung24
git pull origin main
npm install
npx prisma generate
npm run build
pm2 restart bereifung24
```

### Hot-Fixes
```bash
# Bei blockierenden Dateien:
ssh -i "C:\Users\zdene\.ssh\bereifung24_hetzner" root@167.235.24.110
cd /var/www/bereifung24
rm -f check-*.js migrate-*.js test-*.js add-*.sql
git pull origin main
rm -rf .next
npm run build
pm2 restart bereifung24
```

### Database Migrations
```bash
# Lokal entwickeln:
npx prisma migrate dev --name your_migration_name

# Production:
npx prisma migrate deploy
```

---

## 📝 Code-Konventionen

### TypeScript
- **Strict Mode**: enabled
- **No Any**: Vermeiden, stattdessen Typen definieren
- **Null Safety**: Optional Chaining (`?.`) verwenden

### Naming Conventions
- **Components**: PascalCase (`EmployeeCard.tsx`)
- **Functions**: camelCase (`calculateSalary()`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Files**: kebab-case für Routes (`ehemalige-mitarbeiter/`)

### API Routes
```
GET    /api/admin/hr/employees           # List
GET    /api/admin/hr/employees/[id]      # Get
POST   /api/admin/hr/employees           # Create
PUT    /api/admin/hr/employees/[id]      # Update
DELETE /api/admin/hr/employees/[id]      # Delete
```

### Git Commit Messages
```
feat: Add DELETE endpoint for terminated employees
fix: Case-insensitive admin filter in employee list
refactor: Extract balance sheet calculation logic
docs: Update project documentation
chore: Clean up test scripts
```

---

## 🐛 Bekannte Issues

### Gelöst
- ✅ Admin-Account wurde in Mitarbeiter-Liste angezeigt → Filter mit `mode: 'insensitive'`
- ✅ Deaktivierung gab 404 → API-Pfad von `/admin/b24-employees/` auf `/admin/hr/employees/`
- ✅ Browser-Cache blockierte Updates → `rm -rf .next` + Hard Refresh
- ✅ Git Pull scheiterte → Temp-Files entfernen vor Pull
- ✅ Database Migration fehlte → Manuell `ALTER TABLE` via psql
- ✅ Mitarbeiter-Count falsch → Admin-Filter korrigiert

### Offen (Low Priority)
- ⚠️ Payroll-Berechnung fehlt noch (SV + Lohnsteuer)
- ⚠️ DATEV-Export nicht implementiert
- ⚠️ Mobile App fehlt

---

## 🎓 Learning & Best Practices

### Was gut funktioniert hat:
1. **Prisma ORM**: Type-safe Database Access
2. **NextAuth**: Einfache Multi-Role-Auth
3. **Shadcn/ui**: Schnelle UI-Entwicklung
4. **PM2**: Stabiler Production-Betrieb
5. **Lock/Approve Pattern**: Wiederverwendbar für viele Workflows

### Was optimiert werden sollte:
1. **Error Handling**: Mehr try-catch und User-Feedback
2. **Testing**: Unit + Integration Tests fehlen
3. **Logging**: Strukturiertes Logging (z.B. Winston)
4. **API Documentation**: OpenAPI/Swagger
5. **Deployment**: CI/CD Pipeline (GitHub Actions)

---

## 📚 Nützliche Ressourcen

### Dokumentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth: https://next-auth.js.org
- GoCardless: https://developer.gocardless.com
- Shadcn/ui: https://ui.shadcn.com

### Interne Docs
- `.github/copilot-instructions.md` - GitHub Copilot Kontext
- `BUCHHALTUNG_ROADMAP.md` - Accounting-Modul Roadmap
- `BUCHHALTUNG_STATUS.md` - Accounting-Modul Status
- `AI_SHOPFLOOR_ROADMAP.md` - Shop Floor Management (geplant)

---

## 🤝 Team & Rollen

### Entwickler
- **Zdenek** (GitHub: Zdenek156)
  - Full-Stack Development
  - DevOps & Deployment
  - Accounting-Modul Lead

### Aktuelle Mitarbeiter (Produktiv)
- Eduard Sommer (eduard.sommer@bereifung24.de)
- Matthias Krott (matthias.krott@bereifung24.de)
- Zdenek Kyzlink (zdenek.kyzlink@bereifung24.de)

---

## 📞 Support & Kontakt

### SSH-Zugang
```bash
# Windows:
ssh -i "C:\Users\zdene\.ssh\bereifung24_hetzner" root@167.235.24.110

# Server Details:
IP: 167.235.24.110
Domain: bereifung24.de
Provider: Hetzner Cloud
```

### Wichtige URLs
- **Production**: https://bereifung24.de
- **Admin**: https://bereifung24.de/admin
- **Employee**: https://bereifung24.de/mitarbeiter
- **Jobs**: https://bereifung24.de/karriere

---

## 🎯 Zusammenfassung für Claude Desktop Agent

**TL;DR:**
Bereifung24 ist eine **Next.js 14 Enterprise-Plattform** für Reifenservice-Vermittlung mit:

- **Tech Stack**: Next.js + TypeScript + PostgreSQL + Prisma + NextAuth
- **Hosting**: Hetzner Cloud (PM2 + Nginx)
- **Features**: 
  - B2C/B2B Marketplace (Kunden ↔ Werkstätten)
  - HR-Modul (Mitarbeiterverwaltung, Bewerbungen, Gehaltsabrechnung)
  - HGB-konformes Buchhaltungssystem (Bilanz, GuV, SKR04)
  - SEPA-Integration (GoCardless)
  - Google Calendar-Sync
  - Affiliate-System (Influencer)
- **Status**: Production-ready mit aktiven Nutzern
- **Nächste Schritte**: Gehaltsabrechnung, DATEV-Export, Mobile App

**Wichtigste Pattern:**
1. **Lock/Approve Workflow** (Buchhaltung, HR)
2. **Encrypted Bank Data** (AES-256-GCM)
3. **Hierarchie-System** (Self-referencing)
4. **Multi-Role Auth** (5 User-Types)

**Deployment:**
```bash
bash /root/deploy-bereifung24.sh  # oder manuelle Schritte
```

**Bei Problemen:**
1. Temp-Files löschen (`rm -f check-*.js`)
2. `.next` cleanen
3. Hard Browser Refresh
4. PM2 Logs checken (`pm2 logs bereifung24`)
