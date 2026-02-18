# 📧 Email-Templates Vorschlag - Buchungsbestätigung nach Zahlung

**Datum:** 18. Februar 2026  
**Status:** Vorschlag / In Review  
**Scope:** Erweiterte Kunden- und Werkstatt-Emails nach erfolgreicher Zahlung

---

## 📋 Übersicht

Nach erfolgreicher Stripe-Zahlung erhalten:
1. **Kunde** → Detaillierte Bestätigung mit ICS-Kalenderdatei
2. **Werkstatt** → Auftragsinformationen + Reifen-Bestelldetails (abhängig vom Lieferanten-System)

---

## 1️⃣ Kunden-Email: Buchungsbestätigung

### Template-Key: `BOOKING_CONFIRMATION_CUSTOMER_PAID`

### Betreff
```
✅ Ihre Buchung wurde bestätigt - {{serviceName}} am {{date}}
```

### Email-Inhalt

#### Haupt-Sektionen:
1. **Begrüßung & Zahlungsbestätigung**
   - "Ihre Zahlung über {{totalPrice}}€ wurde erfolgreich verarbeitet"
   - Zahlungsmethode: {{paymentMethod}}
   - Buchungsnummer: #{{bookingId}}

2. **Termin-Details**
   - 📅 Datum: {{date}}
   - 🕐 Uhrzeit: {{time}} Uhr
   - ⏱️ Dauer: ca. {{durationMinutes}} Minuten
   - 📍 Werkstatt: {{workshopName}}, {{workshopAddress}}

3. **Service-Details** (abhängig von serviceType)

   **Falls serviceType = "TIRE_CHANGE" oder "TIRE_MOUNT":**
   ```
   🔧 Gebuchter Service: Reifenwechsel / Montage
   
   Reifen:
   - Marke: {{tireBrand}}
   - Modell: {{tireModel}}
   - Größe: {{tireSize}}
   - Menge: {{tireQuantity}} Stück
   {{#if tireRunFlat}}
   - ⚡ RunFlat-Reifen
   {{/if}}
   {{#if tire3PMSF}}
   - ❄️ Winterreifen (3PMSF-Symbol)
   {{/if}}
   
   Zusatzleistungen:
   {{#if hasBalancing}}
   - ✅ Auswuchtung (+{{balancingPrice}}€)
   {{/if}}
   {{#if hasStorage}}
   - ✅ Einlagerung (+{{storagePrice}}€)
   {{/if}}
   {{#if hasDisposal}}
   - ✅ Reifenentsorgung (+{{disposalPrice}}€)
   {{/if}}
   {{#if hasRunFlatSurcharge}}
   - ✅ RunFlat-Aufschlag (+{{runFlatSurcharge}}€)
   {{/if}}
   ```

   **Falls serviceType = "WHEEL_CHANGE":**
   ```
   🔧 Gebuchter Service: Räderwechsel
   
   Ihr Fahrzeug: {{vehicleBrand}} {{vehicleModel}}
   
   Zusatzleistungen:
   {{#if hasBalancing}}
   - ✅ Auswuchtung (+{{balancingPrice}}€)
   {{/if}}
   {{#if hasStorage}}
   - ✅ Einlagerung (+{{storagePrice}}€)
   {{/if}}
   ```

4. **Preis-Übersicht**
   ```
   Basis-Service:        {{basePrice}}€
   {{#if balancingPrice}}
   Auswuchtung:          +{{balancingPrice}}€
   {{/if}}
   {{#if storagePrice}}
   Einlagerung:          +{{storagePrice}}€
   {{/if}}
   {{#if disposalPrice}}
   Entsorgung:           +{{disposalPrice}}€
   {{/if}}
   {{#if runFlatSurcharge}}
   RunFlat-Aufschlag:    +{{runFlatSurcharge}}€
   {{/if}}
   ─────────────────────
   Gesamtsumme:          {{totalPrice}}€ ✅ BEZAHLT
   ```

5. **Fahrzeug-Info**
   ```
   🚗 Ihr Fahrzeug:
   - Marke: {{vehicleBrand}}
   - Modell: {{vehicleModel}}
   - Kennzeichen: {{vehicleLicensePlate}}
   ```

6. **Werkstatt-Kontakt**
   ```
   📞 Kontakt zur Werkstatt:
   - Telefon: {{workshopPhone}}
   - Email: {{workshopEmail}}
   - Adresse: {{workshopAddress}}
   ```

7. **Kalender-Integration**
   ```
   📅 TERMIN IN KALENDER IMPORTIEREN
   
   Diese Email enthält eine ICS-Datei im Anhang.
   Öffnen Sie den Anhang, um den Termin automatisch in Ihren 
   Kalender (Google, Outlook, Apple) einzutragen.
   ```

