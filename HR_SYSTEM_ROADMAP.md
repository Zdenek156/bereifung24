# 🏢 HR-MANAGEMENT SYSTEM - Deutsche Vorschriften

**Projekt:** Vollständiges HR-System für Bereifung24  
**Start:** 11.01.2026  
**Compliance:** Deutsche Arbeitsrecht & Lohnsteuerrecht 2026  
**Status:** In Planung

---

## 📊 DEUTSCHE ARBEITSZEITMODELLE

### 1. VOLLZEIT

#### 1.1 Klassische Vollzeit (40h/Woche)
```yaml
Bezeichnung: "Vollzeit 40h"
Wochenstunden: 40
Monatsstunden: 173,33 (40h × 52 Wochen ÷ 12 Monate)
Arbeitstage: Montag - Freitag (5 Tage/Woche)
Tägliche Arbeitszeit: 8h
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
```

#### 1.2 Reduzierte Vollzeit (37,5h/Woche)
```yaml
Bezeichnung: "Vollzeit 37,5h"
Wochenstunden: 37,5
Monatsstunden: 162,5 (37,5h × 52 ÷ 12)
Arbeitstage: Montag - Freitag
Tägliche Arbeitszeit: 7,5h
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
Anmerkung: "Häufig im öffentlichen Dienst"
```

#### 1.3 Verkürzte Vollzeit (35h/Woche)
```yaml
Bezeichnung: "Vollzeit 35h"
Wochenstunden: 35
Monatsstunden: 151,67 (35h × 52 ÷ 12)
Arbeitstage: Montag - Freitag
Tägliche Arbeitszeit: 7h
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
Anmerkung: "IG Metall Tarifvertrag"
```

---

### 2. TEILZEIT

#### 2.1 Teilzeit 30h/Woche (75%)
```yaml
Bezeichnung: "Teilzeit 30h (75%)"
Wochenstunden: 30
Monatsstunden: 130 (30h × 52 ÷ 12)
Arbeitstage: 5 Tage à 6h ODER 4 Tage à 7,5h
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
Gehalt: 75% der Vollzeitstelle
```

#### 2.2 Teilzeit 25h/Woche (62,5%)
```yaml
Bezeichnung: "Teilzeit 25h (62,5%)"
Wochenstunden: 25
Monatsstunden: 108,33
Arbeitstage: 5 Tage à 5h ODER 3-4 Tage verteilt
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
Gehalt: 62,5% der Vollzeitstelle
```

#### 2.3 Teilzeit 20h/Woche (50%)
```yaml
Bezeichnung: "Teilzeit 20h (50%)"
Wochenstunden: 20
Monatsstunden: 86,67
Arbeitstage: 5 Tage à 4h ODER 3 Tage à 6,67h
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
Gehalt: 50% der Vollzeitstelle
```

#### 2.4 Teilzeit 15h/Woche (37,5%)
```yaml
Bezeichnung: "Teilzeit 15h (37,5%)"
Wochenstunden: 15
Monatsstunden: 65
Arbeitstage: 3 Tage à 5h ODER flexibel verteilt
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
Gehalt: 37,5% der Vollzeitstelle
```

---

### 3. MINIJOB (Geringfügige Beschäftigung)

#### 3.1 Minijob 603€-Basis (Stand 2026)
```yaml
Bezeichnung: "Minijob 603€"
Monatliches Entgelt: Max. 603€ (ab 01.01.2026, vorher 520€)
Wochenstunden: Variabel (abhängig vom Stundenlohn)
Beispiel bei 12€/h: Ca. 50,25h/Monat = ca. 11,6h/Woche
Beispiel bei 13€/h: Ca. 46,38h/Monat = ca. 10,7h/Woche
Urlaubsanspruch: 24-30 Tage/Jahr (anteilig)
Sozialversicherung:
  - Arbeitnehmer: STEUERFREI
  - Rentenversicherungspflicht: Ja (kann sich befreien lassen)
  - Krankenversicherung: Nein
  - Arbeitslosenversicherung: Nein
Arbeitgeber-Abgaben:
  - Pauschale Steuer: 2%
  - Rentenversicherung: 15%
  - Krankenversicherung: 13%
  - Umlagen: Ca. 2%
  - Gesamt: Ca. 32% Arbeitgeberanteil
Anmerkung: "Für Studenten, Rentner, Nebenjobs"
```

