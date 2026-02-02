# Workshop Kundenverwaltung (CRM) - Implementierung

## Status: 🟡 Teilweise implementiert

**Preismodell:** 49€/Monat + 3 Monate kostenlos zum Testen

## ✅ Was wurde bereits implementiert:

### 1. Datenbankschema (Prisma)
- ✅ `WorkshopCustomer` - Haupttabelle für Kunden
- ✅ `WorkshopVehicle` - Fahrzeugverwaltung pro Kunde  
- ✅ `WorkshopServiceRecord` - Servicehistorie/Timeline
- ✅ `WorkshopCommunication` - Kommunikationshistorie (Email, Telefon, Notizen)
- ✅ `WorkshopDocument` - Dokumentenverwaltung (Rechnungen, Fotos, Berichte)
- ✅ `WorkshopReminder` - Automatische Erinnerungen (TÜV, Reifenwechsel)
- ✅ `WorkshopManualAppointment` - Manuelle Terminverwaltung

### 2. Frontend (UI)
- ✅ Kundenübersicht-Seite (`/dashboard/workshop/customers/page.tsx`)
  - Suchfunktion (Name, Email, Telefon, Firma)
  - Filter nach Quelle (Bereifung24 Buchung, Manueller Termin, Manuell)
  - Sortierbare Tabelle
  - Statistiken pro Kunde (Buchungen, Umsatz, letzte Buchung)
  - Export-Funktion (vorbereitet)

### 3. Backend (API)
- ✅ `GET /api/workshop/customers` - Alle Kunden abrufen (mit Such & Filter)
- ✅ `POST /api/workshop/customers` - Neuen Kunden erstellen

## ⏳ Was noch fehlt (Migration steht aus):

### Migration zur Datenbank:
Die SQL-Migration wurde erstellt (`add_workshop_customer_management.sql`) muss aber noch manuell ausgeführt werden:

