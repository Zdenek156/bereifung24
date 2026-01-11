# 🚀 Google OAuth Verification - Schnellanleitung

## ✅ Was du JETZT machen musst:

### SCHRITT 1: Test-Accounts vorbereiten (5 Minuten)

#### Option A: Bestehende Accounts nutzen
```
Werkstatt: Bereits registrierte Werkstatt in Produktion nutzen
Kunde: Neuen Kunden registrieren auf bereifung24.de
Google: Privates Google-Konto oder neues erstellen
```

#### Option B: Neue Test-Accounts erstellen
```
1. Werkstatt registrieren:
   - https://bereifung24.de/register/workshop
   - Email: test-werkstatt-2026@bereifung24.de
   - Firmenname: "Test-Werkstatt München"
   - Adresse: Musterstraße 123, 80331 München

2. Kunde registrieren:
   - https://bereifung24.de/register/customer
   - Email: test-kunde-2026@bereifung24.de

3. Google-Konto:
   - Neues Gmail erstellen oder bestehendes nutzen
```

---

### SCHRITT 2: Google Calendar vorbereiten (2 Minuten)

1. Bei Google einloggen: https://calendar.google.com
2. Alle Test-Termine löschen (falls vorhanden)
3. Wenn Bereifung24 bereits verbunden ist:
   - Werkstatt-Dashboard → Einstellungen
   - "Google Calendar trennen" klicken

---

### SCHRITT 3: Screen Recording Tool installieren (3 Minuten)

**Empfohlen: OBS Studio (kostenlos)**
```
1. Download: https://obsproject.com/
2. Installieren
3. Einstellungen:
   - Video: 1920x1080, 30 FPS
   - Output: MP4 Format
   - Audio: Desktop-Audio aktivieren (für deine Erklärungen)
```

**Alternative: Loom (schneller)**
```
1. Gehe zu: https://www.loom.com/
2. Registrieren (kostenlos)
3. Chrome Extension installieren
4. Klick auf Loom Icon → "Start Recording"
```

---

### SCHRITT 4: VIDEO 1 aufnehmen - OAuth Flow (5 Minuten)

**Was zeigen:**

```
1. [10 Sek] Bereifung24 öffnen, als Werkstatt einloggen
   URL: https://bereifung24.de/login

2. [15 Sek] Navigation zu Einstellungen
   Dashboard → Einstellungen → (suche nach Kalender-Einstellungen)

3. [60 Sek] ⚠️ WICHTIGSTER TEIL: Google Calendar verbinden
   - Button "Google Calendar verbinden" klicken
   - Google OAuth Popup erscheint
   - LANGSAM durchgehen:
     * "Bereifung24 möchte auf dein Google-Konto zugreifen"
     * Scope: "Google Kalender-Events ansehen, bearbeiten..."
     * Konto auswählen
     * Button "Zulassen" klicken
   
4. [10 Sek] Erfolg: Zurück zu Bereifung24
   - Meldung: "Google Calendar erfolgreich verbunden"
   - Kalender-ID wird angezeigt
```

**Sprech-Text (optional):**
> "Hi, I'm showing the OAuth consent screen for Bereifung24. Users can connect their Google Calendar from the workshop settings. Here you can see the consent screen requesting calendar access. The user grants permission and is redirected back to Bereifung24."

---

### SCHRITT 5: VIDEO 2 aufnehmen - App-Funktionalität (8 Minuten)

**Was zeigen:**

```
1. [30 Sek] Erklärung (einsprechen oder einblenden):
   "Bereifung24 connects customers with tire workshops.
    Workshops receive appointments directly in their Google Calendar."

2. [120 Sek] Kundenbuchung:
   - In neuem Browser-Fenster (oder Inkognito) als KUNDE einloggen
   - Service auswählen: z.B. "Reifenwechsel"
   - PLZ eingeben (z.B. 80331 München)
   - Werkstatt auswählen
   - Verfügbaren Termin wählen (z.B. morgen 14:00)
   - Buchung abschließen

3. [60 Sek] Bereifung24 Dashboard (Werkstatt):
   - Als Werkstatt einloggen
   - Dashboard → Termine / Appointments
   - Neuer Termin wird angezeigt:
     * Kunde: Max Mustermann
     * Service: Reifenwechsel
     * Datum/Zeit
   - ⚠️ WICHTIG: Zeige "Google Calendar Event ID" (beweist Synchronisation)

4. [60 Sek] Google Calendar öffnen:
   - Neuer Browser-Tab: https://calendar.google.com
   - Mit Werkstatt-Google-Konto einloggen
   - Termin ist im Kalender:
     * Titel: "Reifenwechsel - Max Mustermann"
     * Zeit: 14:00
     * Details: Fahrzeuginfo, Kundentelefon

5. [Optional - 30 Sek] Termin ändern:
   - In Bereifung24: Termin verschieben oder stornieren
   - Google Calendar aktualisieren (F5)
   - Zeigen: Änderung wurde synchronisiert
```

