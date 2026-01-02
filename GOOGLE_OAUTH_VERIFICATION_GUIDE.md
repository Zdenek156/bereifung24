# Google OAuth Verifizierung - Schritt-für-Schritt Anleitung

## Übersicht
Diese Anleitung führt dich durch den kompletten Prozess der Google OAuth App Verifizierung für Bereifung24.

**Zeitaufwand:** 2-3 Stunden Vorbereitung + 4-6 Wochen Review  
**Kosten:** Kostenlos

---

## Schritt 1: OAuth Consent Screen vervollständigen

### 1.1 Gehe zur Google Cloud Console
1. Öffne: https://console.cloud.google.com/apis/credentials/consent
2. Wähle dein Projekt aus (Bereifung24)

### 1.2 Pflichtfelder ausfüllen

**App-Informationen:**
- ✅ **App-Name:** Bereifung24
- ✅ **User Support Email:** zdenek156@gmail.com (oder support@bereifung24.de)
- ✅ **App-Logo:** 
  - Größe: 120x120 px
  - Format: PNG oder JPG
  - Erstelle ein sauberes Logo-Icon

**App-Domain:**
- ✅ **Application Home Page:** https://www.bereifung24.de
- ✅ **Application Privacy Policy:** https://www.bereifung24.de/datenschutz
- ✅ **Application Terms of Service:** https://www.bereifung24.de/agb

**Autorisierte Domains:**
- ✅ `bereifung24.de`

**Developer Contact:**
- ✅ **Email:** zdenek156@gmail.com

### 1.3 Scopes hinzufügen
- ✅ `.../auth/calendar` - Full calendar access

---

## Schritt 2: Datenschutzerklärung erweitern

Füge einen Abschnitt über Google Calendar hinzu:

```markdown
## Google Calendar Integration

Bereifung24 nutzt Google Calendar, um Werkstatt-Termine mit dem persönlichen 
Kalender des Werkstatt-Mitarbeiters zu synchronisieren.

**Verwendete Daten:**
- Kalendername und ID
- Termine (Datum, Uhrzeit, Beschreibung)
- Verfügbarkeit

**Speicherung:**
- Access Token und Refresh Token werden verschlüsselt in unserer Datenbank gespeichert
- Keine Weitergabe an Dritte
- Löschung bei Deaktivierung der Integration

**Berechtigung:**
- Voller Calendar-Zugriff (Lesen & Schreiben)
- Notwendig für Termin-Synchronisation in beide Richtungen

**Widerruf:**
- Jederzeit in den Werkstatt-Einstellungen
- Alternativ: https://myaccount.google.com/permissions
```

**👉 Action:** Füge diesen Abschnitt zu `/app/datenschutz/page.tsx` hinzu

---

## Schritt 3: Video/Screenshots erstellen

Google möchte **visuell sehen**, wie deine App Calendar nutzt.

### Option A: Screen Recording (empfohlen)
1. **Tool:** OBS Studio (kostenlos) oder Loom
2. **Länge:** 2-3 Minuten
3. **Inhalt:**
   - Login als Werkstatt
   - Navigation zu Einstellungen → Google Calendar
   - Klick auf "Mit Google verbinden"
   - OAuth-Flow durchlaufen
   - Zeigen, dass Termine synchronisiert werden
   - Deaktivierung zeigen
4. **Upload:** YouTube (unlisted) oder Google Drive
5. **Sprache:** Deutsch OK, aber englische Untertitel empfohlen

### Option B: Screenshots (Minimum)
Erstelle Screenshots von:
1. ✅ Einstellungsseite mit Calendar-Button
2. ✅ OAuth Consent Screen
3. ✅ Erfolgsmeldung nach Verbindung
4. ✅ Terminliste mit synchronisierten Events
5. ✅ Deaktivierungs-Button

---

## Schritt 4: Scope-Begründung schreiben

Google fragt: **"Warum braucht deine App vollen Calendar-Zugriff?"**

**Antwort-Vorlage:**

```
Scope: https://www.googleapis.com/auth/calendar

Bereifung24 ist eine Plattform für Reifen-Werkstätten. Werkstätten erhalten 
Buchungsanfragen von Kunden für Reifenmontage und andere Services.

Die Calendar-Integration ermöglicht:

1. LESEN:
   - Prüfung der Verfügbarkeit des Werkstatt-Mitarbeiters
   - Vermeidung von Doppelbuchungen
   - Anzeige freier Zeitslots für Kunden

2. SCHREIBEN:
   - Automatisches Erstellen von Terminen bei Buchungsbestätigung
   - Synchronisation von Terminen (Änderungen, Stornierungen)
   - Update bei Verschiebungen

3. LÖSCHEN:
   - Entfernung bei Stornierung
   - Korrektur bei Fehlbuchungen

Die Werkstatt hat volle Kontrolle:
- Opt-in: Integration ist optional
- Transparenz: Jede Aktion wird in der UI angezeigt
- Widerruf: Jederzeit in den Einstellungen möglich

Alternative Scopes wie calendar.readonly sind NICHT ausreichend, da 
Schreibzugriff für die Termin-Synchronisation essentiell ist.
```