#### 3.2 Kurzfristige Beschäftigung
```yaml
Bezeichnung: "Kurzfristige Beschäftigung"
Dauer: Max. 3 Monate ODER 70 Arbeitstage pro Jahr
Entgelt: Unbegrenzt (aber zeitlich begrenzt)
Sozialversicherung: Komplett befreit
Steuer: Nach Lohnsteuerklasse oder pauschal
Anmerkung: "Saisonarbeit, Aushilfen"
```

---

### 4. GLEITZEIT & VERTRAUENSARBEITSZEIT

#### 4.1 Gleitzeit mit Kernarbeitszeit
```yaml
Bezeichnung: "Gleitzeit 40h"
Sollarbeitszeit: 40h/Woche
Kernarbeitszeit: z.B. 10:00 - 15:00 Uhr (Anwesenheitspflicht)
Gleitrahmen: z.B. 07:00 - 20:00 Uhr
Zeitkonto: Überstunden-Erfassung
Urlaubsanspruch: 30 Tage/Jahr
Sozialversicherungspflichtig: Ja
```

#### 4.2 Vertrauensarbeitszeit (ohne Zeiterfassung)
```yaml
Bezeichnung: "Vertrauensarbeitszeit"
Sollarbeitszeit: 40h/Woche (wird nicht erfasst)
Arbeitszeiten: Völlig flexibel
Überstunden: Werden nicht vergütet (außer Vereinbarung)
Zielgruppe: Führungskräfte, leitende Angestellte
Anmerkung: "Seit EuGH-Urteil 2019 eigentlich verboten - Zeiterfassung Pflicht!"
Status: "In Deutschland teilweise noch üblich, aber rechtlich problematisch"
```

---

### 5. SCHICHTARBEIT

#### 5.1 Drei-Schicht-System
```yaml
Bezeichnung: "Schichtarbeit 3-Schicht"
Wochenstunden: 40h
Schichten:
  - Frühschicht: 06:00 - 14:00 Uhr
  - Spätschicht: 14:00 - 22:00 Uhr
  - Nachtschicht: 22:00 - 06:00 Uhr
Zuschläge:
  - Nachtarbeit (23:00-06:00): +25%
  - Sonntagsarbeit: +50%
  - Feiertagsarbeit: +125%
Urlaubsanspruch: 30 Tage/Jahr
```

---

## 💰 DEUTSCHE GEHALTSABRECHNUNG - PFLICHTANGABEN

### Gesetzliche Grundlagen:
- **§ 108 Gewerbeordnung (GewO):** Textform-Erfordernis
- **Nachweisgesetz (NachwG):** Dokumentationspflichten
- **Entgeltbescheinigungsverordnung (EBV):** Inhalt der Abrechnung

---

## 📄 PFLICHTANGABEN AUF GEHALTSABRECHNUNG

### 1. ARBEITGEBER-ANGABEN
```yaml
Pflichtfelder:
  - Firmenname: "Bereifung24 GmbH"
  - Anschrift: "Straße, PLZ Ort"
  - Steuernummer: "123/456/78901"
  - Betriebsnummer: "12345678" (Bundesagentur für Arbeit)
```

### 2. ARBEITNEHMER-ANGABEN
```yaml
Pflichtfelder:
  - Vor- und Nachname
  - Geburtsdatum
  - Personalnummer (intern)
  - Eintrittsdatum
  - Steuerklasse: I, II, III, IV, V, VI
  - Steuer-ID: "12 345 678 901"
  - Sozialversicherungsnummer
  - Krankenversicherung: Name der Kasse
  - KV-Zusatzbeitrag: z.B. 1,7%
  - Religionszugehörigkeit: rk/ev/- (für Kirchensteuer)
  - Anzahl Kinderfreibeträge: z.B. 0,5 / 1,0 / 1,5
```

### 3. ABRECHNUNGSZEITRAUM
```yaml
Pflichtfelder:
  - Abrechnungsmonat: "Dezember 2025"
  - Abrechnungszeitraum: "01.12.2025 - 31.12.2025"
  - Arbeitstage im Monat: z.B. 21 Tage
  - Kalendertage: 31 Tage
```

### 4. BRUTTOENTGELT-BERECHNUNG

