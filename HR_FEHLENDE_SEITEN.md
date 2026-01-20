# HR Module - Fehlende Seiten (Stand: 19.01.2026)

## ✅ Existierende Seiten
- [x] `/admin/hr` - Dashboard mit Statistiken
- [x] `/admin/hr/mitarbeiter` - Mitarbeiter-Liste
- [x] `/admin/hr/mitarbeiter/neu` - Neuer Mitarbeiter
- [x] `/admin/hr/mitarbeiter/[id]` - Mitarbeiter Details
- [x] `/admin/hr/mitarbeiter/[id]/hr-daten` - HR-Daten (Gehalt, Vertrag, etc.)
- [x] `/admin/hr/ehemalige-mitarbeiter` - Inaktive Mitarbeiter
- [x] `/admin/hr/stats` - Stats API
- [x] `/admin/hr/applications-assignment` - App-Zuordnung

## ❌ Fehlende Seiten (auf Dashboard verlinkt)

### Mitarbeiter-Management
- [ ] `/admin/hr/hierarchie` - Organigramm anzeigen

### Gehaltsabrechnung (komplett fehlend!)
- [ ] `/admin/hr/gehaltsabrechnungen` - Alle Gehaltsabrechnungen
- [ ] `/admin/hr/gehaltsabrechnungen/generieren` - Monatsabrechnung generieren  
- [ ] `/admin/hr/gehaltsabrechnungen/auswertungen` - Lohnkosten-Auswertungen

### Recruiting (komplett fehlend!)
- [ ] `/admin/hr/stellen` - Stellenausschreibungen
- [ ] `/admin/hr/bewerbungen` - Bewerbungen verwalten
- [ ] `/admin/hr/stellen/neu` - Neue Stelle ausschreiben

### Genehmigungen (Phase 3 - Workflow-System)
- [ ] `/admin/hr/genehmigungen` - Pendente Genehmigungen

---

## Empfohlene Implementierungs-Reihenfolge

### Phase 1: Organigramm (einfach)
1. **Hierarchie/Organigramm** (`/admin/hr/hierarchie`)
   - Visualisierung der Mitarbeiter-Hierarchie
   - Nutzt bereits vorhandene `hierarchyLevel` und `manager` Felder
   - Simple Tree-Darstellung mit React Flow oder D3

### Phase 2: Gehaltsabrechnung (mittel-komplex)
2. **Gehaltsabrechnungen Liste** (`/admin/hr/gehaltsabrechnungen`)
   - Übersicht aller generierten Abrechnungen
   - Filter nach Monat/Jahr, Mitarbeiter
   - Download als PDF

3. **Monatsabrechnung generieren** (`/admin/hr/gehaltsabrechnungen/generieren`)
   - Formular: Monat/Jahr auswählen
   - Mitarbeiter auswählen (alle/einzeln)
   - Generiert Abrechnungen für ausgewählte Mitarbeiter
   - Nutzt Daten aus `B24Employee` (monthlySalary, taxClass, etc.)

4. **Lohnkosten-Auswertungen** (`/admin/hr/gehaltsabrechnungen/auswertungen`)
   - Monats-/Jahresvergleich der Lohnkosten
   - Charts mit Kosten pro Abteilung
   - Export als Excel/CSV

### Phase 3: Recruiting (komplex)
5. **Stellenausschreibungen** (`/admin/hr/stellen`)
   - Liste offener Stellen
   - Status: Offen, Besetzt, Geschlossen
   - Verknüpfung mit Bewerbungen

6. **Bewerbungen verwalten** (`/admin/hr/bewerbungen`)
   - Bewerbungspipeline (Eingegangen → Gespräch → Angebot → Eingestellt/Abgelehnt)
   - Dokumenten-Upload (CV, Zeugnisse)
   - Notizen und Bewertungen

7. **Neue Stelle ausschreiben** (`/admin/hr/stellen/neu`)
   - Formular: Position, Abteilung, Anforderungen
   - Gehaltsspanne, Vertragsart
   - Veröffentlichung intern/extern

### Phase 4: Genehmigungen (sehr komplex)
8. **Genehmigungssystem** (`/admin/hr/genehmigungen`)
   - Workflow-Engine für Freigaben
   - Hierarchie-basierte Genehmigungen
   - Typen: Urlaub, Spesen, Vertragsänderungen, etc.
   - Verwendet Lock/Approve Pattern aus Buchhaltung

---

## Prisma Models (benötigt für neue Features)

### Gehaltsabrechnung
```prisma
model Payroll {
  id                String   @id @default(cuid())
  employeeId        String
  employee          B24Employee @relation(fields: [employeeId], references: [id])
  
  month             Int      // 1-12
  year              Int
  
  grossSalary       Decimal
  netSalary         Decimal
  incomeTax         Decimal
  socialSecurity    Decimal
  healthInsurance   Decimal
  pensionInsurance  Decimal
  
  bonuses           Decimal  @default(0)
  deductions        Decimal  @default(0)
  
  pdfPath           String?
  
  locked            Boolean  @default(false)
  paidAt            DateTime?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@unique([employeeId, month, year])
}
```

### Recruiting
```prisma
model JobPosting {
  id              String   @id @default(cuid())
  title           String
  department      String?
  position        String
  description     String
  requirements    String
  salaryMin       Decimal?
  salaryMax       Decimal?
  employmentType  String
  status          String   // OPEN, FILLED, CLOSED
  
  applications    JobApplication[]
  
  publishedAt     DateTime?
  closedAt        DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model JobApplication {
  id              String   @id @default(cuid())
  jobPostingId    String
  jobPosting      JobPosting @relation(fields: [jobPostingId], references: [id])
  
  firstName       String
  lastName        String
  email           String
  phone           String?
  
  cvPath          String?
  coverLetterPath String?
  
  status          String   // RECEIVED, INTERVIEW, OFFER, HIRED, REJECTED
  notes           String?
  rating          Int?     // 1-5
  
  interviewDate   DateTime?
  hiredAsEmployeeId String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### Genehmigungen (Phase 4)
```prisma
model ApprovalWorkflow {
  id              String   @id @default(cuid())
  type            String   // LEAVE, EXPENSE, CONTRACT_CHANGE, SALARY_CHANGE
  requesterId     String
  requester       B24Employee @relation("ApprovalRequester", fields: [requesterId], references: [id])
  
  approverId      String?
  approver        B24Employee? @relation("ApprovalApprover", fields: [approverId], references: [id])
  
  status          String   // PENDING, APPROVED, REJECTED
  data            Json     // Flexible data structure for different types
  
  requestedAt     DateTime @default(now())
  reviewedAt      DateTime?
  comments        String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Nächster Schritt

**Welche Seite möchtest du als erstes implementieren?**

Meine Empfehlung:
1. **Organigramm** (schnell umzusetzen, sofort nützlich)
2. **Gehaltsabrechnungen** (wichtig für HR-Workflows)
3. **Recruiting** (komplex, aber wertvoll)
