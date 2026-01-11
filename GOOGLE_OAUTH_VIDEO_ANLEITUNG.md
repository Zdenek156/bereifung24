# Google OAuth Verification - Demo-Video Anleitung

## 📋 Was Google will

Google braucht **2 separate Videos**:
1. **OAuth Consent Screen Workflow** (Anmeldeprozess)
2. **App-Funktionalität** (Warum die App Calendar-Zugriff braucht)

---

## 🎥 VIDEO 1: OAuth Consent Screen Workflow (3-5 Minuten)

### Was zeigen:

#### 1. Ausgangssituation (10 Sekunden)
- Bereifung24 Website öffnen
- Als Werkstatt einloggen (oder neues Werkstatt-Konto erstellen)

#### 2. Google Calendar Verbindung starten (20 Sekunden)
- Navigation: `Dashboard → Einstellungen → Mitarbeiter/Kalender-Einstellungen`
- Button klicken: **"Google Calendar verbinden"** oder **"Kalender verbinden"**

#### 3. ⚠️ WICHTIG: OAuth Consent Screen (60 Sekunden)
**Dies ist der kritischste Teil!**

Der Google-Dialog muss klar sichtbar sein:
- ✅ Google-Logo und "Bereifung24 möchte auf dein Google-Konto zugreifen"
- ✅ Liste der angeforderten Berechtigungen:
  - "Google Kalender-Events ansehen, bearbeiten, freigeben und dauerhaft löschen"
  - Scope: `https://www.googleapis.com/auth/calendar`
- ✅ Google-Konto auswählen
- ✅ Button "Zulassen" klicken

**Screenshot-Hinweise:**
- Nimm den ganzen Bildschirm auf
- Dialog darf nicht abgeschnitten sein
- Text muss lesbar sein
- Zeige den kompletten Klickpfad

#### 4. Erfolgreiche Verbindung (10 Sekunden)
- Redirect zurück zu Bereifung24
- Bestätigungsmeldung: "Google Calendar erfolgreich verbunden"
- Kalender-ID wird angezeigt (z.B. "primary" oder "xyz@gmail.com")

#### 5. Abmelden und erneut testen (Optional, aber empfohlen)
- Google Calendar trennen
- Noch einmal verbinden (zeigt, dass es reproduzierbar ist)

---

## 🎥 VIDEO 2: App-Funktionalität (5-10 Minuten)

### Was zeigen:

#### 1. Warum braucht Bereifung24 Calendar-Zugriff? (30 Sekunden)
**Kurze Erklärung sprechen oder einblenden:**
> "Bereifung24 ist eine Reifenwechsel-Vermittlungsplattform. Werkstätten können Termine von Kunden empfangen und automatisch in ihren Google Calendar synchronisieren."

#### 2. Terminbuchung durch Kunde (120 Sekunden)
- **Als Kunde anmelden** (oder neue Kundenanmeldung)
- Reifentyp auswählen (z.B. Sommerreifen, 205/55 R16)
- PLZ eingeben und Werkstatt finden
- Verfügbare Termine anzeigen lassen
- **Termin buchen** (Datum + Uhrzeit auswählen)
- Buchungsbestätigung erhalten

#### 3. Google Calendar Synchronisation (90 Sekunden)
**WICHTIG: Zeige beide Seiten!**

##### A) Bereifung24 Dashboard (Werkstatt-Ansicht)
- Als Werkstatt einloggen
- Navigation: `Dashboard → Termine` oder `Appointments`
- Neu gebuchten Termin in der Liste sehen
- Details anzeigen:
  - Kunde: Max Mustermann
  - Fahrzeug: VW Golf
  - Datum/Uhrzeit
  - Service: Reifenwechsel
  - **Google Calendar Event ID** (zeigen, dass es verknüpft ist)

##### B) Google Calendar direkt öffnen
- Neuen Browser-Tab öffnen: `calendar.google.com`
- **Einloggen mit dem Google-Konto der Werkstatt**
- Termin im Kalender sehen:
  - Titel: "Reifenwechsel - Max Mustermann"
  - Zeit: Gebuchte Zeit
  - Details: Fahrzeuginfo, Kundentelefon, etc.

**Split-Screen (wenn möglich):**
- Links: Bereifung24 Dashboard
- Rechts: Google Calendar
- Zeige, dass beide synchronisiert sind

#### 4. Termin-Änderungen (60 Sekunden)
**Zeige eine der folgenden Aktionen:**

##### Option A: Termin verschieben
- In Bereifung24: Termin auf anderen Tag verschieben
- Google Calendar aktualisieren (F5)
- **Zeige**: Termin wurde auch in Google Calendar verschoben

##### Option B: Termin stornieren
- In Bereifung24: Termin stornieren/löschen
- Google Calendar aktualisieren
- **Zeige**: Termin wurde aus Google Calendar gelöscht

#### 5. Mehrere Mitarbeiter (Optional, aber gut!)
- Werkstatt hat mehrere Mitarbeiter (z.B. "Monteur 1", "Monteur 2")
- Jeder Mitarbeiter hat eigenen Google Calendar verbunden
- Zeige: Termine werden je nach Mitarbeiter in den richtigen Kalender eingetragen

#### 6. Datenschutz-Hinweis (20 Sekunden)
**Kurz zeigen:**
- Navigation: `Datenschutz` Seite
- Abschnitt über Google Calendar Integration
- Text über Datenspeicherung und Löschung

---

## 🛠️ Technische Vorbereitung

### Vor dem Aufnehmen:

1. **Test-Accounts vorbereiten**
   - ✅ Test-Werkstatt Account (z.B. `test-werkstatt@bereifung24.de`)
   - ✅ Test-Kunden Account (z.B. `test-kunde@bereifung24.de`)
   - ✅ Google Account für Calendar (neu erstellen oder Test-Account)