#### 4.1 Festgehalt (Monatslohn)
```yaml
Beispiel Vollzeit 40h:
  Monatsgehalt (Brutto):           4.500,00 €
  ────────────────────────────────────────
  Stundensatz:                      25,95 € (4.500 ÷ 173,33h)
```

#### 4.2 Stundenlohn
```yaml
Beispiel Teilzeit 20h:
  Stundenlohn:                      20,00 €
  Geleistete Stunden:               86,67 h
  ────────────────────────────────────────
  Bruttolohn:                    1.733,40 €
```

#### 4.3 Zuschläge & Zulagen (steuerfrei oder steuerpflichtig)
```yaml
Mögliche Zuschläge:
  + Überstunden (25% Zuschlag):      125,00 €
  + Nachtarbeit (25% steuerfrei):     80,00 €
  + Sonntagsarbeit (50% steuerfrei): 150,00 €
  + Weihnachtsgeld:                  500,00 €
  + Vermögenswirksame Leistungen:     40,00 € (AG-Anteil)
  + Fahrtkostenzuschuss:              50,00 € (steuerfrei bis 100€)
  ────────────────────────────────────────
  Brutto-Gesamt:                   5.445,00 €
```

### 5. ABZÜGE - SOZIALVERSICHERUNG (2024/2025)

```yaml
Bemessungsgrundlage: 5.445,00 € (bis BBG)

Krankenversicherung (KV):
  Allgemeiner Beitragssatz:          14,6%
  - Arbeitnehmeranteil:               7,3%    → 397,49 €
  - Arbeitgeberanteil:                7,3%    → 397,49 €
  
  Zusatzbeitrag (Ø 1,7%):            1,7%
  - Arbeitnehmeranteil:               0,85%   →  46,28 €
  - Arbeitgeberanteil:                0,85%   →  46,28 €
  
  KV Gesamt (AN):                     8,15%   → 443,77 €

Pflegeversicherung (PV):
  Beitragssatz:                       3,4%
  - Arbeitnehmeranteil:               1,7%    →  92,57 €
  - Arbeitgeberanteil:                1,7%    →  92,57 €
  
  Zuschlag Kinderlose (ab 23 Jahre): 0,6%    →  32,67 €
  PV Gesamt (AN):                     2,3%    → 125,24 €

Rentenversicherung (RV):
  Beitragssatz:                      18,6%
  - Arbeitnehmeranteil:               9,3%    → 506,39 €
  - Arbeitgeberanteil:                9,3%    → 506,39 €

Arbeitslosenversicherung (ALV):
  Beitragssatz:                       2,6%
  - Arbeitnehmeranteil:               1,3%    →  70,79 €
  - Arbeitgeberanteil:                1,3%    →  70,79 €

────────────────────────────────────────────
Gesamt SV-Abzüge (AN):                      1.146,19 €
Gesamt SV-Kosten (AG):                      1.113,52 €
```

**Beitragsbemessungsgrenzen 2024:**
- KV/PV: 5.175,00 € (West) / 5.175,00 € (Ost) monatlich
- RV/ALV: 7.550,00 € (West) / 7.450,00 € (Ost) monatlich

### 6. ABZÜGE - LOHNSTEUER

#### 6.1 Steuerklassen-Übersicht
```yaml
Steuerklasse I:   Alleinstehend, unverheiratet, geschieden
Steuerklasse II:  Alleinerziehend (mit Entlastungsbetrag)
Steuerklasse III: Verheiratet, höheres Einkommen (Kombination mit V)
Steuerklasse IV:  Verheiratet, beide ähnliches Einkommen
Steuerklasse V:   Verheiratet, geringeres Einkommen (Kombination mit III)
Steuerklasse VI:  Zweiter/weiterer Job (höchste Abzüge)
```

#### 6.2 Lohnsteuer-Berechnung (Beispiel Steuerklasse I, kinderlos)
```yaml
Brutto-Gehalt:                      5.445,00 €
- SV-Beiträge (AN):                -1.146,19 €
────────────────────────────────────────────
Steuerpflichtiges Einkommen:        4.298,81 €

Lohnsteuer (ca. 18%):                 773,79 €
Solidaritätszuschlag (5,5% ab 16.956€/Jahr):
  - Bis 16.956€/Jahr: 0€
  - Darüber: 5,5% der Lohnsteuer     →   0,00 € (in diesem Fall)
  
Kirchensteuer (8% Bayern/BW, 9% andere):
  - Bei "rk" oder "ev":               69,64 € (9% von 773,79€)

────────────────────────────────────────────
Gesamt Steuer-Abzüge:                 843,43 €
```

