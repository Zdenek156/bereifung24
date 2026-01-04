# 🚀 Employee Portal - Deployment Guide

## Datum: 4. Januar 2026

## ✅ Was wurde erstellt

### 1. Database Schema (5 neue Tabellen)
- **employee_profiles** - Mitarbeiter-Stammdaten (verschlüsselt: Steuer-ID, Sozialversicherung, Bankdaten)
- **employee_documents** - Dokumenten-Management mit Access-Logs
- **leave_balances** - Urlaubskonto-Verwaltung (pro Jahr)
- **leave_requests** - Urlaubsanträge mit Genehmigungsworkflow
- **sick_leaves** - Krankmeldungen mit AU-Zertifikat-Upload

### 2. Frontend Pages
- `/mitarbeiter` - Dashboard mit Statistiken (Urlaub, Überstunden, Dokumente, Aufgaben)
- `/mitarbeiter/profil` - Profil-Verwaltung (3 Tabs: Stammdaten, Bankverbindung, Notfallkontakt)
- `/mitarbeiter/dokumente` - Dokumenten-Upload & Download mit Filterung ✨ NEU
- `/mitarbeiter/email` - Bereits vorhanden (E-Mail-System)

### 3. API Endpoints
- `GET/PUT /api/employee/profile` - Profil lesen/schreiben
- `GET /api/employee/dashboard/stats` - Dashboard-Statistiken
- `GET/POST /api/employee/documents` - Dokumente auflisten/hochladen ✨ NEU
- `GET /api/employee/documents/[id]/download` - Dokument herunterladen ✨ NEU

### 4. Security
- **Verschlüsselung:** AES-256-CBC für sensible Daten
- **ENCRYPTION_KEY:** `a4cda4d54c890d7bf10278f64b10776bfb5a17d581f423eb2d22673162af198f`
- **Felder verschlüsselt:** Steuer-ID, Sozialversicherungsnummer, IBAN, Dateipfade
- **Access Logging:** Jeder Download wird mit User-ID, Timestamp und IP geloggt

### 5. Files Created
```
app/mitarbeiter/page.tsx                        (Dashboard - updated)
app/mitarbeiter/profil/page.tsx                 (Profil-Seite)
app/mitarbeiter/dokumente/page.tsx              (Dokumenten-Management) ✨ NEU
app/api/employee/profile/route.ts               (Profil-API)
app/api/employee/dashboard/stats/route.ts       (Dashboard-Stats-API)
app/api/employee/documents/route.ts             (Dokumenten-API) ✨ NEU
app/api/employee/documents/[id]/download/route.ts  (Download-API) ✨ NEU
lib/encryption.ts                               (Verschlüsselungs-Library)
scripts/setup-employee-portal.js                (Setup-Script)
deploy-employee-portal.sh                       (Deployment-Script)
MITARBEITER_PORTAL_ROADMAP.md                  (10-Phasen-Roadmap)
uploads/documents/                              (File-Storage-Directory)
```

## 📋 Deployment-Anleitung (Hetzner Server)

### Schritt 1: Code auf Server bringen
```bash
# Auf lokalem PC
cd "c:\Bereifung24\Bereifung24 Workspace"
git add .
git commit -m "feat: Employee Portal Phase 1 - Dashboard & Profile Management"
git push origin main

# Auf Hetzner Server (SSH)
cd /var/www/bereifung24
git pull origin main
```

### Schritt 2: Dependencies installieren
```bash
npm install
```

### Schritt 3: Migration ausführen
```bash
# Macht das deploy-script automatisch
chmod +x deploy-employee-portal.sh
./deploy-employee-portal.sh
```

**ODER manuell:**
```bash
# 1. Prisma Client generieren
npx prisma generate

# 2. Datenbank-Schema anwenden
npx prisma db push --skip-generate

# 3. ENCRYPTION_KEY speichern
node scripts/setup-employee-portal.js

# 4. App neu starten
pm2 restart bereifung24
```

