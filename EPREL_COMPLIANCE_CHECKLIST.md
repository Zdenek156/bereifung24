# EPREL API Datenschutz-Compliance Checkliste

## 📋 Übersicht
Diese Checkliste prüft die Einhaltung der EPREL API Privacy Statement Anforderungen für die Bereifung24 Integration.

**Stand:** 28. Dezember 2025  
**Status:** ⏳ Wartend auf API-Key - Vorbereitung läuft

---

## ✅ Pflicht-Anforderungen (MUSS)

### 1. API-Schlüssel Sicherheit
- [ ] **API-Key in Umgebungsvariablen:** Niemals im Code hardcoded
  - Speicherort: `.env.local` (lokal) und Hetzner Server Environment
  - Variable: `EPREL_API_KEY`
  - ❌ **TODO:** Nach Erhalt des Keys in `.env` speichern
  
- [ ] **Sichere Serverseitige Calls:** Alle EPREL API Calls nur vom Backend
  - ✅ **GEPLANT:** Route `/api/tire-finder/*` nur serverseitig
  - ✅ **GEPLANT:** Kein direkter Browser-Zugriff auf EPREL API
  
- [ ] **Rate Limiting implementieren:**
  - ❌ **TODO:** Rate Limiter für EPREL API Calls
  - ❌ **TODO:** Max. Requests/Minute konfigurieren (nach API-Dokumentation)

### 2. Datenminimierung
- [ ] **Nur notwendige Daten abrufen:**
  - ✅ **GEPLANT:** Nur Reifendaten abfragen, keine personenbezogenen Daten
  - ✅ **GEPLANT:** Abfrage: Dimension, Label-Werte, Hersteller, Modell
  - ✅ Keine Speicherung von Nutzerdaten bei EPREL

- [ ] **Keine personenbezogenen Daten an EPREL senden:**
  - ✅ **GEPLANT:** Nur technische Reifensuche-Parameter
  - ✅ Keine User-IDs, E-Mails, Namen, Adressen
  - ✅ Keine IP-Adressen in API-Requests

### 3. Datenspeicherung & Caching
- [ ] **Caching-Strategie definieren:**
  - ❌ **TODO:** Redis oder In-Memory Cache für EPREL-Daten
  - ❌ **TODO:** Cache-Dauer: Max. 24 Stunden (nach API-Richtlinien)
  - ❌ **TODO:** Automatisches Löschen veralteter Daten
  
- [ ] **Keine dauerhafte Speicherung ohne Berechtigung:**
  - ✅ **GEPLANT:** Nur temporäres Caching, keine permanente DB-Speicherung
  - ✅ **GEPLANT:** Kein Export von EPREL-Rohdaten

### 4. Transparenz gegenüber Nutzern
- [ ] **Datenschutzerklärung aktualisieren:**
  - ❌ **TODO:** Abschnitt "EPREL API Nutzung" hinzufügen
  - Pfad: `app/datenschutz/page.tsx`
  - Inhalt:
    - Welche Daten werden über EPREL abgerufen
    - Zweck: Reifensuche und EU-Label-Informationen
    - Keine Weitergabe personenbezogener Daten an EU-Kommission
    - Hinweis auf offizielle EPREL Privacy Policy

- [ ] **Nutzer-Information im Widget:**
  - ❌ **TODO:** Info-Icon mit Hinweis "Daten von EU EPREL Datenbank"
  - ❌ **TODO:** Link zu EPREL Privacy Statement

### 5. Rechtsgrundlage dokumentieren
- [ ] **Dokumentation der API-Nutzung:**
  - ❌ **TODO:** Internes Dokument erstellen
  - Inhalt:
    - Zweck: Produktinformationen für Verbraucher
    - Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
    - Keine Verarbeitung personenbezogener Daten über EPREL

---

## ⚠️ Technische Sicherheitsmaßnahmen

### 6. API-Error Handling
- [ ] **Fehlerbehandlung ohne Datenlecks:**
  - ❌ **TODO:** Keine sensitiven Daten in Error-Logs
  - ❌ **TODO:** Generische Fehlermeldungen für User
  - ❌ **TODO:** Detaillierte Logs nur serverseitig

### 7. HTTPS & Verschlüsselung
- [x] **Alle API-Calls über HTTPS:**
  - ✅ EPREL API verwendet HTTPS
  - ✅ Bereifung24 läuft auf HTTPS (bereifung24.de)

### 8. Zugriffskontrolle
- [ ] **Nur autorisierte Zugriffe:**
  - ✅ **GEPLANT:** Nur eingeloggte Kunden können Tire Finder nutzen
  - ❌ **TODO:** Middleware-Check in `/api/tire-finder/*` Routes
  - ❌ **TODO:** Rate Limiting pro User