### 7. NETTOLOHN-BERECHNUNG

```yaml
Brutto-Gesamt:                      5.445,00 €
- Sozialversicherung (AN):         -1.146,19 €
- Lohnsteuer:                        -773,79 €
- Kirchensteuer:                      -69,64 €
────────────────────────────────────────────
Auszahlungsbetrag (Netto):          3.455,38 €
```

### 8. ARBEITGEBER-KOSTEN (Gesamtkosten)

```yaml
Brutto-Gehalt:                      5.445,00 €
+ AG-Anteil SV:                     1.113,52 €
+ Umlagen:
  - U1 (Krankheit):                    81,68 € (1,5%)
  - U2 (Mutterschaft):                 16,34 € (0,3%)
  - U3 (Insolvenzgeld):                 5,45 € (0,1%)
+ Berufsgenossenschaft (ca.):          54,45 € (1%)
────────────────────────────────────────────
Gesamt-Personalkosten:              6.716,44 €
```

**Personalkosten = ca. 123% des Brutto-Gehalts**

---

## 📋 MUSTER-GEHALTSABRECHNUNG

```
═══════════════════════════════════════════════════════════════════
                        GEHALTSABRECHNUNG
═══════════════════════════════════════════════════════════════════

ARBEITGEBER                          ARBEITNEHMER
Bereifung24 GmbH                     Max Mustermann
Musterstraße 123                     Mitarbeiterstraße 456
12345 Berlin                         12345 Berlin
Steuernummer: 12/345/67890           Personalnummer: MA-2024-001
Betriebsnummer: 12345678             Steuer-ID: 12 345 678 901
                                     SV-Nummer: 12 345678 M 123
                                     Geburtsdatum: 15.05.1990

───────────────────────────────────────────────────────────────────
ABRECHNUNGSZEITRAUM: Dezember 2025 (01.12.2025 - 31.12.2025)
Eintrittsdatum: 01.03.2024
Arbeitszeit: Vollzeit 40h/Woche (Festgehalt)
Arbeitstage: 21 Tage | Kalendertage: 31 Tage
───────────────────────────────────────────────────────────────────

STEUERLICHE MERKMALE
Steuerklasse:              I         Kinderfreibetrag:    0,0
Kirchensteuer:             ev (9%)   KV-Zusatzbeitrag:    1,7%
Krankenversicherung:       TK Techniker Krankenkasse

───────────────────────────────────────────────────────────────────
BRUTTOENTGELT
───────────────────────────────────────────────────────────────────
Monatsgehalt                                              4.500,00 €
Überstunden (5h à 31,19€)                                   155,95 €
Weihnachtsgeld                                              500,00 €
Fahrtkostenzuschuss (steuerfrei)                             50,00 €
                                                          ──────────
BRUTTO-GESAMT                                             5.205,95 €

───────────────────────────────────────────────────────────────────
GESETZLICHE ABZÜGE
───────────────────────────────────────────────────────────────────
Krankenversicherung        7,3%       -379,63 €
KV-Zusatzbeitrag           0,85%       -44,25 €
Pflegeversicherung         2,3%       -119,74 €  (inkl. Kinderlose)
Rentenversicherung         9,3%       -484,15 €
Arbeitslosenversicherung   1,3%        -67,68 €
                                      ──────────
SOZIALVERSICHERUNG GESAMT  20,75%   -1.095,45 €

Lohnsteuer                            -738,29 €
Kirchensteuer              9%          -66,45 €
Solidaritätszuschlag                     0,00 €
                                      ──────────
STEUERN GESAMT                         -804,74 €

───────────────────────────────────────────────────────────────────
AUSZAHLUNG
───────────────────────────────────────────────────────────────────
Brutto-Gesamt                                             5.205,95 €
- Sozialversicherung                                     -1.095,45 €
- Steuern                                                  -804,74 €
                                                          ══════════
NETTO-AUSZAHLUNG                                          3.305,76 €

───────────────────────────────────────────────────────────────────
ARBEITGEBERANTEIL (nur zur Information)
───────────────────────────────────────────────────────────────────
AG-Anteil Krankenversicherung                               379,63 €
AG-Anteil KV-Zusatzbeitrag                                   44,25 €
AG-Anteil Pflegeversicherung                                 88,50 €
AG-Anteil Rentenversicherung                                484,15 €
AG-Anteil Arbeitslosenversicherung                           67,68 €
U1-Umlage (Krankheit)                                        78,09 €
U2-Umlage (Mutterschaft)                                     15,62 €
U3-Umlage (Insolvenzgeld)                                     5,21 €
Berufsgenossenschaft                                         52,06 €
                                                          ──────────
GESAMT-PERSONALKOSTEN                                     6.420,19 €

───────────────────────────────────────────────────────────────────
KONTOVERBINDUNG
Bankname:        Deutsche Bank AG
IBAN:            DE89 1234 5678 9012 3456 78
BIC:             DEUTDEDBXXX
Überweisungsdatum: 01.01.2026

───────────────────────────────────────────────────────────────────
URLAUBSKONTO                         ÜBERSTUNDENKONTO
Jahresanspruch:        30 Tage       Überstunden diesen Monat:  +5h
Genommen 2025:         18 Tage       Überstundensaldo:         +12h
Resturlaub 2025:       12 Tage       Ausgezahlt diesen Monat:   -5h
Übertrag 2026:         12 Tage       Neuer Saldo:               +12h

───────────────────────────────────────────────────────────────────
BESCHEINIGUNG
Diese Gehaltsabrechnung wurde maschinell erstellt und ist ohne
Unterschrift gültig. Bitte bewahren Sie sie für Ihre Unterlagen auf.

Erstellt am: 20.12.2025 | Bereifung24 GmbH - Personalabrechnung
═══════════════════════════════════════════════════════════════════
```

