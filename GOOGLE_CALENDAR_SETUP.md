# Google Calendar Integration Setup

## Status: Implementiert - Konfiguration erforderlich

Die Google Calendar Integration ist vollständig implementiert und wartet auf die Konfiguration der Google Cloud Credentials.

## 📋 Was wurde implementiert:

### 1. Database Schema (`prisma/schema.prisma`)
- **Workshop-Tabelle erweitert:**
  - `calendarMode`: "workshop" oder "employees"
  - `googleCalendarId`: Google Kalender ID
  - `googleAccessToken`: OAuth Access Token
  - `googleRefreshToken`: OAuth Refresh Token
  - `googleTokenExpiry`: Token Ablaufzeit

- **Neue Employee-Tabelle:**
  - Mitarbeiter-Informationen (Name, E-Mail)
  - Google Calendar Integration pro Mitarbeiter
  - `workingHours`: JSON mit Arbeitszeiten pro Wochentag
  
- **Booking-Tabelle erweitert:**
  - `employeeId`: Zuordnung zu Mitarbeiter
  - `googleEventId`: Referenz zum Google Calendar Event

### 2. Google Calendar Service (`lib/google-calendar.ts`)
Folgende Funktionen:
- `getAuthUrl()` - OAuth URL generieren
- `getTokensFromCode()` - Authorization Code zu Tokens tauschen
- `refreshAccessToken()` - Token auffrischen
- `createCalendarEvent()` - Termin im Kalender erstellen
- `updateCalendarEvent()` - Termin aktualisieren
- `deleteCalendarEvent()` - Termin löschen
- `getBusySlots()` - Belegte Zeiten abfragen
- `generateAvailableSlots()` - Freie Zeitslots berechnen

### 3. API Endpoints
- **`POST /api/calendar/connect`** - OAuth Flow starten
- **`GET /api/calendar/callback`** - OAuth Callback verarbeiten
- **`GET /api/calendar/available-slots`** - Verfügbare Zeitslots abrufen

### 4. Frontend (bereits erstellt)
- Terminplanungs-Tab in Workshop-Einstellungen
- Auswahl zwischen Werkstatt- und Mitarbeiter-Modus
- Mitarbeiterverwaltung mit Arbeitszeiten

## 🔧 Nächste Schritte:

### Schritt 1: Google Cloud Projekt einrichten

1. **Gehe zu https://console.cloud.google.com**

2. **Erstelle ein neues Projekt** (oder wähle bestehendes):
   - Name: "Bereifung24"
   - Klicke "Create"

3. **Aktiviere Google Calendar API**:
   - Gehe zu "APIs & Services" → "Library"
   - Suche nach "Google Calendar API"
   - Klicke "Enable"

4. **Erstelle OAuth 2.0 Credentials**:
   - Gehe zu "APIs & Services" → "Credentials"
   - Klicke "Create Credentials" → "OAuth client ID"
   
   **Falls OAuth Consent Screen noch nicht konfiguriert:**
   - Wähle "External"
   - App Name: "Bereifung24"
   - User support email: deine@email.de
   - Developer contact: deine@email.de
   - Scopes: Füge hinzu: `https://www.googleapis.com/auth/calendar`
   - Test users: Füge deine Test-E-Mail hinzu
   - Save

5. **OAuth Client ID erstellen**:
   - Application type: "Web application"
   - Name: "Bereifung24 Calendar Integration"
   
   **Authorized redirect URIs:**
   - Lokal: `http://localhost:3000/api/calendar/callback`
   - Production: `https://reifen.bereifung24.de/api/calendar/callback`
   
   - Klicke "Create"
   - **Kopiere Client ID und Client Secret**

### Schritt 2: Environment Variables hinzufügen

**Lokal (`.env`):**
```env
GOOGLE_CLIENT_ID="deine-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="dein-client-secret"
```

**Production Server:**
```bash
ssh -i ~/.ssh/bereifung24_hetzner root@167.235.24.110
cd /var/www/bereifung24
nano .env
# Füge hinzu:
GOOGLE_CLIENT_ID="deine-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="dein-client-secret"
# Speichern mit Ctrl+X, Y, Enter
pm2 restart bereifung24
```

### Schritt 3: Dependencies installieren

**Lokal:**
```bash
npm install googleapis
```

**Production (beim nächsten Deploy):**
```bash
./deploy.ps1
```

### Schritt 4: Database Migration

```bash
# Lokal
npx prisma migrate dev --name add_google_calendar_integration

# Production (beim Deploy)
npx prisma migrate deploy
```

### Schritt 5: Frontend Update für OAuth Flow

Aktualisiere die Werkstatt-Einstellungen Seite um die OAuth Buttons funktional zu machen:

```typescript
// In app/dashboard/workshop/settings/page.tsx

const handleConnectCalendar = async (type: 'workshop' | 'employee', employeeId?: string) => {
  try {
    const response = await fetch('/api/calendar/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, employeeId })
    })
    
    const data = await response.json()
    
    if (data.authUrl) {
      // Öffne Google OAuth in neuem Fenster
      window.location.href = data.authUrl
    }
  } catch (error) {
    console.error('Calendar connect error:', error)
    setMessage({ type: 'error', text: 'Fehler beim Verbinden des Kalenders' })
  }
}
```

