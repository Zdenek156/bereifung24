# Mitarbeiter-Portal - Berechtigungssystem

## Übersicht

Das **Mitarbeiter-Portal** (`/mitarbeiter`) ist komplett getrennt vom **Admin-Portal** (`/admin`).

### Unterschiede:

| Feature | Admin-Portal | Mitarbeiter-Portal |
|---------|-------------|-------------------|
| **URL** | `/admin/*` | `/mitarbeiter/*` |
| **Zugriff** | Nur ADMIN (Role) | B24_EMPLOYEE (Role) |
| **Zweck** | System-Verwaltung | Self-Service für Mitarbeiter |
| **Berechtigungen** | Voller Zugriff | Basiert auf B24EmployeePermission |

## Berechtigungssystem

### Standard-Seiten (Immer sichtbar)

Diese Seiten sind **immer** für jeden Mitarbeiter sichtbar:

1. **Dashboard** (`/mitarbeiter`)
   - Übersicht über Statistiken
   - Urlaubstage, Überstunden, Dokumente
   
2. **Profil** (`/mitarbeiter/profil`)
   - Persönliche Daten
   - Bankverbindung
   - Notfallkontakt

3. **Dokumente** (`/mitarbeiter/dokumente`)
   - Verträge
   - Gehaltsabrechnungen
   - Upload & Download

### Berechtigungsbasierte Seiten

Diese Seiten werden **nur angezeigt**, wenn der Mitarbeiter die entsprechende Permission hat:

| Seite | Resource | Beschreibung |
|-------|----------|-------------|
| E-Mail | `email` | IMAP/SMTP Postfach |
| Urlaub & Spesen | `leave-requests` | Urlaubsanträge einreichen |
| Dateiverwaltung | `files` | Gemeinsame Dateien & Ordner |
| Verbesserungsvorschläge | `kvp` | KVP-Ideen einreichen |

## Wie funktioniert die Berechtigungsprüfung?

### 1. API-Route: `/api/employee/permissions`

```typescript
GET /api/employee/permissions

Response:
{
  "permissions": [
    { "resource": "email", "canRead": true, "canWrite": true },
    { "resource": "files", "canRead": true, "canWrite": false }
  ],
  "accessibleResources": ["email", "files"]
}
```

**Logik:**
- Prüft Session: Nur B24_EMPLOYEE-Role
- Lädt alle B24EmployeePermission mit `canRead: true`
- Gibt Liste der zugänglichen Resources zurück

### 2. Frontend: Navigation dynamisch laden

```typescript
// app/mitarbeiter/page.tsx

const fetchPermissions = async () => {
  const res = await fetch('/api/employee/permissions')
  const data = await res.json()
  
  // Filtere Kacheln: Standard ODER mit Permission
  const filtered = allNavigationItems.filter(item => 
    item.isDefault || accessibleResources.has(item.resource)
  )
  
  setVisibleItems(filtered)
}
```

## Verwaltung im Admin-Bereich

### Berechtigungen vergeben

1. Gehe zu `/admin/b24-employees`
2. Wähle einen Mitarbeiter aus
3. Tab "Details & Rechte"
4. Checkboxen aktivieren für gewünschte Bereiche:
   - ✅ E-Mail Versand → Mitarbeiter sieht "E-Mail" Kachel
   - ✅ Dateiverwaltung → Mitarbeiter sieht "Dateiverwaltung" Kachel
   - ✅ KVP → Mitarbeiter sieht "Verbesserungsvorschläge" Kachel

### Verfügbare Permissions

In der **Mitarbeiterverwaltung** können folgende Rechte vergeben werden:

**Für Mitarbeiter-Portal relevant:**
- `email` - E-Mail Postfach
- `files` - Dateiverwaltung
- `kvp` - KVP-Verbesserungsvorschläge
- `leave-requests` - Urlaubsverwaltung (zukünftig)

**Nur für Admin-Portal:**
- `workshops` - Werkstattverwaltung
- `customers` - Kundenverwaltung
- `billing` - Abrechnung
- `commissions` - Provisionen
- `analytics` - Analytics
- etc.

## Beispiel-Szenarien