---

## 🗄️ DATENBANK-SCHEMA ERWEITERUNGEN

### Neue/Erweiterte Enums

```prisma
enum WorkTimeModel {
  FULLTIME_40H           // Vollzeit 40h
  FULLTIME_37_5H         // Vollzeit 37,5h
  FULLTIME_35H           // Vollzeit 35h
  PARTTIME_30H           // Teilzeit 30h (75%)
  PARTTIME_25H           // Teilzeit 25h (62,5%)
  PARTTIME_20H           // Teilzeit 20h (50%)
  PARTTIME_15H           // Teilzeit 15h (37,5%)
  MINIJOB_603            // Minijob 603€ (Stand 2026)
  SHORTTERM_EMPLOYMENT   // Kurzfristige Beschäftigung
  FLEXTIME               // Gleitzeit
  TRUST_BASED            // Vertrauensarbeitszeit
  SHIFT_WORK             // Schichtarbeit
  CUSTOM                 // Benutzerdefiniert
}

enum EmploymentType {
  PERMANENT              // Unbefristet
  TEMPORARY              // Befristet
  INTERN                 // Praktikum
  APPRENTICE             // Ausbildung
  FREELANCE              // Freiberufler
  MINIJOB                // Geringfügig beschäftigt
  SHORTTERM              // Kurzfristig beschäftigt
}

enum SalaryType {
  MONTHLY                // Monatsgehalt
  HOURLY                 // Stundenlohn
  ANNUAL                 // Jahresgehalt (bei Führungskräften)
}

enum TaxClass {
  CLASS_I                // Steuerklasse I
  CLASS_II               // Steuerklasse II (Alleinerziehend)
  CLASS_III              // Steuerklasse III
  CLASS_IV               // Steuerklasse IV
  CLASS_V                // Steuerklasse V
  CLASS_VI               // Steuerklasse VI (Zweitjob)
}

enum Religion {
  NONE                   // Keine (-)
  CATHOLIC               // Römisch-Katholisch (rk)
  PROTESTANT             // Evangelisch (ev)
  OTHER                  // Andere
}

enum PayrollStatus {
  DRAFT                  // Entwurf (automatisch erstellt)
  REVIEW                 // In Prüfung
  APPROVED               // Genehmigt
  PAID                   // Ausgezahlt
  CANCELLED              // Storniert
}
```

### Erweiterte Models