8. **Wichtige Hinweise**
   ```
   ⚠️ Wichtige Hinweise:
   - Bitte erscheinen Sie pünktlich zum Termin
   - Bei Verspätung über 15 Min. bitte Werkstatt anrufen
   {{#if customerNotes}}
   - Ihre Nachricht an die Werkstatt: "{{customerNotes}}"
   {{/if}}
   ```

### Anhänge
- **ICS-Datei** (appointment.ics) mit Termin-Details

### Placeholders (für Admin-Panel)
```json
[
  { "key": "bookingId", "description": "Buchungsnummer (8 Zeichen)" },
  { "key": "serviceName", "description": "Name des Services" },
  { "key": "date", "description": "Termin-Datum (DD.MM.YYYY)" },
  { "key": "time", "description": "Termin-Uhrzeit (HH:MM)" },
  { "key": "durationMinutes", "description": "Dauer in Minuten" },
  { "key": "workshopName", "description": "Name der Werkstatt" },
  { "key": "workshopAddress", "description": "Adresse der Werkstatt" },
  { "key": "workshopPhone", "description": "Telefon der Werkstatt" },
  { "key": "workshopEmail", "description": "Email der Werkstatt" },
  { "key": "vehicleBrand", "description": "Fahrzeug-Marke" },
  { "key": "vehicleModel", "description": "Fahrzeug-Modell" },
  { "key": "vehicleLicensePlate", "description": "Kennzeichen" },
  { "key": "tireBrand", "description": "Reifen-Marke (falls Montage)" },
  { "key": "tireModel", "description": "Reifen-Modell" },
  { "key": "tireSize", "description": "Reifengröße (z.B. 205/55 R16)" },
  { "key": "tireQuantity", "description": "Anzahl Reifen (2/4)" },
  { "key": "tireRunFlat", "description": "true/false - RunFlat-Reifen" },
  { "key": "tire3PMSF", "description": "true/false - Winterreifen" },
  { "key": "hasBalancing", "description": "true/false - Auswuchtung gebucht" },
  { "key": "hasStorage", "description": "true/false - Einlagerung gebucht" },
  { "key": "hasDisposal", "description": "true/false - Entsorgung gebucht" },
  { "key": "hasRunFlatSurcharge", "description": "true/false - RunFlat-Aufschlag" },
  { "key": "basePrice", "description": "Basis-Preis" },
  { "key": "balancingPrice", "description": "Auswuchtung-Preis" },
  { "key": "storagePrice", "description": "Einlagerungs-Preis" },
  { "key": "disposalPrice", "description": "Entsorgungs-Preis" },
  { "key": "runFlatSurcharge", "description": "RunFlat-Aufschlag" },
  { "key": "totalPrice", "description": "Gesamtpreis" },
  { "key": "paymentMethod", "description": "Zahlungsmethode" },
  { "key": "customerNotes", "description": "Nachricht des Kunden" }
]
```

---

## 2️⃣ Werkstatt-Email: Neue Buchung mit Reifen-Bestellung

### Template-Key: `BOOKING_NOTIFICATION_WORKSHOP_PAID`

### Betreff
```
🔔 Neue BEZAHLTE Buchung: {{serviceName}} am {{date}} um {{time}} Uhr
```

### Email-Inhalt

Die Werkstatt-Email **variiert** je nach Lieferanten-System!

---

### **Szenario A: API-Lieferant (Automatische Bestellung)**

**Beispiel:** TyreSystem API - Reifen werden automatisch bestellt