Und Button anpassen:
```tsx
<button
  type="button"
  onClick={() => handleConnectCalendar('workshop')}
  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
>
  {/* ... */}
</button>
```

## 🎯 Wie es funktioniert:

### Kalender verbinden:
1. Werkstatt klickt "Mit Google Kalender verbinden"
2. Wird zu Google OAuth weitergeleitet
3. Werkstatt autorisiert Zugriff
4. Wird zurück zu `/api/calendar/callback` geleitet
5. Tokens werden in Datenbank gespeichert
6. ✅ Kalender ist verbunden

### Terminbuchung:
1. Kunde wählt Datum für Termin
2. System ruft `/api/calendar/available-slots` auf
3. API fragt Google Calendar nach belegten Zeiten
4. Kombiniert mit Arbeitszeiten → freie Slots
5. Kunde wählt freien Slot
6. Bei Buchung: `createCalendarEvent()` erstellt Event in Google Calendar
7. Event ID wird in `Booking.googleEventId` gespeichert

### Bei Stornierung:
1. System ruft `deleteCalendarEvent()` auf
2. Event wird in Google Calendar gelöscht
3. Slot wird wieder frei

## 📊 Ablaufdiagramm:

```
1. VERBINDEN:
   Werkstatt → "Verbinden" Button → OAuth → Google → Callback → Tokens in DB

2. VERFÜGBARKEIT PRÜFEN:
   Kunde wählt Datum → API → Google Calendar API → Busy Slots
   → + Arbeitszeiten → Freie Slots → Anzeige

3. TERMIN BUCHEN:
   Kunde bucht → createCalendarEvent() → Google Calendar
   → Event ID → DB speichern

4. TERMIN ÄNDERN/STORNIEREN:
   updateCalendarEvent() / deleteCalendarEvent() → Google Calendar
```

## 🧪 Testing:

### Test 1: Kalender verbinden
- Gehe zu Werkstatt-Einstellungen → Terminplanung
- Wähle "Werkstatt-Kalender"
- Klicke "Mit Google Kalender verbinden"
- Autorisiere in Google
- ✅ Status sollte "Verbunden" zeigen

### Test 2: Mitarbeiter hinzufügen
- Wähle "Mitarbeiter-Kalender"
- Füge Mitarbeiter hinzu (Name, E-Mail)
- Setze Arbeitszeiten (z.B. Mo-Fr 8-17 Uhr)
- Verbinde Kalender für Mitarbeiter

### Test 3: Verfügbare Slots abrufen
```bash
# API Test
curl "http://localhost:3000/api/calendar/available-slots?workshopId=<ID>&date=2025-11-21&duration=60"
```

Erwartetes Ergebnis:
```json
{
  "availableSlots": ["08:00", "09:00", "10:00", "11:00", ...]
}
```

### Test 4: Event erstellen (manuell testen)
- Erstelle Buchung über Frontend
- Prüfe in Google Calendar ob Event erscheint
- Lösche Buchung → Event sollte verschwinden

## 💰 Kosten:

**Google Calendar API:**
- **KOSTENLOS** bis 1 Million Anfragen/Tag
- Darüber: $0.40 pro 10.000 Anfragen

Für Bereifung24: **Vollständig kostenlos** ✅

## 🔐 Sicherheit:

- OAuth 2.0 Standard
- Tokens verschlüsselt in Datenbank
- Automatisches Token Refresh
- Kein Zugriff auf andere Kalender
- Nur Lese-/Schreibzugriff auf eigenen Kalender

## 🐛 Troubleshooting:

**"Token expired" Fehler:**
→ Wird automatisch gefixed durch `refreshAccessToken()`

**"Calendar not found":**
→ Prüfe ob `googleCalendarId` gesetzt ist

**"Unauthorized":**
→ Prüfe OAuth Credentials in `.env`

**Keine Slots verfügbar:**
→ Prüfe Arbeitszeiten in Datenbank
→ Prüfe ob Kalender verbunden ist

## 📚 Nächste Features (Optional):

1. **Email Benachrichtigungen:**
   - Bei neuer Buchung
   - 24h vorher Erinnerung
   - Bei Stornierung

2. **SMS Benachrichtigungen:**
   - Via Twilio

3. **Kalender Sync:**
   - Automatisches Sync alle 15 Minuten
   - Webhook von Google bei Änderungen

4. **Multi-Kalender:**
   - Mehrere Kalender pro Werkstatt
   - Kalender für verschiedene Services

5. **Puffer-Zeiten:**
   - 15 Min vor/nach jedem Termin
   - Einstellbar pro Service-Typ

## 📞 Support:

Bei Fragen oder Problemen:
- Google Calendar API Docs: https://developers.google.com/calendar/api/guides/overview
- OAuth 2.0 Guide: https://developers.google.com/identity/protocols/oauth2