2. **Test-Daten vorbereiten**
   - ✅ Werkstatt komplett eingerichtet (Adresse, Öffnungszeiten)
   - ✅ Verfügbare Zeitslots konfiguriert
   - ✅ Preise eingetragen

3. **Browser vorbereiten**
   - ✅ Cache leeren (für sauberes OAuth-Popup)
   - ✅ Keine störenden Browser-Extensions
   - ✅ Zoom auf 100% (gut lesbar)

4. **Google Calendar vorbereiten**
   - ✅ Google Calendar leer machen (alte Test-Termine löschen)
   - ✅ Wenn verbunden: Trennen, um OAuth-Flow von Anfang zu zeigen

### Screen Recording Tools:

**Windows:**
- ✅ **OBS Studio** (kostenlos, beste Qualität)
  - Download: https://obsproject.com/
  - Einstellung: 1920x1080, 30 FPS
- ✅ **Windows Game Bar** (Win + G)
- ✅ **ShareX** (kostenlos)

**Online:**
- ✅ **Loom** (einfach, direkt zum Link)
- ✅ **Screen Recorder** Browser-Extension

---

## 📤 Video hochladen

### YouTube Upload (empfohlen):
1. YouTube Studio öffnen
2. "Video hochladen" → Videos auswählen
3. **Sichtbarkeit: "Nicht gelistet"** (wichtig!)
4. Titel:
   - Video 1: "Bereifung24 - OAuth Consent Screen Workflow"
   - Video 2: "Bereifung24 - Google Calendar Integration Demo"
5. Beschreibung:
   ```
   Demo video for Google OAuth Verification
   Project ID: 195663420076
   App: Bereifung24 - Tire Change Booking Platform
   Scope: https://www.googleapis.com/auth/calendar
   ```

### Alternative: Google Drive
1. Videos hochladen
2. Rechtsklick → "Link freigeben"
3. **"Jeder mit dem Link"** einstellen

---

## ✉️ Email-Antwort an Google

Kopiere diese Vorlage:

```
Dear Google Third Party Data Safety Team,

Thank you for reviewing our application. We have prepared the requested demo videos:

**1. OAuth Consent Screen Workflow:**
[YOUTUBE_LINK_VIDEO_1]

This video demonstrates:
- User initiating Google Calendar connection from Bereifung24 workshop dashboard
- Complete OAuth consent screen with requested scope (calendar)
- User granting permission
- Successful redirect and token storage

**2. Application Functionality:**
[YOUTUBE_LINK_VIDEO_2]

This video demonstrates:
- How customers book tire change appointments through Bereifung24
- Automatic synchronization of bookings to workshop's Google Calendar
- Real-time updates when appointments are modified or cancelled
- Why calendar scope is required for core business functionality

**Application Context:**
Bereifung24 is a tire service booking platform connecting customers with tire workshops.
Workshops need calendar access to:
- Automatically receive customer appointments in their Google Calendar
- Manage availability and prevent double-bookings
- Update/delete events when appointments change

**Scopes Requested:**
- https://www.googleapis.com/auth/calendar (to create, read, update, delete calendar events)

**Data Usage:**
- Calendar data is only used for appointment management
- No data is shared with third parties
- Data is stored securely and can be deleted by user at any time

We are committed to data privacy and security. Please let us know if you need any additional information.

Best regards,
[DEIN NAME]
Bereifung24 Team
```

---

## ✅ Checkliste vor dem Absenden

- [ ] Video 1: OAuth Consent Screen ist klar sichtbar (nicht abgeschnitten)
- [ ] Video 1: Scope "calendar" wird angezeigt
- [ ] Video 1: "Zulassen" Button wird geklickt
- [ ] Video 2: Kundenbuchung wird gezeigt
- [ ] Video 2: Bereifung24 Dashboard zeigt Termin
- [ ] Video 2: Google Calendar (calendar.google.com) zeigt selben Termin
- [ ] Video 2: Synchronisation ist deutlich erkennbar
- [ ] Videos auf YouTube als "Nicht gelistet" hochgeladen
- [ ] Links funktionieren (in Inkognito-Modus testen)
- [ ] Email-Antwort vorbereitet (NICHT als neue Email, sondern als REPLY!)

---

## ⏱️ Zeitplan

- **Video-Vorbereitung:** 30 Minuten
- **Video 1 aufnehmen:** 10 Minuten (mehrere Takes möglich)
- **Video 2 aufnehmen:** 20 Minuten
- **Upload + Email schreiben:** 15 Minuten
- **Gesamt:** ~75 Minuten

---

## 🚨 Häufige Fehler vermeiden

❌ **NICHT:**
- Consent Screen überspringen oder zu schnell durchklicken
- Videos mit schlechter Auflösung (mindestens 720p)
- Zu leise sprechen oder gar nicht erklären
- Persönliche Daten zeigen (echte Kundendaten verwenden)
- Als neue Email senden (muss REPLY auf Google-Email sein!)

✅ **STATTDESSEN:**
- Consent Screen 5-10 Sekunden zeigen
- 1080p Auflösung
- Kurze Erklärungen einsprechen oder Text einblenden
- Test-Accounts verwenden
- Direkt auf Google-Email antworten

---

## 🎯 Nächste Schritte

1. **JETZT:** Test-Accounts vorbereiten
2. **HEUTE:** Videos aufnehmen
3. **HEUTE:** Videos hochladen
4. **HEUTE:** Email als REPLY senden
5. **IN 3-5 TAGEN:** Google-Antwort erwarten

Viel Erfolg! 🚀