```html
<h2>🎉 Neue Buchung - BEZAHLT & REIFEN BESTELLT</h2>

<div class="success-box">
  ✅ Die Zahlung wurde vom Kunden bereits geleistet.<br>
  ✅ Die Reifen wurden automatisch beim Lieferanten bestellt.
</div>

<h3>📅 Termin-Details</h3>
- Datum: {{date}}
- Uhrzeit: {{time}} Uhr
- Dauer: ca. {{durationMinutes}} Minuten
- Buchungsnummer: #{{bookingId}}

<h3>👤 Kunden-Informationen (für Rechnung)</h3>
- Name: {{customerName}}
- Email: {{customerEmail}}
- Telefon: {{customerPhone}}
- Adresse: {{customerAddress}}

<h3>🚗 Fahrzeug</h3>
- {{vehicleBrand}} {{vehicleModel}}
- Kennzeichen: {{vehicleLicensePlate}}

<h3>🔧 Gebuchter Service</h3>
- Service: {{serviceName}}
{{#if hasBalancing}}
- ✅ inkl. Auswuchtung
{{/if}}
{{#if hasStorage}}
- ✅ inkl. Einlagerung
{{/if}}

<h3>🛞 AUTOMATISCH BESTELLTE REIFEN</h3>

<div class="order-confirmed-box">
  ✅ Die Reifen wurden automatisch bestellt über:
  
  <strong>Lieferant:</strong> {{supplierName}} (API)
  <strong>Bestellnummer:</strong> {{supplierOrderId}}
  <strong>Status:</strong> Bestellt
  <strong>Liefertermin:</strong> {{estimatedDeliveryDate}}
  
  <table>
    <tr>
      <th>Artikel</th>
      <th>Menge</th>
      <th>EAN</th>
      <th>EK-Preis</th>
    </tr>
    <tr>
      <td>{{tireBrand}} {{tireModel}} {{tireSize}}</td>
      <td>{{tireQuantity}} Stück</td>
      <td>{{tireEAN}}</td>
      <td>{{tirePurchasePrice}}€ / Stk.</td>
    </tr>
  </table>
  
  <strong>Gesamt-EK:</strong> {{totalPurchasePrice}}€
</div>

<h3>💰 Finanzielle Übersicht</h3>

<table>
  <tr>
    <td>Kunde bezahlt:</td>
    <td><strong>{{totalPrice}}€</strong></td>
  </tr>
  <tr>
    <td>Platform-Provision (6,9%):</td>
    <td style="color: red;">-{{platformCommission}}€</td>
  </tr>
  <tr>
    <td>Ihre Auszahlung:</td>
    <td style="color: green;"><strong>{{workshopPayout}}€</strong></td>
  </tr>
</table>

<div class="info-box">
  ℹ️ Der Betrag von {{workshopPayout}}€ wird automatisch auf Ihr 
  Stripe-Konto überwiesen (Auszahlung je nach Einstellung: täglich/wöchentlich).
</div>

<h3>📦 Reifen-Einkauf</h3>

- Ihre Einkaufskosten: {{totalPurchasePrice}}€
- Reifen-Lieferung: {{estimatedDeliveryDate}}
- Tracking: {{trackingUrl}}

<div class="warning-box">
  ⚠️ WICHTIG: Die Rechnung vom Lieferanten erhalten Sie separat.
  Der Betrag von {{totalPurchasePrice}}€ wird vom Lieferanten separat 
  in Rechnung gestellt.
</div>

<h3>✅ Ihre nächsten Schritte</h3>

1. ✅ Reifen sind bestellt - keine Aktion erforderlich
2. 📦 Reifen-Lieferung erwarten am {{estimatedDeliveryDate}}
3. 📞 Bei Änderungen Kunden kontaktieren: {{customerPhone}}
4. 🔧 Termin ausführen am {{date}} um {{time}} Uhr
5. 🧾 Rechnung an Kunden ausstellen über {{totalPrice}}€

{{#if customerNotes}}
<div class="notes-box">
  💬 <strong>Nachricht vom Kunden:</strong><br>
  "{{customerNotes}}"
</div>
{{/if}}
```

---

### **Szenario B: CSV-Lieferant (Manuelle Bestellung)**

**Beispiel:** CSV-basierter Lieferant - Werkstatt muss selbst bestellen