### Szenario 1: Neuer Mitarbeiter ohne Zusatz-Rechte

**Vergeben:**
- Keine speziellen Permissions

**Sieht im Portal:**
- ✅ Dashboard
- ✅ Profil
- ✅ Dokumente

### Szenario 2: Account Manager mit E-Mail

**Vergeben:**
- ✅ E-Mail Versand (`email`)

**Sieht im Portal:**
- ✅ Dashboard
- ✅ Profil  
- ✅ Dokumente
- ✅ E-Mail

### Szenario 3: Vollzugriff

**Vergeben:**
- ✅ E-Mail Versand (`email`)
- ✅ Dateiverwaltung (`files`)
- ✅ KVP (`kvp`)

**Sieht im Portal:**
- ✅ Dashboard
- ✅ Profil
- ✅ Dokumente
- ✅ E-Mail
- ✅ Dateiverwaltung
- ✅ Verbesserungsvorschläge

## Implementierung Details

### Dateien geändert:

1. **API-Route erstellt:**
   - `app/api/employee/permissions/route.ts`

2. **Dashboard angepasst:**
   - `app/mitarbeiter/page.tsx`
   - Dynamische Navigation mit Permission-Check
   - Loading States

3. **Admin-Portal bereinigt:**
   - `components/AdminNavigationClient.tsx`
   - Mitarbeiter-Email Kachel entfernt (gehört ins Mitarbeiter-Portal)

### Neue Seiten hinzufügen

Um eine neue Seite zum Mitarbeiter-Portal hinzuzufügen:

```typescript
// In app/mitarbeiter/page.tsx

const allNavigationItems: NavigationItem[] = [
  // ... existing items
  {
    href: '/mitarbeiter/neue-seite',
    title: 'Neue Seite',
    description: 'Beschreibung',
    icon: '🎯',
    color: 'bg-pink-100',
    resource: 'neue-resource', // Permission Key
    isDefault: false // Nur mit Permission sichtbar
  }
]
```

Dann in der Mitarbeiterverwaltung die Permission `neue-resource` aktivieren!

## Sicherheit

### Backend-Validierung

**Wichtig:** Jede API-Route im Mitarbeiter-Portal muss Permissions prüfen!

```typescript
// Beispiel: app/api/employee/some-feature/route.ts

import { requirePermission } from '@/lib/permissions'

export async function GET() {
  // Prüfe Permission
  const permissionError = await requirePermission('some-resource', 'read')
  if (permissionError) return permissionError
  
  // ... Logik
}
```

### Frontend ist nur UI-Filter

Die Kacheln im Frontend sind **NUR visuell**! Die echte Sicherheit liegt in:
1. **API-Routes** mit `requirePermission()`
2. **Middleware** in `lib/permissions.ts`
3. **Database-Level** Permissions in `B24EmployeePermission`

## Admin vs. Mitarbeiter

### ADMIN (User-Tabelle)

- Rolle: `ADMIN` in `users` Tabelle
- Zugriff: `/admin/*` - Vollzugriff
- Kein Permission-Check nötig
- Kann ALLES verwalten

### B24_EMPLOYEE (B24Employee-Tabelle)

- Rolle: `B24_EMPLOYEE` in `b24_employees` Tabelle
- Zugriff: `/mitarbeiter/*` - Eingeschränkt
- Permission-Check aktiv
- Sieht nur freigeschaltete Bereiche

### Wichtig: Ein ADMIN ist NICHT automatisch B24_EMPLOYEE!

Wenn ein Admin das Mitarbeiter-Portal nutzen soll:
1. Erstelle B24Employee mit gleicher E-Mail
2. Vergebe gewünschte Permissions
3. Admin kann sich als B24_EMPLOYEE einloggen

## Zusammenfassung

✅ **Mitarbeiter-Portal komplett getrennt vom Admin-Portal**  
✅ **Berechtigungen basieren auf B24EmployeePermission**  
✅ **Standard-Seiten immer sichtbar (Profil, Dokumente)**  
✅ **Zusätzliche Seiten nur mit aktivierter Checkbox**  
✅ **Nur ein ADMIN zur Verwaltung**  
✅ **Sicherheit auf Backend-Ebene**