```prisma
model B24Employee {
  // ... existing fields ...
  
  // ============================================
  // HIERARCHIE
  // ============================================
  managerId    String?      
  manager      B24Employee? @relation("EmployeeHierarchy", fields: [managerId], references: [id], onDelete: SetNull)
  subordinates B24Employee[] @relation("EmployeeHierarchy")
  hierarchyLevel Int @default(0) // 0=Mitarbeiter, 1=Teamleiter, 2=Manager, 3=Geschäftsführung
  
  // ============================================
  // ARBEITSVERTRAG
  // ============================================
  employmentType   EmploymentType?
  workTimeModel    WorkTimeModel?
  weeklyHours      Float?          // z.B. 40.0, 37.5, 20.0
  monthlyHours     Float?          // Automatisch berechnet (weeklyHours × 52 ÷ 12)
  dailyHours       Float?          // z.B. 8.0 bei 40h-Woche
  workDaysPerWeek  Int?            // z.B. 5 (Mo-Fr)
  
  // Arbeitszeiten
  workStartTime    String?         // z.B. "08:00"
  workEndTime      String?         // z.B. "17:00"
  coreTimeStart    String?         // Kernarbeitszeit von (Gleitzeit)
  coreTimeEnd      String?         // Kernarbeitszeit bis (Gleitzeit)
  flexTimeStart    String?         // Gleitzeit von (z.B. "07:00")
  flexTimeEnd      String?         // Gleitzeit bis (z.B. "20:00")
  
  contractStart    DateTime?
  contractEnd      DateTime?
  probationEndDate DateTime?
  noticePeriod     String?         // z.B. "4 Wochen zum Monatsende"
  
  // ============================================
  // GEHALT & LOHN
  // ============================================
  salaryType       SalaryType?
  monthlySalary    Decimal?        // Bei Festgehalt
  annualSalary     Decimal?        // Bei Jahresgehalt (÷ 12 = Monat)
  hourlyRate       Decimal?        // Bei Stundenlohn
  
  // Minijob
  isMinijob        Boolean @default(false)
  miniJobExempt    Boolean @default(false) // Von RV-Pflicht befreit
  
  // ============================================
  // STEUER & SOZIALVERSICHERUNG
  // ============================================
  taxId            String?         // Steuer-ID (11-stellig)
  taxClass         TaxClass?
  childAllowance   Float?          // z.B. 0.5, 1.0, 1.5
  religion         Religion @default(NONE)
  
  socialSecurityNumber String?     // SV-Nummer
  healthInsurance      String?     // Name der Krankenkasse
  healthInsuranceRate  Float?      // Zusatzbeitrag (z.B. 1.7)
  isChildless          Boolean @default(true) // Für PV-Zuschlag (+0.6%)
  
  // ============================================
  // URLAUBSANSPRUCH
  // ============================================
  annualVacationDays Int @default(30) // Gesetzlich: 24 Tage bei 6-Tage-Woche
  
  // ============================================
  // BANKVERBINDUNG
  // ============================================
  bankName      String?
  iban          String?
  bic           String?
  
  // ... Relations ...
}

// ============================================
// GEHALTSABRECHNUNG (ERWEITERT)
// ============================================
model Payroll {
  id          String   @id @default(cuid())
  employeeId  String
  employee    B24Employee @relation("EmployeePayroll", fields: [employeeId], references: [id], onDelete: Cascade)
  
  // Abrechnungszeitraum
  month       Int      // 1-12
  year        Int
  periodStart DateTime // 01.12.2025
  periodEnd   DateTime // 31.12.2025
  
  // Arbeitstage
  workDaysInMonth     Int    // z.B. 21 Tage
  calendarDaysInMonth Int    // z.B. 31 Tage
  
  // ============================================
  // BRUTTO-ENTGELT
  // ============================================
  baseSalary          Decimal  // Grundgehalt (Monatsgehalt oder Stundenlohn × Stunden)
  
  // Stundenlohn-spezifisch
  workedHours         Float?   // Geleistete Stunden
  hourlyRate          Decimal? // Stundensatz
  
  // Zuschläge (steuerpflichtig)
  overtimePay         Decimal @default(0) // Überstunden-Vergütung
  bonusPayment        Decimal @default(0) // Bonuszahlungen
  christmasBonus      Decimal @default(0) // Weihnachtsgeld
  vacationBonus       Decimal @default(0) // Urlaubsgeld
  
  // Zuschläge (steuerfrei nach § 3b EStG)
  nightWorkBonus      Decimal @default(0) // Nachtzuschlag (25%)
  sundayWorkBonus     Decimal @default(0) // Sonntagszuschlag (50%)
  holidayWorkBonus    Decimal @default(0) // Feiertagszuschlag (125%)
  
  // Sonstige Bezüge
  travelAllowance     Decimal @default(0) // Fahrtkostenzuschuss (steuerfrei bis 100€)
  vwl                 Decimal @default(0) // Vermögenswirksame Leistungen (AG-Anteil)
  childBenefit        Decimal @default(0) // Kindergeldzuschlag
  
  grossTotal          Decimal  // Brutto-Gesamt
  
  // ============================================
  // SOZIALVERSICHERUNG (Arbeitnehmer-Anteil)
  // ============================================
  healthInsurance     Decimal  // KV (7,3%)
  healthInsuranceExtra Decimal // KV-Zusatzbeitrag (Ø 1,7%)
  nursingInsurance    Decimal  // PV (1,7% + 0,6% wenn kinderlos)
  pensionInsurance    Decimal  // RV (9,3%)
  unemploymentInsurance Decimal // ALV (1,3%)
  
  totalSocialSecurity Decimal  // Gesamt SV (AN)
  
  // ============================================
  // SOZIALVERSICHERUNG (Arbeitgeber-Anteil)
  // ============================================
  employerHealthInsurance    Decimal // AG-Anteil KV (7,3%)
  employerHealthInsuranceExtra Decimal // AG-Anteil KV-Zusatz (0,85%)
  employerNursingInsurance   Decimal // AG-Anteil PV (1,7%)
  employerPensionInsurance   Decimal // AG-Anteil RV (9,3%)
  employerUnemploymentInsurance Decimal // AG-Anteil ALV (1,3%)
  
  // Umlagen
  u1Levy              Decimal @default(0) // U1-Umlage Krankheit (1,5%)
  u2Levy              Decimal @default(0) // U2-Umlage Mutterschaft (0,3%)
  u3Levy              Decimal @default(0) // U3-Umlage Insolvenz (0,1%)
  bgLevy              Decimal @default(0) // Berufsgenossenschaft (ca. 1%)
  
  totalEmployerCosts  Decimal // AG-Gesamtkosten
  
  // ============================================
  // STEUERN
  // ============================================
  taxableIncome       Decimal  // Steuerpflichtiges Einkommen
  incomeTax           Decimal  // Lohnsteuer
  solidarityTax       Decimal  // Solidaritätszuschlag (5,5%)
  churchTax           Decimal  // Kirchensteuer (8-9%)
  
  totalTax            Decimal  // Gesamt Steuern
  
  // ============================================
  // NETTOLOHN
  // ============================================
  netSalary           Decimal  // Auszahlungsbetrag
  
  // ============================================
  // ABWESENHEITEN
  // ============================================
  vacationDays        Int @default(0)  // Urlaubstage im Monat
  sickDays            Int @default(0)  // Kranktage im Monat
  overtimeHours       Float @default(0) // Überstunden diesen Monat
  
  // ============================================
  // STATUS & WORKFLOW
  // ============================================
  status       PayrollStatus @default(DRAFT)
  
  generatedAt  DateTime @default(now()) // Automatisch erstellt am
  
  reviewedById String?
  reviewedBy   B24Employee? @relation("PayrollReviewer", fields: [reviewedById], references: [id], onDelete: SetNull)
  reviewedAt   DateTime?
  
  approvedById String?
  approvedBy   B24Employee? @relation("PayrollApprover", fields: [approvedById], references: [id], onDelete: SetNull)
  approvedAt   DateTime?
  
  paidAt       DateTime? // Auszahlung erfolgt am
  transferDate DateTime? // Überweisungsdatum
  
  // ============================================
  // DOKUMENT
  // ============================================
  pdfUrl       String?  // Link zur Gehaltsabrechnung-PDF
  sentToEmployee Boolean @default(false) // Per E-Mail versendet
  sentAt       DateTime?
  
  // ============================================
  // BUCHHALTUNGS-INTEGRATION
  // ============================================
  accountingEntryId String? @unique // Verknüpfung zu AccountingEntry
  
  // ============================================
  // NOTIZEN
  // ============================================
  internalNotes String? @db.Text // Interne Notizen (nicht auf PDF)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@unique([employeeId, month, year])
  @@index([status])
  @@index([month, year])
  @@map("payrolls")
}

// ============================================
// ARBEITSZEIT-KONFIGURATION
// ============================================
model WorkTimeConfiguration {
  id          String   @id @default(cuid())
  
  model       WorkTimeModel
  name        String   // z.B. "Vollzeit 40h", "Teilzeit 20h"
  description String?  // Beschreibung
  
  // Zeiten
  weeklyHours   Float    // z.B. 40.0, 20.0
  monthlyHours  Float    // Berechnet: weeklyHours × 52 ÷ 12
  dailyHours    Float?   // z.B. 8.0
  workDaysPerWeek Int?   // z.B. 5
  
  // Standard-Arbeitszeiten
  defaultStartTime  String? // z.B. "08:00"
  defaultEndTime    String? // z.B. "17:00"
  
  // Urlaubsanspruch
  defaultVacationDays Int @default(30)
  
  // Sozialversicherungspflichtig
  socialSecurityRequired Boolean @default(true)
  
  // Aktiv/Inaktiv
  isActive    Boolean @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("work_time_configurations")
}
```