```html
<h2>🔔 Neue Buchung - BEZAHLT</h2>

<div class="success-box">
  ✅ Die Zahlung wurde vom Kunden bereits geleistet.
</div>

<div class="warning-box">
  ⚠️ WICHTIG: Sie müssen die Reifen SELBST beim Lieferanten bestellen!
</div>

<h3>📅 Termin-Details</h3>
- Datum: {{date}}
- Uhrzeit: {{time}} Uhr
- Dauer: ca. {{durationMinutes}} Minuten
- Buchungsnummer: #{{bookingId}}

<h3>👤 Kunden-Informationen (für Rechnung)</h3>
- Name: {{customerName}}
- Email: {{customerEmail}}
- Telefon: {{customerPhone}}
- Adresse: {{customerAddress}}

<h3>🚗 Fahrzeug</h3>
- {{vehicleBrand}} {{vehicleModel}}
- Kennzeichen: {{vehicleLicensePlate}}

<h3>🔧 Gebuchter Service</h3>
- Service: {{serviceName}}
{{#if hasBalancing}}
- ✅ inkl. Auswuchtung
{{/if}}
{{#if hasStorage}}
- ✅ inkl. Einlagerung
{{/if}}

<h3>🛞 ZU BESTELLENDE REIFEN</h3>

<div class="order-required-box" style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px;">
  ⚠️ <strong>BITTE BESTELLEN SIE FOLGENDE REIFEN:</strong>
  
  <table style="margin-top: 15px; width: 100%;">
    <tr style="background: #f8f9fa;">
      <th style="padding: 10px; text-align: left;">Artikel</th>
      <th style="padding: 10px;">Menge</th>
      <th style="padding: 10px;">EAN</th>
      <th style="padding: 10px;">EK-Preis</th>
    </tr>
    <tr>
      <td style="padding: 10px;">
        <strong>{{tireBrand}} {{tireModel}}</strong><br>
        Größe: {{tireSize}}<br>
        {{#if tireRunFlat}}⚡ RunFlat{{/if}}
        {{#if tire3PMSF}}❄️ Winter (3PMSF){{/if}}
      </td>
      <td style="padding: 10px; text-align: center;">
        <strong style="font-size: 18px;">{{tireQuantity}} Stück</strong>
      </td>
      <td style="padding: 10px; text-align: center;">
        <code>{{tireEAN}}</code>
      </td>
      <td style="padding: 10px; text-align: center;">
        <strong>{{tirePurchasePrice}}€</strong> / Stk.
      </td>
    </tr>
    <tr>
      <td colspan="3" style="padding: 10px; text-align: right;"><strong>Gesamt-EK:</strong></td>
      <td style="padding: 10px; text-align: center; background: #e9ecef;">
        <strong style="font-size: 18px;">{{totalPurchasePrice}}€</strong>
      </td>
    </tr>
  </table>
  
  <div style="margin-top: 20px; padding: 15px; background: white; border-radius: 8px;">
    <strong>📞 Ihr Lieferant:</strong><br>
    <strong>{{supplierName}}</strong><br>
    Telefon: {{supplierPhone}}<br>
    Email: {{supplierEmail}}<br>
    {{#if supplierWebsite}}
    Website: <a href="{{supplierWebsite}}">{{supplierWebsite}}</a>
    {{/if}}
  </div>
</div>

<h3>💰 Finanzielle Übersicht</h3>

<table>
  <tr>
    <td>Kunde bezahlt:</td>
    <td><strong>{{totalPrice}}€</strong></td>
  </tr>
  <tr>
    <td>Platform-Provision (6,9%):</td>
    <td style="color: red;">-{{platformCommission}}€</td>
  </tr>
  <tr>
    <td>Ihre Auszahlung:</td>
    <td style="color: green;"><strong>{{workshopPayout}}€</strong></td>
  </tr>
  <tr>
    <td colspan="2" style="border-top: 2px solid #dee2e6; padding-top: 10px;"></td>
  </tr>
  <tr>
    <td>Ihre Reifen-Einkaufskosten:</td>
    <td style="color: orange;">{{totalPurchasePrice}}€</td>
  </tr>
  <tr>
    <td><strong>Ihr Gewinn (nach EK):</strong></td>
    <td style="color: green; font-size: 18px;">
      <strong>{{workshopProfit}}€</strong>
    </td>
  </tr>
</table>

<div class="info-box">
  ℹ️ Der Betrag von {{workshopPayout}}€ wird automatisch auf Ihr 
  Stripe-Konto überwiesen (Auszahlung je nach Einstellung: täglich/wöchentlich).
</div>

<h3>✅ Ihre nächsten Schritte</h3>

<ol style="font-size: 16px; line-height: 2;">
  <li>🛒 <strong>REIFEN BESTELLEN</strong> beim Lieferanten {{supplierName}}<br>
      <small style="color: #6c757d;">EAN: {{tireEAN}}, Menge: {{tireQuantity}} Stück</small>
  </li>
  <li>📦 Liefertermin bestätigen lassen</li>
  <li>📞 Bei Änderungen Kunden kontaktieren: {{customerPhone}}</li>
  <li>🔧 Termin ausführen am {{date}} um {{time}} Uhr</li>
  <li>🧾 Rechnung an Kunden ausstellen über {{totalPrice}}€</li>
</ol>

{{#if customerNotes}}
<div class="notes-box">
  💬 <strong>Nachricht vom Kunden:</strong><br>
  "{{customerNotes}}"
</div>
{{/if}}
```

---

### **Szenario C: Räderwechsel (keine Reifen-Bestellung)**

**Beispiel:** Kunde bringt eigene Räder mit

