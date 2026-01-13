# Checkliste: Neue Admin-Anwendung hinzufügen

**Wichtig:** Diese Anleitung beschreibt den vollständigen Prozess zum Hinzufügen einer neuen Admin-Anwendung mit automatischer Berechtigungsprüfung.

## 1. 📊 Datenbankeintrag erstellen

```sql
INSERT INTO "Application" (
  "id", 
  "key", 
  "name", 
  "description", 
  "adminRoute", 
  "category", 
  "sortOrder", 
  "isActive"
) VALUES (
  cuid(), 
  'meine-neue-app',              -- Eindeutiger Schlüssel (lowercase, kebab-case)
  'Meine neue App',              -- Anzeigename für Dashboard-Kachel
  'Beschreibung der App',        -- Optional: Beschreibung
  '/admin/meine-neue-app',       -- Route zur Admin-Seite
  'GENERAL',                     -- Kategorie: GENERAL, ACCOUNTING, HR, SALES, SUPPORT
  100,                           -- Sortierung (höher = weiter unten)
  true                           -- Aktiv (true/false)
);
```

**Alternativ via Prisma Script:**
```javascript
await prisma.application.create({
  data: {
    key: 'meine-neue-app',
    name: 'Meine neue App',
    description: 'Beschreibung',
    adminRoute: '/admin/meine-neue-app',
    category: 'GENERAL',
    sortOrder: 100,
    isActive: true
  }
})
```

## 2. 🛣️ Route in Middleware registrieren

**Datei:** `middleware.ts`

### Für Admin-Seiten:
Füge die neue Route zur `ROUTE_TO_APPLICATION_MAP` hinzu:

```typescript
const ROUTE_TO_APPLICATION_MAP: Record<string, string> = {
  '/admin/buchhaltung': 'buchhaltung',
  '/admin/hr': 'hr',
  // ... existing routes ...
  '/admin/meine-neue-app': 'meine-neue-app',  // ← NEU HINZUFÜGEN
}
```

### Für API-Endpoints:
Wenn die Anwendung API-Routes hat, füge sie zur `API_ROUTE_TO_APPLICATION_MAP` hinzu:

```typescript
const API_ROUTE_TO_APPLICATION_MAP: Record<string, string> = {
  '/api/admin/buchhaltung': 'buchhaltung',
  '/api/admin/hr': 'hr',
  // ... existing routes ...
  '/api/admin/meine-neue-app': 'meine-neue-app',  // ← NEU HINZUFÜGEN
}
```

### Für Unterseiten:
Wenn deine Anwendung Unterseiten hat, musst du diese NICHT einzeln hinzufügen. Die Middleware prüft automatisch den Hauptpfad:
- `/admin/meine-neue-app/details` → verwendet `meine-neue-app` Key
- `/admin/meine-neue-app/settings` → verwendet `meine-neue-app` Key

## 3. 🛡️ Optional: PermissionGuard auf Seitenebene

**Datei:** `app/admin/meine-neue-app/page.tsx`

Füge den PermissionGuard als zusätzliche Sicherheitsebene hinzu (Defense-in-Depth):

```tsx
import { PermissionGuard } from '@/components/PermissionGuard'

export default function MeineNeueApp() {
  return (
    <PermissionGuard applicationKey="meine-neue-app">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Meine neue App</h1>
        {/* Dein Content */}
      </div>
    </PermissionGuard>
  )
}
```

**Hinweis:** Dies ist technisch optional, da die Middleware bereits auf Edge-Ebene schützt. Es bietet aber zusätzliche Sicherheit und bessere Fehlermeldungen auf Client-Seite.

## 4. 🔄 Deployment

### Code committen und pushen:
```bash
git add .
git commit -m "Add neue-app admin module"
git push
```

### Auf Production deployen:
```bash
ssh root@bereifung24.de "cd /var/www/bereifung24 && git pull && export PATH=/root/.nvm/versions/node/v20.19.5/bin:/usr/bin:\$PATH && npm run build && pm2 restart bereifung24"
```

**Wichtig:** Die Middleware-Änderung erfordert einen kompletten Rebuild und Restart!

## 5. 👥 Berechtigungen vergeben

Nach dem Deployment:

1. Als ADMIN einloggen
2. Navigiere zu **HR → Anwendungsverwaltung** (`/admin/hr/applications-assignment`)
3. Wähle die Mitarbeiter aus, die Zugriff haben sollen
4. Weise die neue Anwendung zu

## 6. ✅ Testen

### Test 1: ADMIN-Rolle
- Einloggen als ADMIN
- Navigation zu `/admin/meine-neue-app` sollte funktionieren (ADMIN hat automatisch Zugriff auf alles)

### Test 2: Mitarbeiter MIT Berechtigung
- Einloggen als Mitarbeiter mit zugewiesener Berechtigung
- Dashboard sollte die neue Kachel anzeigen
- Navigation zur Seite sollte funktionieren

