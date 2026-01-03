# OAuth Consent Screen - Ausfüll-Checkliste

## Status: Vorbereitet für Einreichung

Diese Datei enthält alle Informationen, die du im OAuth Consent Screen eingeben musst.

---

## 1. App-Informationen (App Information)

### App Name
```
Bereifung24
```

### User Support Email
```
info@bereifung24.de
```
*Alternative: zdenek156@gmail.com*

### App Logo (Optional, aber empfohlen)
- **Größe:** 120x120 Pixel
- **Format:** PNG oder JPG
- **Hintergrund:** Transparent oder weiß
- **📝 TODO:** Logo erstellen und hochladen

---

## 2. App Domain

### Application Home Page
```
https://www.bereifung24.de
```

### Application Privacy Policy Link
```
https://www.bereifung24.de/datenschutz
```
✅ **LIVE - Gerade deployed mit Google Calendar Abschnitt**

### Application Terms of Service Link
```
https://www.bereifung24.de/agb
```
✅ **LIVE**

---

## 3. Authorized Domains

### Domain (nach Verifizierung)
```
bereifung24.de
```
⏳ **TODO:** Erst nach Google Search Console Verifizierung hinzufügen

---

## 4. Developer Contact Information

### Email Address
```
zdenek156@gmail.com
```

---

## 5. Scopes (OAuth-Berechtigungen)

### Hinzuzufügender Scope
```
https://www.googleapis.com/auth/calendar
```

**Beschreibung für Google:**
```
Full access to Google Calendar

Bereifung24 ist eine Vermittlungsplattform für Reifen-Werkstätten. 
Werkstätten können ihren Google Calendar verbinden, um:

1. LESEN: Verfügbarkeit prüfen und Doppelbuchungen vermeiden
2. SCHREIBEN: Automatisch Termine erstellen bei Kundenbuchungen
3. AKTUALISIEREN: Termine ändern bei Verschiebungen
4. LÖSCHEN: Termine entfernen bei Stornierungen

Alternative Scopes wie calendar.readonly sind NICHT ausreichend, da 
wir bidirektionale Synchronisation benötigen.

Die Integration ist vollständig optional (Opt-in) und kann jederzeit 
in den Werkstatt-Einstellungen deaktiviert werden.
```

---

## 6. Scope-Begründung für Review (Detailliert)

**Google fragt: "Why does your app need this scope?"**

**Deine Antwort:**

```
APPLICATION OVERVIEW:
Bereifung24 is a B2B platform connecting tire workshops with customers 
seeking tire services (mounting, balancing, storage). Workshops receive 
booking requests and can accept or decline them.

CALENDAR INTEGRATION PURPOSE:
Workshops can optionally connect their Google Calendar to:
- Display real-time availability to customers
- Prevent double-bookings
- Automatically sync confirmed bookings

WHY FULL CALENDAR ACCESS IS REQUIRED:

1. READ ACCESS:
   - Check employee availability before showing time slots to customers
   - Prevent scheduling conflicts with existing appointments
   - Display free/busy status

2. WRITE ACCESS:
   - Create calendar events when customer confirms a booking
   - Include booking details (customer name, service type, vehicle info)
   - Set reminders for workshop staff

3. UPDATE ACCESS:
   - Modify events when customers reschedule
   - Update event details when booking information changes
   - Extend/shorten event duration based on service changes

4. DELETE ACCESS:
   - Remove events when customers cancel bookings
   - Clean up cancelled or rejected appointments

WHY calendar.readonly IS NOT SUFFICIENT:
We need bidirectional synchronization. Read-only would only allow 
checking availability but not creating/updating appointments, which 
is the core functionality.

USER CONTROL & PRIVACY:
- Opt-in only: Integration is completely optional
- Transparency: All actions shown in workshop dashboard
- Revocable: Can be disconnected anytime in settings
- No third-party sharing: Calendar data stays between workshop and Google
- Encrypted storage: OAuth tokens stored encrypted in PostgreSQL

DATA RETENTION:
- Tokens: Stored until manually disconnected
- Events: Not cached, fetched on-demand from Google
- Deletion: All data deleted when integration is deactivated

TARGET USERS:
- Small to medium tire workshops (B2B)
- 5-50 employees per workshop
- Professional use only, not consumer-facing
```

---

## 7. Video/Screenshots (Für Review)

### Screenshot-Liste (Minimum)
1. ✅ **Einstellungsseite:** Dashboard → Einstellungen → Google Calendar
2. ✅ **OAuth Consent:** Google Anmeldung mit Scope-Liste
3. ✅ **Erfolgsmeldung:** "Erfolgreich verbunden"
4. ✅ **Terminliste:** Synchronisierte Events sichtbar
5. ✅ **Deaktivierung:** "Verbindung trennen" Button

### Video (Empfohlen)
- **Länge:** 2-3 Minuten
- **Tool:** OBS Studio oder Loom
- **Sprache:** Deutsch OK (mit englischen Untertiteln)
- **Inhalt:**
  1. Login als Werkstatt
  2. Navigation: Dashboard → Einstellungen
  3. Klick auf "Mit Google verbinden"
  4. OAuth-Flow durchlaufen
  5. Erfolgreiche Verbindung zeigen
  6. Terminliste mit synchronisierten Events
  7. Deaktivierung demonstrieren
- **Upload:** YouTube (unlisted) oder Google Drive

⏳ **TODO:** Video/Screenshots erstellen

---

## 8. Publishing Status

### Vor Verifizierung
```
Status: Testing
```

### Für Verifizierung
```
Status: In Production (nach Klick auf "Publish App")
```

⏳ **TODO:** Erst auf "In Production" setzen, wenn alles fertig ist

---

## 9. Verification Submission Checklist

**Vor dem Einreichen prüfen:**

- [ ] OAuth Consent Screen vollständig ausgefüllt
- [ ] bereifung24.de in Google Search Console verifiziert
- [ ] bereifung24.de als "Authorized Domain" hinzugefügt
- [ ] Privacy Policy Link funktioniert (www.bereifung24.de/datenschutz)
- [ ] Terms of Service Link funktioniert (www.bereifung24.de/agb)
- [ ] Scope-Begründung vorbereitet (siehe oben)
- [ ] Video oder Screenshots erstellt und hochgeladen
- [ ] Developer Email verifiziert (zdenek156@gmail.com)
- [ ] App auf "In Production" gesetzt

---

## 10. Nach der Einreichung

**Timeline:**
- Erste Antwort: 3-7 Tage
- Zusätzliche Fragen: 1-2 Wochen
- **Gesamt: 4-6 Wochen**

**Mögliche Rückfragen:**
1. "Warum brauchen Sie vollen Calendar-Zugriff?"
   → Antwort: Siehe Scope-Begründung oben
   
2. "Wo speichern Sie die Daten?"
   → Antwort: PostgreSQL, verschlüsselte OAuth Tokens, keine Weitergabe
   
3. "Können Sie auf calendar.readonly beschränken?"
   → Antwort: Nein, wir müssen Termine erstellen/ändern/löschen

4. "Zeigen Sie die Deaktivierungsfunktion"
   → Antwort: Siehe Video/Screenshots

---

## Hilfreiche Links

- OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent
- Search Console: https://search.google.com/search-console
- Verification Support: https://support.google.com/cloud/contact/oauth_app_verification
- Documentation: https://support.google.com/cloud/answer/9110914

---

**Stand:** 3. Januar 2026
**Nächster Schritt:** Domain-Verifizierung in Google Search Console
