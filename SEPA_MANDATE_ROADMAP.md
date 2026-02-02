# SEPA-Mandat Management Roadmap

## ✅ Phase 1: Mandat-Wechsel ermöglichen (ERLEDIGT - 31.01.2026)

**Implementiert:**
- ✅ Werkstatt kann neues Mandat einrichten, auch wenn bereits eins existiert
- ✅ "Neues Mandat einrichten (ersetzt das aktuelle)" Button im Frontend
- ✅ Automatisches Ersetzen des alten Mandats bei erfolgreicher Einrichtung
- ✅ Logging für bessere Nachverfolgbarkeit

**Gelöstes Problem:**
- Werkstatt hatte Mandat mit Status "pending_submission" oder "submitted"
- Konnte kein neues Mandat einrichten weil System blockierte
- GoCardless sagt: Status wird erst "active" nach der ersten Zahlung

---

## 📋 Phase 2: IBAN-Änderungs-Detektion & Warnings (PRIORITÄT: P0)

**Ziel:** System erkennt IBAN-Änderung und warnt Werkstatt

### 2.1 Backend - IBAN Change Detection
**Datei:** `app/api/workshop/profile/route.ts` (PATCH endpoint)

```typescript
// Prüfen ob IBAN sich geändert hat
const oldWorkshop = await prisma.workshop.findUnique({
  where: { userId: session.user.id },
  select: { 
    iban: true, 
    gocardlessMandateId: true, 
    gocardlessMandateStatus: true 
  }
})

const ibanChanged = iban && iban !== oldWorkshop?.iban
const hasActiveMandate = oldWorkshop?.gocardlessMandateStatus === 'active'

// Wenn IBAN geändert wird UND aktives Mandat existiert:
if (ibanChanged && hasActiveMandate) {
  // 1. Mandat-Status auf "invalidated_by_iban_change" setzen
  updateData.gocardlessMandateStatus = 'invalidated_by_iban_change'
  
  // 2. Flags setzen
  updateData.mandateRenewalRequired = true
  updateData.mandateRenewalReason = 'IBAN geändert'
  updateData.oldIban = oldWorkshop.iban // Audit Trail
  updateData.ibanChangedAt = new Date()
  
  // 3. Optional: Altes Mandat bei GoCardless stornieren
  try {
    const client = await getGocardlessClient()
    await client.mandates.cancel(oldWorkshop.gocardlessMandateId, {
      metadata: { reason: 'IBAN changed by workshop' }
    })
  } catch (error) {
    console.error('GoCardless cancel failed:', error)
    // Trotzdem weitermachen
  }
  
  // 4. E-Mail an Werkstatt senden
  await sendMandateRenewalEmail(workshop)
}
```

### 2.2 Prisma Schema Erweiterung

```prisma
model Workshop {
  // ... bestehende Felder
  
  // Neue Felder für IBAN-Wechsel-Management:
  mandateRenewalRequired Boolean  @default(false)
  mandateRenewalReason   String?  // "IBAN geändert", "Mandat abgelaufen", etc.
  mandateRenewalDeadline DateTime? // 30 Tage ab IBAN-Änderung
  oldIban                String?   // Für Audit-Trail
  ibanChangedAt          DateTime?
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_mandate_renewal_fields
```

### 2.3 Frontend - Rote Warnbox
**Datei:** `app/dashboard/workshop/settings/page.tsx`

```tsx
{mandate?.configured && mandate.status === 'invalidated_by_iban_change' && (
  <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
    <div className="flex items-start gap-3">
      <svg className="w-6 h-6 text-red-600">...</svg>
      <div>
        <h3 className="font-bold text-red-900">
          ⚠️ Neues SEPA-Mandat erforderlich
        </h3>
        <p className="text-red-800 mt-1">
          Sie haben Ihre IBAN geändert ({mandate.oldIban} → {mandate.newIban}). 
          Das bisherige Lastschriftmandat ist dadurch <strong>ungültig geworden</strong>. 
          Bitte richten Sie ein neues Mandat ein, damit wir Ihre Provisionen 
          weiterhin abbuchen können.
        </p>
        <button 
          onClick={createMandate}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Jetzt neues Mandat einrichten
        </button>
      </div>
    </div>
  </div>
)}
```