---

## Schritt 5: Domain-Verifizierung

### 5.1 Domain bei Google Search Console verifizieren
1. Gehe zu: https://search.google.com/search-console
2. Füge `bereifung24.de` hinzu
3. Wähle Verifizierungsmethode: **DNS-Eintrag** (empfohlen)
4. Kopiere TXT-Record
5. Füge bei deinem DNS-Provider (Hetzner?) hinzu
6. Warte 10-60 Minuten
7. Klicke "Verifizieren"

### 5.2 Domain in OAuth Consent Screen hinzufügen
1. Zurück zu: https://console.cloud.google.com/apis/credentials/consent
2. Unter "Authorized domains": `bereifung24.de` hinzufügen

---

## Schritt 6: Verifizierungsantrag einreichen

### 6.1 Status ändern
1. OAuth Consent Screen: Status von "Testing" auf **"In Production"** setzen
2. Klicke "Publish App"

### 6.2 Verifizierung beantragen
1. Es erscheint: "Your app needs verification"
2. Klicke "Submit for Verification"
3. Fülle Formular aus:
   - **App Type:** Web Application
   - **App Homepage:** https://www.bereifung24.de
   - **Privacy Policy:** https://www.bereifung24.de/datenschutz
   - **YouTube Video:** [Dein Video-Link]
   - **Scope Justification:** [Text aus Schritt 4]

### 6.3 Zusatzfragen beantworten
Google fragt typischerweise:
- ❓ "Wie nutzt deine App Calendar-Daten?"
  - → Siehe Scope-Begründung
- ❓ "Warum kann calendar.readonly nicht ausreichen?"
  - → Wir müssen Termine erstellen/ändern/löschen
- ❓ "Wo werden die Daten gespeichert?"
  - → PostgreSQL-Datenbank, verschlüsselte Tokens
- ❓ "Wer hat Zugriff?"
  - → Nur der Werkstatt-Inhaber, der die Integration aktiviert hat

---

## Schritt 7: Review abwarten

**Timeline:**
- ✅ Einreichung: Sofort
- ⏳ Erste Antwort: 3-7 Tage
- ⏳ Zusätzliche Fragen: 1-2 Wochen
- ✅ **Gesamt: 4-6 Wochen**

**Während des Reviews:**
- App funktioniert weiterhin (mit Warnung)
- Google kann Rückfragen stellen (per E-Mail)
- Statusänderungen in Cloud Console sichtbar

---

## Schritt 8: Nach der Genehmigung

✅ **Die Warnung verschwindet automatisch**

Kein Code-Change nötig, keine Neudeployments!

---

## Häufige Ablehnungsgründe (und wie du sie vermeidest)

❌ **"Privacy Policy unvollständig"**
→ Lösung: Abschnitt über Calendar hinzufügen (Schritt 2)

❌ **"Scope zu weitreichend"**
→ Lösung: Klar begründen, warum readonly NICHT ausreicht

❌ **"Video zeigt nicht alle Funktionen"**
→ Lösung: Zeige kompletten Flow: Aktivieren → Nutzen → Deaktivieren

❌ **"Domain nicht verifiziert"**
→ Lösung: Search Console Verifizierung abschließen

---

## Checkliste vor Einreichung

- [ ] OAuth Consent Screen vollständig ausgefüllt
- [ ] Datenschutzerklärung um Calendar-Abschnitt erweitert
- [ ] bereifung24.de in Search Console verifiziert
- [ ] Video/Screenshots erstellt und hochgeladen
- [ ] Scope-Begründung vorbereitet
- [ ] App-Logo (120x120) hochgeladen
- [ ] Developer Contact Email verifiziert

---

## Support

**Bei Fragen während des Reviews:**
- Google OAuth Support: https://support.google.com/cloud/contact/oauth_app_verification
- Dokumentation: https://support.google.com/cloud/answer/9110914

**Statuscheck:**
- Cloud Console: https://console.cloud.google.com/apis/credentials/consent

---

## Nächste Schritte

1. ✅ Lies diese Anleitung komplett durch
2. ⏳ Ergänze Datenschutzerklärung (Schritt 2)
3. ⏳ Erstelle Video/Screenshots (Schritt 3)
4. ⏳ Verifiziere Domain (Schritt 5)
5. ⏳ Reiche Verifizierung ein (Schritt 6)

**Zeitplan:**
- Heute: Schritte 2-5 (2-3 Stunden)
- Morgen: Schritt 6 (Einreichung)
- In 4-6 Wochen: ✅ Genehmigung

---

**Viel Erfolg! 🚀**