---

## 🚀 IMPLEMENTIERUNGS-PHASEN

### Phase 1: Datenbank & Schema (1-2 Tage)
- [x] Enums erstellen
- [x] B24Employee erweitern
- [x] Payroll Model erweitern
- [x] WorkTimeConfiguration Model
- [x] Migration erstellen
- [x] Seed-Daten für Arbeitszeitmodelle

### Phase 2: HR Dashboard (2 Tage)
- [ ] `/admin/hr` Dashboard-Seite
- [ ] Übersicht-Karten (Stats)
- [ ] Aktionen-Liste
- [ ] Quick-Access Tiles

### Phase 3: Mitarbeiter-Verwaltung (3-4 Tage)
- [ ] `/admin/hr/mitarbeiter` Liste
- [ ] `/admin/hr/mitarbeiter/neu` Formular
- [ ] `/admin/hr/mitarbeiter/[id]` Detail-Tabs
- [ ] Hierarchie-Dropdown (Vorgesetzter)
- [ ] Arbeitszeitmodell-Auswahl
- [ ] Steuer/SV-Felder

### Phase 4: Gehaltsabrechnung (5-7 Tage)
- [ ] `/admin/hr/gehaltsabrechnung` Monatsübersicht
- [ ] Automatische Payroll-Generierung (Cron)
- [ ] Berechnungs-Engine (SV, Steuer)
- [ ] PDF-Generator (deutsches Muster)
- [ ] E-Mail-Versand an Mitarbeiter
- [ ] Mitarbeiter-Zugriff `/mitarbeiter/gehaltsabrechnungen`