**Sprech-Text:**
> "Now I'll show how the calendar integration works. A customer books a tire change appointment. The workshop receives this in their Bereifung24 dashboard AND in their Google Calendar. This synchronization happens automatically."

---

### SCHRITT 6: Videos hochladen zu YouTube (10 Minuten)

```
1. Gehe zu: https://studio.youtube.com/

2. "Video erstellen" → "Video hochladen"

3. Video 1 hochladen:
   - Titel: "Bereifung24 OAuth Consent Screen Workflow"
   - Beschreibung:
     "Demo video for Google OAuth Verification
      Project ID: 195663420076
      Scope: https://www.googleapis.com/auth/calendar"
   - Sichtbarkeit: ⚠️ "NICHT GELISTET" (wichtig!)

4. Video 2 hochladen:
   - Titel: "Bereifung24 Google Calendar Integration Demo"
   - Beschreibung: (gleiche wie oben)
   - Sichtbarkeit: "NICHT GELISTET"

5. Links kopieren:
   - Video 1: https://youtu.be/XXXXXXXXXXXX
   - Video 2: https://youtu.be/XXXXXXXXXXXX
```

---

### SCHRITT 7: Email senden (3 Minuten)

```
1. Öffne die Original-Email von Google (die du erhalten hast)

2. Klicke "REPLY" (⚠️ NICHT neue Email schreiben!)

3. Kopiere Text aus Datei: GOOGLE_OAUTH_EMAIL_READY.txt

4. Füge die YouTube-Links ein:
   - [FÜGE HIER DEN YOUTUBE-LINK VON VIDEO 1 EIN] → Ersetzen
   - [FÜGE HIER DEN YOUTUBE-LINK VON VIDEO 2 EIN] → Ersetzen

5. Senden!
```

---

## ⏱️ Gesamt-Zeitaufwand: ~40 Minuten

- Test-Accounts: 5 Min
- Video 1 aufnehmen: 5 Min
- Video 2 aufnehmen: 10 Min
- Upload: 10 Min
- Email: 3 Min
- Puffer: 7 Min

---

## 🎯 Checkliste

Vor dem Aufnehmen:
- [ ] Test-Werkstatt Account bereit
- [ ] Test-Kunden Account bereit
- [ ] Google Calendar leer/getrennt
- [ ] Screen Recording Tool installiert
- [ ] Browser-Cache geleert
- [ ] Zoom auf 100%

Nach dem Aufnehmen:
- [ ] Video 1: OAuth Consent Screen deutlich sichtbar
- [ ] Video 1: "Zulassen" Button geklickt
- [ ] Video 2: Kundenbuchung gezeigt
- [ ] Video 2: Bereifung24 Dashboard + Google Calendar parallel gezeigt
- [ ] Videos als "Nicht gelistet" hochgeladen
- [ ] Links in Email eingefügt
- [ ] Email als REPLY gesendet (nicht als neue Email!)

---

## 🆘 Falls Probleme:

**OAuth Popup erscheint nicht:**
```
- Browser-Cache löschen
- Inkognito-Modus versuchen
- Google-Konto abmelden und neu anmelden
```

**Google Calendar zeigt Termin nicht:**
```
- Bereifung24 Dashboard: Prüfe ob "Google Calendar Event ID" vorhanden
- Google Calendar: F5 drücken (Seite neu laden)
- Warte 30 Sekunden (manchmal verzögert)
```

**Video-Qualität schlecht:**
```
- OBS: Einstellung auf 1920x1080 setzen
- Loom: Auf "HD" umstellen (in Settings)
```

---

## 📧 Fertige Email

Die fertige Email ist in: **GOOGLE_OAUTH_EMAIL_READY.txt**

Kopiere sie komplett und füge nur die YouTube-Links ein!

---

Viel Erfolg! 🚀