---

## 📄 Dokumentations-Anforderungen

### 9. Code-Dokumentation
- [ ] **Kommentare zu EPREL API Calls:**
  ```typescript
  /**
   * EPREL API Integration
   * Privacy Compliance:
   * - No personal data sent to EPREL
   * - Only tire technical specifications queried
   * - Results cached for 24h (EPREL guidelines)
   * - API Key stored in environment variables
   */
  ```

### 10. Verarbeitungsverzeichnis (DSGVO Art. 30)
- [ ] **EPREL als Verarbeitungstätigkeit dokumentieren:**
  - ❌ **TODO:** Eintrag erstellen
  - Inhalt:
    - Name: "EPREL Reifendatenbank-Abfrage"
    - Zweck: Bereitstellung von EU-Label-Informationen
    - Kategorien von Daten: Technische Reifendaten (keine personenbezogenen Daten)
    - Empfänger: Keine (nur interne Nutzung)
    - Drittlandtransfer: Nein (EU-Server)
    - Löschfristen: 24 Stunden (Cache)

---

## 🔍 Implementierungs-Checkliste

### Phase 1: Vorbereitung (Vor API-Key Erhalt)
- [x] EPREL API Key beantragt
- [ ] Datenschutzerklärung-Entwurf vorbereiten
- [ ] Technische Architektur planen (Caching, Rate Limiting)
- [ ] Prisma Schema vorbereiten (optional für Caching)

### Phase 2: Nach API-Key Erhalt
- [ ] API-Key sicher in Environment speichern
- [ ] Test-Zugriff validieren
- [ ] Rate Limits der API dokumentieren
- [ ] Erste Test-Calls durchführen

### Phase 3: Entwicklung
- [ ] API Routes implementieren (`/api/tire-finder/*`)
- [ ] Caching-System einrichten
- [ ] Error Handling implementieren
- [ ] Frontend Widget entwickeln

### Phase 4: Compliance-Prüfung
- [ ] Datenschutzerklärung aktualisieren und deployen
- [ ] Alle Checklisten-Punkte abhaken
- [ ] Interne Dokumentation vervollständigen
- [ ] Testlauf mit Compliance-Review

### Phase 5: Go-Live
- [ ] Final Compliance Check
- [ ] Deployment auf Production
- [ ] Monitoring aktivieren
- [ ] User-Feedback sammeln

---

## ⚖️ Rechtliche Absicherung

### Wichtige Punkte zur EPREL API Nutzung:

1. **EPREL ist eine öffentliche EU-Datenbank:**
   - Keine personenbezogenen Daten enthalten
   - Nur Produktinformationen (Reifen-Labels)
   - Öffentlich zugänglich unter https://eprel.ec.europa.eu

2. **Bereifung24 als Intermediär:**
   - Wir rufen nur Produktdaten ab
   - Keine Weitergabe von Kundendaten an EPREL
   - Kein Tracking durch EU-Kommission

3. **Rechtsgrundlage:**
   - Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)
   - Zweck: Bereitstellung aktueller EU-Label-Informationen für Verbraucher
   - Keine Einwilligung erforderlich (keine personenbezogenen Daten verarbeitet)

---

## 📞 Kontakt bei Fragen

**EPREL Support:**
- E-Mail: ENER-LABEL-CONTACT@ec.europa.eu
- Website: https://eprel.ec.europa.eu

**Bereifung24 Datenschutzbeauftragter:**
- Siehe Datenschutzerklärung auf bereifung24.de/datenschutz

---

## 🔄 Review-Zyklus

- **Erste Prüfung:** Bei API-Key Erhalt
- **Zweite Prüfung:** Nach Implementierung, vor Go-Live
- **Regelmäßige Prüfung:** Alle 6 Monate oder bei API-Änderungen
- **Verantwortlich:** Technischer Leiter + Datenschutzbeauftragter

---

## ✅ Zusammenfassung

**Aktueller Status:**
- ⏳ API-Key wird erwartet
- ✅ Keine personenbezogenen Daten geplant
- ✅ Architektur datenschutzkonform konzipiert
- ❌ Technische Umsetzung steht aus

**Nächste Schritte:**
1. API-Key Erhalt abwarten (5-7 Werktage)
2. Datenschutzerklärung vorbereiten
3. Technische Implementation mit Compliance-Focus
4. Go-Live nach vollständiger Checklisten-Prüfung

**Risikobewertung:** ✅ NIEDRIG
- EPREL enthält keine personenbezogenen Daten
- Reine Produktdatenbank-Abfrage
- Standard DSGVO-konforme Architektur