\`\`\`bash
# Als Root-User auf dem Server:
sudo -u postgres psql bereifung24 < /tmp/add_workshop_customer_management.sql

# ODER über Prisma:
cd /var/www/bereifung24
npx prisma db push --accept-data-loss
\`\`\`

**Problem:** Der Bereifung24-User hat keine Owner-Rechte auf einigen Tabellen.

### Noch zu implementieren:

#### Phase 1 - MVP (HEUTE - 2-3h):
- [ ] **Kundendetails-Seite** (`/dashboard/workshop/customers/[id]/page.tsx`)
  - 360°-Ansicht: Übersicht, Fahrzeuge, Historie, Dokumente
  - Bearbeiten-Funktion
- [ ] **Kunde anlegen-Seite** (`/dashboard/workshop/customers/new/page.tsx`)
  - Formular für neue Kunden
  - Duplikatserkennung (Email/Telefon)
- [ ] **Fahrzeugverwaltung**
  - Fahrzeug hinzufügen/bearbeiten
  - VIN-Decoder-Integration (später)
- [ ] **Automatische Kundenerstellung**
  - Hook in Booking-Flow (wenn Kunde über Bereifung24 bucht)
  - Hook in Manual-Appointment-Flow

#### Phase 2 - Erweiterte Features (NÄCHSTE WOCHE - 3-4h):
- [ ] **Servicehistorie-Timeline**
  - Chronologische Anzeige aller Services
  - Verknüpfung mit Bookings
- [ ] **Kommunikationshistorie**
  - Notizen hinzufügen
  - Email-Integration
  - Telefon-Logs
- [ ] **Dokumentenverwaltung**
  - Datei-Upload (Rechnungen, Fotos)
  - PDF-Anzeige
- [ ] **TÜV-Erinnerungen (automatisch)**
  - Cron-Job für automatische Benachrichtigungen
  - Email-Versand 30 Tage vor TÜV

#### Phase 3 - Premium Features (SPÄTER - 4-5h):
- [ ] **Kundensegmentierung**
  - Tags (Stammkunde, Premium, VIP)
  - Farbcodierung
- [ ] **Analytics & Reports**
  - Kundenwert-Analyse
  - Retention-Rate
  - Umsatz-Dashboard
- [ ] **Marketing-Funktionen**
  - Newsletter-Integration
  - Kampagnen-Verwaltung
  - DSGVO-konforme Einwilligungen

## 📊 Datenfluss:

\`\`\`
Bereifung24 Buchung → Booking erstellt → WorkshopCustomer automatisch angelegt
                                       → WorkshopVehicle aus Booking-Daten
                                       → WorkshopServiceRecord nach Completion

Manueller Termin → WorkshopManualAppointment → WorkshopCustomer falls noch nicht vorhanden
                                              → WorkshopVehicle optional

Manuell erstellt → Workshop erstellt Kunde direkt → WorkshopCustomer
                                                   → WorkshopVehicle manuell
\`\`\`

## 🔄 Nächste Schritte:

1. **Migration ausführen** (als Root)
   \`\`\`bash
   ssh root@167.235.24.110
   sudo -u postgres psql bereifung24
   \\i /tmp/add_workshop_customer_management.sql
   \`\`\`

2. **Prisma Client neu generieren**
   \`\`\`bash
   cd /var/www/bereifung24
   npx prisma generate
   \`\`\`

3. **Kundendetails-Seite implementieren**
   - 360°-Ansicht mit Tabs
   - Bearbeiten-Funktion
   - Fahrzeugverwaltung

4. **Automatische Kundenerstellung bei Bookings**
   - Hook in `/api/offers/[id]/accept/route.ts`
   - Hook in `/api/workshop/create-manual-appointment/route.ts`

5. **Testing mit echten Daten**
   - Erste Buchung durchführen
   - Kunden automatisch erstellen lassen
   - Kundenliste prüfen

## 💡 Technische Details:

### Duplikatserkennung:
\`\`\`typescript
// Vor dem Erstellen eines neuen Kunden prüfen:
const existing = await prisma.workshopCustomer.findFirst({
  where: {
    workshopId: workshop.id,
    OR: [
      { email: body.email },
      { phone: body.phone },
    ],
  },
})

if (existing) {
  // Kunde bereits vorhanden → aktualisieren statt neu erstellen
  return existingCustomer
}
\`\`\`

### Automatische Statistiken:
\`\`\`typescript
// Nach jeder Buchung aktualisieren:
await prisma.workshopCustomer.update({
  where: { id: customerId },
  data: {
    totalBookings: { increment: 1 },
    totalRevenue: { increment: booking.totalPrice },
    lastBookingDate: new Date(),
  },
})
\`\`\`

### TÜV-Erinnerungen (Cron-Job):
\`\`\`typescript
// Jeden Tag um 8:00 Uhr ausführen:
const vehiclesDueSoon = await prisma.workshopVehicle.findMany({
  where: {
    nextInspection: {
      gte: new Date(), // Heute
      lte: addDays(new Date(), 30), // In 30 Tagen
    },
    isActive: true,
  },
  include: { customer: true },
})

for (const vehicle of vehiclesDueSoon) {
  // Email senden + WorkshopReminder erstellen
}
\`\`\`

## 📝 Dateien:

- ✅ `prisma/schema.prisma` - Datenbankschema
- ✅ `add_workshop_customer_management.sql` - Migration SQL
- ✅ `app/dashboard/workshop/customers/page.tsx` - Kundenübersicht UI
- ✅ `app/api/workshop/customers/route.ts` - API (GET, POST)
- ⏳ `app/dashboard/workshop/customers/[id]/page.tsx` - Kundendetails (TODO)
- ⏳ `app/dashboard/workshop/customers/new/page.tsx` - Kunde anlegen (TODO)
- ⏳ `app/api/workshop/customers/[id]/route.ts` - API (GET, PUT, DELETE) (TODO)

## 🚀 Deployment:

\`\`\`bash
# 1. Schema hochladen (bereits erledigt)
scp prisma/schema.prisma root@server:/var/www/bereifung24/prisma/

# 2. Migration ausführen (MUSS NOCH PASSIEREN)
ssh root@server
sudo -u postgres psql bereifung24 < /tmp/add_workshop_customer_management.sql

# 3. Prisma Client generieren (bereits erledigt)
cd /var/www/bereifung24 && npx prisma generate

# 4. Frontend & API deployen
scp app/dashboard/workshop/customers/page.tsx root@server:/var/www/bereifung24/app/dashboard/workshop/customers/
scp app/api/workshop/customers/route.ts root@server:/var/www/bereifung24/app/api/workshop/customers/

# 5. Build & Restart
cd /var/www/bereifung24
rm -rf .next
npm run build
pm2 restart bereifung24
\`\`\`

## 💰 Preis-Kalkulation:

**49€/Monat** für Werkstätten beinhaltet:
- Unbegrenzte Kunden
- Fahrzeugverwaltung
- Servicehistorie
- Automatische TÜV-Erinnerungen
- Kommunikationshistorie
- Dokumentenverwaltung
- DSGVO-konforme Datenverwaltung

**3 Monate kostenlos zum Testen**
- Keine Kreditkarte erforderlich
- Voller Funktionsumfang
- Jederzeit kündbar

**ROI für Werkstatt:**
- Zeitersparnis: ~5h/Woche (Kundendaten suchen, organisieren)
- Konversionssteigerung: +20% durch TÜV-Erinnerungen
- Monatlicher Mehrwert: ~750€
- Break-Even: Nach 1-2 Terminen durch Erinnerungen

---

**Status:** Bereit für Migration und Testing! 🎯