### Phase 5: Genehmigungs-Workflow (2-3 Tage)
- [ ] `/admin/hr/antraege` Antragsübersicht
- [ ] Hierarchie-basierter Workflow
- [ ] E-Mail-Benachrichtigungen
- [ ] Approve/Reject-Funktionen

### Phase 6: Stellenausschreibungen (2-3 Tage)
- [ ] `/admin/hr/jobs` Übersicht
- [ ] `/admin/hr/jobs/neu` Stelle erstellen
- [ ] `/jobs` Public-Seite
- [ ] Bewerbungs-Formular
- [ ] `/admin/hr/jobs/[id]/bewerbungen` Management

### Phase 7: Buchhaltungs-Integration (2 Tage)
- [ ] Payroll → AccountingEntry
- [ ] Automatische Buchungen
- [ ] DATEV-Export-Erweiterung

### Phase 8: Testing & Dokumentation (2 Tage)
- [ ] Unit-Tests
- [ ] End-to-End Tests
- [ ] Dokumentation
- [ ] User-Guide

---

## 📅 ZEITPLAN

**Gesamt-Dauer:** 19-25 Arbeitstage (ca. 4-5 Wochen)

**Meilensteine:**
- Woche 1: Datenbank + HR Dashboard + Mitarbeiter-Verwaltung Start
- Woche 2: Mitarbeiter-Verwaltung fertig + Gehaltsabrechnung Start
- Woche 3: Gehaltsabrechnung fertig + Workflows
- Woche 4: Recruiting + Integration
- Woche 5: Testing + Go-Live

---

## ✅ NÄCHSTE SCHRITTE

1. **Schema-Migration durchführen**
2. **Seed-Daten erstellen** (Arbeitszeitmodelle)
3. **HR Dashboard bauen**
4. **Schritt-für-Schritt-Implementierung**

**Bereit zum Start?** 🚀