### 2.4 E-Mail Template: "Neues SEPA-Mandat erforderlich"

**Betreff:** Wichtig: Neues SEPA-Mandat erforderlich

```html
Sehr geehrte/r {workshopName},

Sie haben kürzlich Ihre Bankverbindung (IBAN) in Ihrem Bereifung24-Account geändert.

Dadurch ist Ihr bisheriges SEPA-Lastschriftmandat (Ref: {oldMandateRef}) 
**nicht mehr gültig**.

🔴 **Handlungsbedarf:** Bitte richten Sie ein neues SEPA-Mandat ein, damit wir 
Ihre monatlichen Provisionen weiterhin automatisch abbuchen können.

[Jetzt neues Mandat einrichten]

Ohne gültiges Mandat:
❌ Können Sie keine neuen Angebote erstellen
❌ Müssen Provisionen manuell überwiesen werden (+ Verwaltungsgebühr)

Mit freundlichen Grüßen
Ihr Bereifung24-Team
```

**Implementierung:**
- E-Mail-Template in `email_templates` Tabelle erstellen
- Send-Funktion in `lib/email.ts` erweitern
- Von `app/api/workshop/profile/route.ts` aufrufen

---

## 📋 Phase 3: Admin-Dashboard & Monitoring (PRIORITÄT: P1)

**Ziel:** Admin sieht alle problematischen Mandate und kann handeln

### 3.1 Neue Admin-Seite
**Datei:** `app/admin/sepa-mandates/page.tsx`

**Features:**
- Liste aller Werkstätten mit ungültigen Mandaten
- Filter: "IBAN geändert", "Nie aktiviert", "Abgelaufen"
- Sortierung: Nach Dringlichkeit (Deadline)
- Bulk-Aktionen: Erinnerungs-E-Mail an ausgewählte senden

```tsx
<Card title="SEPA-Mandate - Problemfälle">
  <Tabs>
    <Tab label="IBAN geändert (Aktion nötig)" count={3} color="red" />
    <Tab label="Nie aktiviert" count={7} color="yellow" />
    <Tab label="Alle aktiven Mandate" count={142} color="green" />
  </Tabs>
  
  <Table>
    <thead>
      <tr>
        <th>Werkstatt</th>
        <th>Status</th>
        <th>Problem seit</th>
        <th>Deadline</th>
        <th>Letztes Mandat</th>
        <th>Aktionen</th>
      </tr>
    </thead>
    <tbody>
      {workshopsWithInvalidMandates.map(w => (
        <tr className={getDaysUntilDeadline(w) < 7 ? 'bg-red-50' : ''}>
          <td>
            <div>
              <div className="font-medium">{w.companyName}</div>
              <div className="text-sm text-gray-500">{w.email}</div>
            </div>
          </td>
          <td>
            <Badge color="red">Mandat ungültig</Badge>
          </td>
          <td>{formatDate(w.ibanChangedAt)}</td>
          <td>
            <span className={getDaysUntilDeadline(w) < 7 ? 'text-red-600 font-bold' : ''}>
              {formatDate(w.mandateRenewalDeadline)}
              <br />
              <span className="text-sm">
                ({getDaysUntilDeadline(w)} Tage)
              </span>
            </span>
          </td>
          <td>
            <code className="text-xs">{w.gocardlessMandateRef}</code>
          </td>
          <td>
            <Button size="sm" onClick={() => sendReminderEmail(w.id)}>
              📧 Erinnerung senden
            </Button>
            <Button size="sm" variant="outline" onClick={() => viewDetails(w.id)}>
              Details
            </Button>
          </td>
        </tr>
      ))}
    </tbody>
  </Table>
</Card>
```

### 3.2 API Endpoints