```html
<h2>🔔 Neue Buchung - BEZAHLT</h2>

<div class="success-box">
  ✅ Die Zahlung wurde vom Kunden bereits geleistet.
</div>

<h3>📅 Termin-Details</h3>
- Datum: {{date}}
- Uhrzeit: {{time}} Uhr
- Dauer: ca. {{durationMinutes}} Minuten
- Buchungsnummer: #{{bookingId}}

<h3>👤 Kunden-Informationen (für Rechnung)</h3>
- Name: {{customerName}}
- Email: {{customerEmail}}
- Telefon: {{customerPhone}}
- Adresse: {{customerAddress}}

<h3>🚗 Fahrzeug</h3>
- {{vehicleBrand}} {{vehicleModel}}
- Kennzeichen: {{vehicleLicensePlate}}

<h3>🔧 Gebuchter Service</h3>

<strong>RÄDERWECHSEL</strong> (Kunde bringt eigene Räder mit)

Zusatzleistungen:
{{#if hasBalancing}}
- ✅ Auswuchtung (+{{balancingPrice}}€)
{{/if}}
{{#if hasStorage}}
- ✅ Einlagerung (+{{storagePrice}}€)
{{/if}}

<h3>💰 Finanzielle Übersicht</h3>

<table>
  <tr>
    <td>Basis-Service:</td>
    <td>{{basePrice}}€</td>
  </tr>
  {{#if balancingPrice}}
  <tr>
    <td>Auswuchtung:</td>
    <td>+{{balancingPrice}}€</td>
  </tr>
  {{/if}}
  {{#if storagePrice}}
  <tr>
    <td>Einlagerung:</td>
    <td>+{{storagePrice}}€</td>
  </tr>
  {{/if}}
  <tr style="border-top: 2px solid #dee2e6;">
    <td><strong>Kunde bezahlt:</strong></td>
    <td><strong>{{totalPrice}}€</strong></td>
  </tr>
  <tr>
    <td>Platform-Provision (6,9%):</td>
    <td style="color: red;">-{{platformCommission}}€</td>
  </tr>
  <tr>
    <td><strong>Ihre Auszahlung:</strong></td>
    <td style="color: green;"><strong>{{workshopPayout}}€</strong></td>
  </tr>
</table>

<h3>✅ Ihre nächsten Schritte</h3>

1. 📞 Bei Änderungen Kunden kontaktieren: {{customerPhone}}
2. 🔧 Termin ausführen am {{date}} um {{time}} Uhr
3. 🧾 Rechnung an Kunden ausstellen über {{totalPrice}}€

{{#if customerNotes}}
<div class="notes-box">
  💬 <strong>Nachricht vom Kunden:</strong><br>
  "{{customerNotes}}"
</div>
{{/if}}
```

---

### Placeholders (für Admin-Panel)

**Werkstatt-Email benötigt MEHR Daten als Kunden-Email:**

```json
[
  // Basis-Daten
  { "key": "bookingId", "description": "Buchungsnummer" },
  { "key": "serviceName", "description": "Service-Name" },
  { "key": "date", "description": "Termin-Datum" },
  { "key": "time", "description": "Termin-Uhrzeit" },
  { "key": "durationMinutes", "description": "Dauer in Minuten" },
  
  // Kunden-Daten (für Rechnung!)
  { "key": "customerName", "description": "Kunden-Name" },
  { "key": "customerEmail", "description": "Kunden-Email" },
  { "key": "customerPhone", "description": "Kunden-Telefon" },
  { "key": "customerAddress", "description": "Kunden-Adresse (Straße, PLZ, Stadt)" },
  
  // Fahrzeug
  { "key": "vehicleBrand", "description": "Fahrzeug-Marke" },
  { "key": "vehicleModel", "description": "Fahrzeug-Modell" },
  { "key": "vehicleLicensePlate", "description": "Kennzeichen" },
  
  // Reifen-Daten (falls Montage)
  { "key": "tireBrand", "description": "Reifen-Marke" },
  { "key": "tireModel", "description": "Reifen-Modell" },
  { "key": "tireSize", "description": "Reifengröße" },
  { "key": "tireQuantity", "description": "Anzahl Reifen" },
  { "key": "tireEAN", "description": "EAN-Nummer des Reifens" },
  { "key": "tireRunFlat", "description": "RunFlat ja/nein" },
  { "key": "tire3PMSF", "description": "Winterreifen ja/nein" },
  
  // Lieferanten-Daten
  { "key": "supplierName", "description": "Name des Lieferanten" },
  { "key": "supplierPhone", "description": "Telefon des Lieferanten" },
  { "key": "supplierEmail", "description": "Email des Lieferanten" },
  { "key": "supplierWebsite", "description": "Website des Lieferanten" },
  { "key": "supplierConnectionType", "description": "'API' oder 'CSV'" },
  { "key": "supplierOrderId", "description": "Bestellnummer beim Lieferanten (falls API)" },
  { "key": "estimatedDeliveryDate", "description": "Voraussichtlicher Liefertermin" },
  { "key": "trackingUrl", "description": "Tracking-Link (falls vorhanden)" },
  
  // Preis-Daten (Einkauf)
  { "key": "tirePurchasePrice", "description": "EK-Preis pro Reifen" },
  { "key": "totalPurchasePrice", "description": "Gesamt-EK für alle Reifen" },
  
  // Preis-Daten (Verkauf & Provision)
  { "key": "basePrice", "description": "Basis-Service-Preis" },
  { "key": "balancingPrice", "description": "Auswuchtung-Preis" },
  { "key": "storagePrice", "description": "Einlagerungs-Preis" },
  { "key": "totalPrice", "description": "Gesamt-Preis den Kunde bezahlt" },
  { "key": "platformCommission", "description": "Plattform-Provision (6,9%)" },
  { "key": "workshopPayout", "description": "Auszahlung an Werkstatt (93,1%)" },
  { "key": "workshopProfit", "description": "Gewinn nach EK (workshopPayout - totalPurchasePrice)" },
  
  // Zusatzleistungen
  { "key": "hasBalancing", "description": "Auswuchtung gebucht" },
  { "key": "hasStorage", "description": "Einlagerung gebucht" },
  
  // Sonstiges
  { "key": "customerNotes", "description": "Nachricht vom Kunden" }
]
```