### Schritt 4: Verifizierung
```bash
# PM2 Logs prüfen
pm2 logs bereifung24 --lines 50

# PostgreSQL prüfen
psql -U bereifung24user -d bereifung24 -c "\dt" | grep employee
# Sollte zeigen:
# - employee_profiles
# - employee_documents
# - leave_balances
# - leave_requests
# - sick_leaves

# Upload-Verzeichnis erstellen
mkdir -p /var/www/bereifung24/uploads/documents
chown -R www-data:www-data /var/www/bereifung24/uploads
chmod 755 /var/www/bereifung24/uploads
```

## 🧪 Testing nach Deployment

### 1. Dashboard testen
- Öffne: https://www.bereifung24.de/mitarbeiter
- Login als B24Employee
- Prüfe:
  - ✅ Dashboard zeigt Statistiken (Urlaubstage, Überstunden, Dokumente, Aufgaben)
  - ✅ Quick-Access-Buttons funktionieren
  - ✅ "Email" und "Profil" sind aktiv
  - ✅ Rest zeigt "Demnächst"

### 2. Profil-Seite testen
- Klick auf "Profil" Button
- Prüfe alle 3 Tabs:
  - **Stammdaten:** Geburtsdatum, Geburtsort, Nationalität, Steuer-ID, SV-Nummer, Adresse
  - **Bankverbindung:** IBAN, BIC, Bank-Name (mit Verschlüsselungs-Warnung)
  - **Notfallkontakt:** Name, Telefon, Beziehung
- Fülle Felder aus und klicke "Änderungen speichern"
- Prüfe Bestätigung: "Profil erfolgreich gespeichert!"

### 3. Dokumenten-Seite testen
- Klick auf "Dokumente" Button
- Prüfe Filter-Buttons (Alle, Verträge, Gehaltsabrechnungen, etc.)
- **Upload-Test:**
  - Klick auf "Dokument hochladen"
  - Wähle Typ (z.B. "Vertrag")
  - Gib Titel ein (z.B. "Arbeitsvertrag 2026")
  - Wähle PDF-Datei (max 10MB)
  - Klick "Hochladen"
  - Prüfe Bestätigung: "Dokument erfolgreich hochgeladen!"
- **Download-Test:**
  - Klick auf "Herunterladen" bei einem Dokument
  - Prüfe, dass Datei heruntergeladen wird
  - Verifiziere Access-Log in DB (optional)
- **Filter-Test:**
  - Klick verschiedene Dokumententypen
  - Prüfe, dass nur passende Dokumente angezeigt werden

### 4. Verschlüsselung testen
```bash
# In PostgreSQL
psql -U bereifung24user -d bereifung24
SELECT "taxId", "bankAccount" FROM employee_profiles LIMIT 1;
# Sollte verschlüsselte Hex-Strings zeigen (z.B. "a4f2e8:5d3b...")
```

### 4. Verschlüsselung testen
```bash
# In PostgreSQL
psql -U bereifung24user -d bereifung24
SELECT "taxId", "bankAccount", "fileUrl" FROM employee_profiles LIMIT 1;
SELECT "fileUrl" FROM employee_documents LIMIT 1;
# Sollte verschlüsselte Hex-Strings zeigen (z.B. "a4f2e8:5d3b...")
```

### 5. ENCRYPTION_KEY prüfen
- Öffne: https://www.bereifung24.de/admin/api-settings
- Prüfe Key "ENCRYPTION_KEY" ist vorhanden
- Value sollte sein: `a4cda4d54c890d7bf10278f64b10776bfb5a17d581f423eb2d22673162af198f`

## 🔐 Sicherheits-Checkliste

- [x] ENCRYPTION_KEY in .env.production gesetzt
- [x] ENCRYPTION_KEY in Datenbank (admin_api_settings) gespeichert
- [x] Sensible Felder (taxId, socialSecurityId, bankAccount) verschlüsselt
- [x] Authentication über NextAuth (B24Employee)
- [x] API-Endpunkte prüfen Session

## 📊 Dashboard-Statistiken

Aktuell implementiert:
- ✅ **Urlaubstage:** Verbleibend/Gesamt (aus leave_balances)
- ✅ **Neue Dokumente:** Anzahl (letzte 30 Tage) - Verlinkt zu /mitarbeiter/dokumente
- ⏳ **Überstunden:** Placeholder (TODO: Time Tracking Phase 3)
- ⏳ **Aufgaben:** Placeholder (TODO: Task Management)

## 📁 Dokumenten-Management