**GET /api/admin/sepa-mandates/invalid**
- Gibt alle Werkstätten mit `mandateRenewalRequired=true` zurück
- Filter-Parameter: `status`, `daysUntilDeadline`
- Pagination

**POST /api/admin/sepa-mandates/send-reminder**
- Body: `{ workshopIds: string[] }`
- Sendet Erinnerungs-E-Mail an ausgewählte Werkstätten
- Logging für Nachverfolgbarkeit

---

## 📋 Phase 4: Automatische Erinnerungen & Eskalation (PRIORITÄT: P2)

**Ziel:** Automatische E-Mails und schrittweise Einschränkungen

### 4.1 Erinnerungs-Zeitplan

| Tag | Aktion | E-Mail | Frontend |
|-----|--------|--------|----------|
| 0 | IBAN geändert | ✅ Sofort: "Neues Mandat erforderlich" | 🔵 Blaue Info-Box |
| 3 | - | ✅ Erinnerung: "Noch 27 Tage Zeit" | 🟡 Gelbe Warnbox |
| 7 | - | ✅ Erinnerung: "Noch 23 Tage Zeit" | 🟡 Gelbe Warnbox |
| 14 | - | ✅ Dringende Erinnerung: "Noch 16 Tage" | 🟠 Orange Warnbox |
| 21 | - | ✅ Letzte Warnung: "Noch 9 Tage" | 🔴 Rote Warnbox |
| 30 | Account einschränken | ✅ "Account eingeschränkt" | 🔴 Rote Sperrbox + Banner |

### 4.2 Eskalationsstufen

**Stufe 1 (Tag 0-20): Warnung**
- Werkstatt kann alles wie gewohnt nutzen
- Sichtbare Warnungen im Dashboard
- E-Mail-Erinnerungen

**Stufe 2 (Tag 21-29): Starke Warnung**
- Werkstatt kann alles wie gewohnt nutzen
- Großer roter Banner auf allen Seiten
- Tägliche E-Mail-Erinnerungen

**Stufe 3 (Ab Tag 30): Einschränkung**
- ❌ Keine neuen Angebote mehr möglich
- ❌ Keine neuen Anfragen sichtbar
- ✅ Bestehende Termine bleiben verfügbar
- ✅ Kundenverwaltung weiter möglich
- 📧 E-Mail: "Account eingeschränkt"

**Stufe 4 (Ab Tag 60): Vollständige Sperrung** (optional)
- ❌ Kompletter Account gesperrt
- Nur noch Einstellungen-Seite erreichbar
- Prominenter "Mandat einrichten" Button

### 4.3 Cron Job für automatische Erinnerungen
**Datei:** `app/api/cron/sepa-mandate-reminders/route.ts`

```typescript
export async function GET() {
  // Täglich um 09:00 Uhr ausführen (Vercel Cron)
  
  const now = new Date()
  
  // Werkstätten mit ungültigem Mandat finden
  const workshops = await prisma.workshop.findMany({
    where: {
      mandateRenewalRequired: true,
      mandateRenewalDeadline: { gte: now }
    },
    include: { user: true }
  })
  
  for (const workshop of workshops) {
    const daysUntilDeadline = getDaysUntil(workshop.mandateRenewalDeadline)
    
    // Erinnerungs-E-Mails an bestimmten Tagen
    if ([3, 7, 14, 21].includes(daysUntilDeadline)) {
      await sendReminderEmail(workshop, daysUntilDeadline)
    }
    
    // Sperrung bei Tag 30
    if (daysUntilDeadline === 0) {
      await restrictWorkshopAccess(workshop)
      await sendAccountRestrictedEmail(workshop)
    }
  }
  
  return NextResponse.json({ success: true })
}
```

**Vercel Cron Config** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/sepa-mandate-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

### 4.4 Access Restriction Middleware
**Datei:** `middleware.ts` (erweitern)