---

## 3️⃣ ICS-Datei Generierung

### Technische Implementation

**Bibliothek:** `ics` (npm package)

```bash
npm install ics
```

**Code-Beispiel:**

```typescript
// lib/calendar.ts
import { createEvent, EventAttributes } from 'ics'
import { format, addMinutes } from 'date-fns'

export function generateICSFile(data: {
  bookingId: string
  serviceName: string
  workshopName: string
  workshopAddress: string
  date: Date
  time: string
  durationMinutes: number
  customerEmail: string
  workshopEmail: string
}) {
  // Parse date and time
  const [hours, minutes] = data.time.split(':').map(Number)
  const startDate = new Date(data.date)
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = addMinutes(startDate, data.durationMinutes)
  
  const event: EventAttributes = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1, // JS months are 0-indexed
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes()
    ],
    end: [
      endDate.getFullYear(),
      endDate.getMonth() + 1,
      endDate.getDate(),
      endDate.getHours(),
      endDate.getMinutes()
    ],
    title: `${data.serviceName} - ${data.workshopName}`,
    description: `Buchung #${data.bookingId.substring(0, 8).toUpperCase()}\\n\\n` +
                 `Service: ${data.serviceName}\\n` +
                 `Werkstatt: ${data.workshopName}\\n` +
                 `Adresse: ${data.workshopAddress}`,
    location: `${data.workshopName}, ${data.workshopAddress}`,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: data.workshopName, email: data.workshopEmail },
    attendees: [
      { name: 'Sie', email: data.customerEmail, rsvp: true, role: 'REQ-PARTICIPANT' }
    ],
    alarms: [
      { action: 'display', trigger: { hours: 24, before: true }, description: 'Termin morgen' },
      { action: 'display', trigger: { hours: 1, before: true }, description: 'Termin in 1 Stunde' }
    ]
  }
  
  const { error, value } = createEvent(event)
  
  if (error) {
    console.error('ICS generation error:', error)
    return null
  }
  
  return value // ICS file content as string
}
```

**Integration in Email-Versand:**

```typescript
// In Webhook-Handler nach erfolgreicher Zahlung
const icsContent = generateICSFile({
  bookingId: booking.id,
  serviceName: 'Reifenwechsel',
  workshopName: workshop.name,
  workshopAddress: `${workshop.street}, ${workshop.zipCode} ${workshop.city}`,
  date: booking.date,
  time: booking.time,
  durationMinutes: booking.durationMinutes,
  customerEmail: customer.email,
  workshopEmail: workshop.email
})