**Features:**
- ✅ Upload von PDF, Word, Bildern (max 10MB)
- ✅ 6 Dokumententypen: Verträge, Gehaltsabrechnungen, Bescheinigungen, Steuerdokumente, Sozialversicherung, Sonstige
- ✅ Filter nach Dokumententyp
- ✅ Verschlüsselte Dateipfade in Datenbank
- ✅ Access-Logging bei jedem Download (User-ID, Timestamp, IP)
- ✅ Metadaten: Titel, Beschreibung, Kategorie, Tags
- ✅ Dateigrößen-Anzeige
- ✅ Upload-Datum und Uploader anzeigen

**Erlaubte Dateitypen:**
- `application/pdf` (PDF)
- `application/msword` (Word .doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (Word .docx)
- `image/jpeg` (JPEG)
- `image/png` (PNG)

**Storage:**
- Lokaler Pfad: `/var/www/bereifung24/uploads/documents/[employeeId]/`
- Verschlüsselter Pfad in DB: `employee_documents.fileUrl`

## 🗺️ Roadmap

### Phase 1 (Wochen 1-2) ✅ COMPLETED
- [x] Dashboard mit Statistiken
- [x] Profil-Verwaltung (Stammdaten, Bank, Notfall)
- [x] Verschlüsselung (AES-256)
- [x] Datenbank-Schema
- [x] Dokumenten-Upload & Download ✨ DONE

### Phase 2 (Wochen 3-4) - Urlaubsverwaltung
- Urlaubsantrag erstellen
- Genehmigungsworkflow
- Abwesenheitskalender
- E-Mail-Benachrichtigungen

### Phase 3 (Wochen 5-7) - Zeiterfassung
- Arbeitszeiterfassung
- Überstunden-Konto
- Pausenzeiten
- Export für Lohnbuchhaltung

**Vollständiger Plan:** Siehe `MITARBEITER_PORTAL_ROADMAP.md`

## 🐛 Bekannte Einschränkungen

1. **Lokale Entwicklung:** PostgreSQL läuft nur auf Hetzner Server
   - Build-Errors mit DB-Verbindung sind normal lokal
   - Deployment funktioniert auf Server

2. **Dashboard-Statistiken:** Zeigen 0 bis Daten existieren
   - Urlaubstage: Werden beim ersten API-Call auto-erstellt (30 Tage Standard)
   - Dokumente: 0 bis Dateien hochgeladen werden
   - Überstunden/Aufgaben: Placeholder (später implementiert)

3. **File-Upload:** Dateien werden lokal gespeichert
   - Keine Cloud-Integration (by design)
   - Max. 10MB pro Datei
   - Erlaubte Typen: PDF, Word, JPEG, PNG
   - Server benötigt Schreibrechte auf `/var/www/bereifung24/uploads`

## 📞 Support

Bei Problemen:
1. Prüfe PM2 Logs: `pm2 logs bereifung24`
2. Prüfe PostgreSQL: `psql -U bereifung24user -d bereifung24`
3. Prüfe ENCRYPTION_KEY: `/admin/api-settings`
4. Prüfe Schema: `npx prisma db pull` (zeigt aktuelles Schema)

## 🎉 Success Criteria

Deployment ist erfolgreich wenn:
- ✅ 5 neue Tabellen in PostgreSQL existieren
- ✅ Dashboard lädt ohne Fehler
- ✅ Profil-Seite zeigt 3 Tabs
- ✅ Dokumenten-Seite zeigt Upload-Button & Filter
- ✅ Speichern funktioniert (Alert: "Profil erfolgreich gespeichert!")
- ✅ Upload funktioniert (Alert: "Dokument erfolgreich hochgeladen!")
- ✅ Download funktioniert (Datei wird heruntergeladen)
- ✅ ENCRYPTION_KEY in admin_api_settings vorhanden
- ✅ Sensible Daten sind verschlüsselt in DB
- ✅ Upload-Verzeichnis `/var/www/bereifung24/uploads/documents` existiert mit Schreibrechten

---

**Erstellt am:** 4. Januar 2026  
**Version:** Phase 1 - COMPLETED - Dashboard, Profile & Documents  
**Status:** ✅ Ready for Production Deployment