```typescript
// Bei /dashboard/workshop/* Requests prüfen
const workshop = await getWorkshop(userId)

if (workshop.mandateRenewalRequired) {
  const daysUntilDeadline = getDaysUntil(workshop.mandateRenewalDeadline)
  
  if (daysUntilDeadline <= 0) {
    // Sperrung aktiv
    const allowedPaths = [
      '/dashboard/workshop/settings',
      '/dashboard/workshop/profile'
    ]
    
    if (!allowedPaths.some(p => pathname.startsWith(p))) {
      return NextResponse.redirect(new URL('/dashboard/workshop/settings?mandate_required=true', request.url))
    }
  }
}
```

---

## 📊 Reporting & Metriken (PRIORITÄT: P3)

**Für Admin-Dashboard:**
- Anzahl Werkstätten mit ungültigen Mandaten
- Durchschnittliche Zeit bis zur Mandat-Erneuerung
- Erfolgsquote der Erinnerungs-E-Mails
- Anzahl gesperrter Accounts

**Für Geschäftsführung:**
- Wie viele Werkstätten haben nie ein Mandat eingerichtet?
- Wie viele Mandate sind in "pending_submission" seit >14 Tagen?
- Auswirkung auf Provisionseinnahmen

---

## 🎯 Implementierungs-Checkliste

### Phase 2 - IBAN-Änderungs-Detektion (Nächste Schritte)
- [ ] Prisma Schema erweitern (`mandateRenewalRequired`, etc.)
- [ ] Migration erstellen und deployen
- [ ] `app/api/workshop/profile/route.ts` anpassen (IBAN-Änderung erkennen)
- [ ] E-Mail-Template "Neues Mandat erforderlich" erstellen
- [ ] Rote Warnbox im Frontend (`app/dashboard/workshop/settings/page.tsx`)
- [ ] Testing: IBAN ändern → Warnung sehen

### Phase 3 - Admin-Dashboard (Diese Woche)
- [ ] `app/admin/sepa-mandates/page.tsx` erstellen
- [ ] API `/api/admin/sepa-mandates/invalid` implementieren
- [ ] API `/api/admin/sepa-mandates/send-reminder` implementieren
- [ ] Admin-Navigation erweitern
- [ ] Testing: Admin sieht Problemfälle

### Phase 4 - Automatische Erinnerungen (Nächste Woche)
- [ ] Cron Job `/api/cron/sepa-mandate-reminders/route.ts` erstellen
- [ ] E-Mail-Templates für alle Eskalationsstufen
- [ ] Vercel Cron konfigurieren
- [ ] Access Restriction Middleware implementieren
- [ ] Testing: Zeitplan simulieren (Deadlines manipulieren)

---

## 🔒 Sicherheits- & Compliance-Hinweise

1. **DSGVO:** Alte IBAN in `oldIban` speichern (max. 3 Monate, dann löschen)
2. **Audit Trail:** Alle Mandat-Änderungen loggen (`AccountingAuditLog`)
3. **E-Mail-Compliance:** Opt-out für Erinnerungs-E-Mails (außer kritische Warnungen)
4. **Testing:** Nie in Production mit echten GoCardless-Mandaten testen (Sandbox!)

---

## 📝 Notizen

**GoCardless Mandate Statuses:**
- `pending_submission`: Mandat erstellt, noch nicht bei Bank eingereicht
- `submitted`: Bei Bank eingereicht, wartet auf Bestätigung (3-5 Tage)
- `active`: Aktiv und einsatzbereit (erst nach erster Zahlung!)
- `failed`: Fehlgeschlagen (Bank hat abgelehnt)
- `cancelled`: Von Kunde oder uns storniert
- `expired`: Abgelaufen (keine Aktivität >13 Monate)

**Wichtig:** Ein Mandat wird erst `active` nach der ersten erfolgreichen Zahlung. 
Vorher kann es Wochen in `submitted` bleiben!

---

**Erstellt:** 31.01.2026  
**Status:** Phase 1 abgeschlossen, Phase 2-4 geplant  
**Verantwortlich:** Zdenek Kyzlink