await sendTemplateEmail(
  'BOOKING_CONFIRMATION_CUSTOMER_PAID',
  customer.email,
  { ...templateData },
  [
    {
      filename: 'termin.ics',
      content: icsContent,
      contentType: 'text/calendar; charset=utf-8; method=REQUEST'
    }
  ]
)
```

---

## 4️⃣ Datenbank-Erweiterungen (falls notwendig)

### Fehlende Felder in DirectBooking

**Aktuell fehlt:**
- `tireRequestId` → Link zu TireRequest (für Reifen-Details)
- `offerId` → Link zu Offer (für Lieferanten-Info)
- `supplierOrderId` → Bestellnummer beim Lieferanten (API)
- `supplierConnectionType` → 'API' oder 'CSV'
- `tireEAN` → EAN-Nummer des Reifens
- `tirePurchasePrice` → Einkaufspreis pro Reifen
- `disposalFee` → Entsorgungsgebühr
- `runFlatSurcharge` → RunFlat-Aufschlag

**Vorgeschlagene Migration:**

```prisma
model DirectBooking {
  // ... existing fields ...
  
  // Tire Request Link (für Reifen-Montage)
  tireRequestId String?      @map("tire_request_id")
  tireRequest   TireRequest? @relation(fields: [tireRequestId], references: [id])
  
  offerId String? @map("offer_id")
  offer   Offer?  @relation(fields: [offerId], references: [id])
  
  // Supplier Information
  supplierOrderId        String?  @map("supplier_order_id") // Bestellnummer beim Lieferanten
  supplierConnectionType String?  @map("supplier_connection_type") // 'API' | 'CSV'
  estimatedDeliveryDate  DateTime? @map("estimated_delivery_date") @db.Date
  
  // Tire Details (denormalized für schnellen Zugriff)
  tireEAN           String?  @map("tire_ean")
  tirePurchasePrice Decimal? @map("tire_purchase_price") @db.Decimal(10, 2)
  
  // Additional Fees
  disposalFee      Decimal? @map("disposal_fee") @db.Decimal(10, 2)
  runFlatSurcharge Decimal? @map("runflat_surcharge") @db.Decimal(10, 2)
  
  // Customer Notes
  customerNotes String? @map("customer_notes") @db.Text
  
  @@index([tireRequestId])
  @@index([offerId])
}
```

---

## 5️⃣ Workflow-Logik im Webhook-Handler

### Nach erfolgreicher Zahlung (`checkout.session.completed`)

```typescript
// app/api/webhooks/stripe/route.ts

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // 1. DirectBooking aus Metadata holen
  const { workshopId, customerId, vehicleId, serviceType, ... } = session.metadata
  
  // 2. Workshop-Supplier abrufen
  const workshopSupplier = await prisma.workshopSupplier.findFirst({
    where: { workshopId },
    include: { 
      workshop: true,
      // Falls es eine Supplier-Relation gibt
    }
  })
  
  // 3. Falls Reifenmontage: TireRequest & Offer laden
  let tireData = null
  let supplierInfo = null
  
  if (serviceType === 'TIRE_CHANGE' || serviceType === 'TIRE_MOUNT') {
    const offer = await prisma.offer.findUnique({
      where: { id: session.metadata.offerId },
      include: {
        tireRequest: {
          include: {
            tires: true // Reifen-Details
          }
        }
      }
    })
    
    tireData = {
      brand: offer.tireBrand,
      model: offer.tireModel,
      size: offer.tireSize,
      quantity: offer.quantity,
      ean: offer.tires[0]?.ean,
      purchasePrice: offer.purchasePrice,
      runFlat: offer.tires[0]?.runFlat,
      threePMSF: offer.tires[0]?.threePMSF
    }
    
    supplierInfo = {
      name: workshopSupplier.name,
      connectionType: workshopSupplier.connectionType,
      phone: workshopSupplier.supplierPhone, // Falls vorhanden
      email: workshopSupplier.supplierEmail
    }
    
    // 4. Falls API-Lieferant: Automatische Bestellung
    if (workshopSupplier.connectionType === 'API') {
      const orderResult = await orderTiresFromSupplier({
        supplierId: workshopSupplier.supplier,
        ean: tireData.ean,
        quantity: tireData.quantity,
        workshopId
      })
      
      supplierInfo.orderId = orderResult.orderId
      supplierInfo.estimatedDelivery = orderResult.estimatedDelivery
    }
  }
  
  // 5. DirectBooking erstellen/updaten
  await prisma.directBooking.update({
    where: { id: booking.id },
    data: {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      paidAt: new Date(),
      // Supplier-Daten
      supplierOrderId: supplierInfo?.orderId,
      supplierConnectionType: supplierInfo?.connectionType,
      estimatedDeliveryDate: supplierInfo?.estimatedDelivery,
      // Reifen-Daten
      tireEAN: tireData?.ean,
      tirePurchasePrice: tireData?.purchasePrice,
      // Provision
      platformCommission,
      workshopPayout,
      ...
    }
  })
  
  // 6. ICS-Datei generieren
  const icsFile = generateICSFile({ ... })
  
  // 7. Kunden-Email senden
  await sendTemplateEmail(
    'BOOKING_CONFIRMATION_CUSTOMER_PAID',
    customer.email,
    {
      bookingId: booking.id,
      serviceName: serviceLabels[serviceType],
      date: format(booking.date, 'dd.MM.yyyy'),
      time: booking.time,
      workshopName: workshop.name,
      ...tireData, // Falls Montage
      totalPrice: booking.totalPrice,
      ...
    },
    [
      {
        filename: 'termin.ics',
        content: icsFile,
        contentType: 'text/calendar'
      }
    ]
  )
  
  // 8. Werkstatt-Email senden (Template abhängig von connectionType)
  const workshopTemplate = supplierInfo?.connectionType === 'API'
    ? 'BOOKING_NOTIFICATION_WORKSHOP_API'
    : 'BOOKING_NOTIFICATION_WORKSHOP_CSV'
  
  await sendTemplateEmail(
    workshopTemplate,
    workshop.email,
    {
      bookingId: booking.id,
      date: format(booking.date, 'dd.MM.yyyy'),
      time: booking.time,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: `${customer.street}, ${customer.zipCode} ${customer.city}`,
      ...tireData,
      ...supplierInfo,
      platformCommission: booking.platformCommission,
      workshopPayout: booking.workshopPayout,
      workshopProfit: booking.workshopPayout - (tireData?.purchasePrice * tireData?.quantity),
      ...
    }
  )
}
```

---

## 6️⃣ Admin-Panel: Email-Template-Verwaltung

### Neue Templates erstellen

**Route:** `/admin/email-templates`

**Schritte:**
1. "Neues Template erstellen" Button
2. Template-Key eingeben: `BOOKING_CONFIRMATION_CUSTOMER_PAID`
3. Name: "Buchungsbestätigung Kunde (Bezahlt)"
4. Subject: `✅ Ihre Buchung wurde bestätigt - {{serviceName}} am {{date}}`
5. HTML-Content: (siehe oben)
6. Placeholders: JSON-Array mit allen Variablen
7. isActive: true
8. Speichern

**Preview-Funktion:**
- Template mit Test-Daten rendern
- Live-Preview im Admin-Panel

---

## 7️⃣ Testing-Plan

### Test-Szenarien

1. **Räderwechsel** (keine Reifen, keine Lieferanten)
   - Kunde bekommt: Termin + ICS
   - Werkstatt bekommt: Termin + Kunden-Info

2. **Reifenmontage mit API-Lieferant** (TyreSystem)
   - Kunde bekommt: Termin + Reifen-Details + ICS
   - Werkstatt bekommt: "Reifen automatisch bestellt" + Liefertermin + Kunden-Info

3. **Reifenmontage mit CSV-Lieferant**
   - Kunde bekommt: Termin + Reifen-Details + ICS
   - Werkstatt bekommt: "BITTE REIFEN BESTELLEN" + EAN + Lieferanten-Kontakt

4. **Mit Zusatzleistungen** (Auswuchtung, Einlagerung, Entsorgung, RunFlat)
   - Beide Emails zeigen alle gebuchten Extras mit Preisen

---

## ✅ Zusammenfassung

### Was implementiert werden muss:

1. **3 neue Email-Templates** (Admin-Panel):
   - `BOOKING_CONFIRMATION_CUSTOMER_PAID` (Kunde)
   - `BOOKING_NOTIFICATION_WORKSHOP_API` (Werkstatt API-Lieferant)
   - `BOOKING_NOTIFICATION_WORKSHOP_CSV` (Werkstatt CSV-Lieferant)

2. **ICS-Generator** (`lib/calendar.ts`):
   - npm install ics
   - generateICSFile() Funktion
   - Integration in Email-Versand

3. **Webhook-Handler Erweiterung** (`app/api/webhooks/stripe/route.ts`):
   - WorkshopSupplier-Abfrage
   - TireRequest & Offer laden (falls Montage)
   - API-Bestellung triggern (falls API-Lieferant)
   - Template-Auswahl basierend auf connectionType
   - Alle Daten sammeln für Email-Placeholders

4. **Datenbank-Migration** (optional aber empfohlen):
   - DirectBooking erweitern mit Supplier- und Tire-Feldern
   - Migration erstellen und ausführen

5. **Testing**:
   - Alle 3 Szenarien (Räderwechsel, API, CSV) testen
   - Email-Rendering prüfen
   - ICS-Import in verschiedene Kalender testen

---

## 📝 Nächste Schritte

**Ich kann jetzt:**
1. ✅ Die Email-Templates im Admin-Panel erstellen
2. ✅ Den ICS-Generator implementieren
3. ✅ Den Webhook-Handler erweitern
4. ✅ Die Datenbank-Migration vorbereiten
5. ✅ Ein Test-Booking durchführen

**Was willst du zuerst angehen?**