### Test 3: Mitarbeiter OHNE Berechtigung
- Einloggen als Mitarbeiter ohne diese Berechtigung
- Dashboard sollte die Kachel NICHT anzeigen
- Direkte Navigation zu `/mitarbeiter/meine-neue-app` sollte zum Dashboard mit Fehlermeldung umleiten

### Test 4: API-Schutz
```bash
# Als Mitarbeiter OHNE Berechtigung:
curl -X GET https://bereifung24.de/api/admin/meine-neue-app/stats \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json"

# Erwartete Antwort: 403 Forbidden
{"error": "Keine Berechtigung"}
```

## 📋 Vollständiges Beispiel

### Szenario: "Fleet Management" Modul hinzufügen

**1. Datenbank:**
```sql
INSERT INTO "Application" VALUES (
  'cluxxxxxxxx', 
  'fleet', 
  'Fuhrparkverwaltung', 
  'Verwaltung von Firmenfahrzeugen', 
  '/admin/fleet', 
  'GENERAL', 
  90, 
  true
);
```

**2. Middleware (`middleware.ts`):**
```typescript
const ROUTE_TO_APPLICATION_MAP: Record<string, string> = {
  // ... existing ...
  '/admin/fleet': 'fleet',
}

const API_ROUTE_TO_APPLICATION_MAP: Record<string, string> = {
  // ... existing ...
  '/api/admin/fleet': 'fleet',
}
```

**3. Seite erstellen (`app/admin/fleet/page.tsx`):**
```tsx
import { PermissionGuard } from '@/components/PermissionGuard'

export default function FleetPage() {
  return (
    <PermissionGuard applicationKey="fleet">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Fuhrparkverwaltung</h1>
        {/* Content */}
      </div>
    </PermissionGuard>
  )
}
```

**4. Deployment & Test:**
```bash
git add . && git commit -m "Add fleet management module" && git push
ssh root@bereifung24.de "cd /var/www/bereifung24 && git pull && npm run build && pm2 restart bereifung24"
```

---

## 🔒 Wie das Permission-System funktioniert

### Architektur-Übersicht:

```
User Request → Middleware (Edge) → Permission Check → Page/API
                    ↓
              Database Query
         (B24EmployeeApplication)
                    ↓
            Allow or Redirect
```

### Was die Middleware macht:

1. **Request abfangen** (auf Edge-Ebene, BEVOR die Seite lädt)
2. **User identifizieren** (aus NextAuth JWT Token)
3. **Application Key bestimmen** (aus URL via `ROUTE_TO_APPLICATION_MAP`)
4. **Permission prüfen** (API-Call zu `/api/employee/has-application`)
5. **Entscheidung:**
   - ✅ **Hat Berechtigung** → Request durchlassen
   - ❌ **Keine Berechtigung** → Redirect zu `/mitarbeiter?error=no-permission&module=X`
   - 👑 **ADMIN-Rolle** → Immer durchlassen (Bypass)

### Betroffene URLs:

- `/admin/*` - Alle Admin-Seiten
- `/mitarbeiter/*` - Nur Admin-Module (nicht persönliche Seiten wie Profil, Urlaub, etc.)
- `/api/admin/*` - Alle Admin-API-Endpoints
- `/sales` - Spezieller Sales-Bereich

### Ausnahmen (KEINE Permission-Prüfung):

- `/mitarbeiter/profil` - Persönliches Profil
- `/mitarbeiter/urlaub` - Urlaubsanträge
- `/mitarbeiter/spesen` - Spesenabrechnungen
- `/mitarbeiter/krankmeldung` - Krankmeldungen
- `/mitarbeiter/zeit` - Zeiterfassung
- `/mitarbeiter/fahrtenbuch` - Fahrtenbuch
- `/mitarbeiter/dokumente` - Dokumente
- `/mitarbeiter/news` - News-Board
- `/mitarbeiter/aufgaben` - Aufgaben
- `/mitarbeiter/wiki` - Wissensdatenbank
- `/mitarbeiter/files` - Dateiverwaltung
- `/mitarbeiter/email` - E-Mail-Interface

## 🚨 Troubleshooting

### Problem: "Seite lädt nicht nach Middleware-Änderung"
**Lösung:** Middleware erfordert kompletten Rebuild!
```bash
npm run build
pm2 restart bereifung24
```

### Problem: "Dashboard zeigt Kachel nicht an"
**Ursachen:**
1. `isActive: false` in Datenbank
2. Keine Berechtigung zugewiesen
3. Cache-Problem (Hard-Reload mit Ctrl+Shift+R)

### Problem: "403 bei API-Calls"
**Prüfen:**
1. Ist Route in `API_ROUTE_TO_APPLICATION_MAP` eingetragen?
2. Hat User die Berechtigung in der Datenbank?
3. Ist Session noch gültig?

### Problem: "ADMIN wird auch blockiert"
**Ursache:** User.role ist nicht `'ADMIN'` in Datenbank
**Lösung:** 
```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@bereifung24.de';
```

---

**Letzte Aktualisierung:** 13. Januar 2026  
**Dokumentiert von:** GitHub Copilot Assistant
