# TyreSystem Integration - Setup Anleitung

## Phase 1: Foundation ✅

### 1. Datenbankmodelle hinzugefügt

**WorkshopSupplier**
- Verschlüsselte Zugangsdaten (AES-256)
- Auto-Order Checkbox
- Priorität für Multi-Supplier
- API-Status-Tracking

**TirePricingBySize**
- Preiskalkulation pro Zollgröße (13-23")
- Fester Aufschlag + Prozentualer Aufschlag
- Separate Einstellungen für PKW/Motorrad

### 2. Services implementiert

✅ **Encryption Service** (`lib/crypto/encryption.ts`)
- AES-256-CBC Verschlüsselung
- IV (Initialization Vector) für zusätzliche Sicherheit

✅ **Redis Cache Service** (`lib/redis/cache.ts`)
- Cache für Artikelanfragen (15 Min TTL)
- Cache für Reifensuche (10 Min TTL)
- API-Call-Counter für Rate Limiting

✅ **WorkshopSupplier Service** (`lib/services/workshopSupplierService.ts`)
- CRUD für Lieferanten
- Verschlüsselte Speicherung/Abruf
- Auto-Order Check

✅ **API Endpoint** (`app/api/workshop/suppliers/route.ts`)
- GET: Alle Lieferanten abrufen
- POST: Lieferant erstellen/updaten
- PATCH: Einstellungen ändern
- DELETE: Lieferant löschen

---

## Migration auf Server durchführen

### SSH zum Server verbinden:
```bash
ssh -i C:\Users\zdene\.ssh\bereifung24_hetzner root@167.235.24.110
```

### Migration ausführen:
```bash
cd /var/www/bereifung24
npx prisma migrate dev --name add_workshop_suppliers_and_tire_pricing
```

### Redis installieren (falls noch nicht vorhanden):
```bash
# Ubuntu/Debian
apt-get update
apt-get install redis-server

# Redis starten
systemctl start redis
systemctl enable redis

# Status prüfen
systemctl status redis
redis-cli ping  # Sollte "PONG" zurückgeben
```

### .env auf Server updaten:
```bash
nano /var/www/bereifung24/.env
```

Hinzufügen:
```env
# Redis Cache (for TyreSystem API)
REDIS_URL="redis://localhost:6379"
```

### App neu starten:
```bash
npm run build
pm2 restart bereifung24
```

---

## Nächste Schritte

### Phase 2: TyreSystem API Integration (4-5h)
- [ ] TyreSystem API Service erstellen
- [ ] Inquiry Endpoint (Artikelabfrage)
- [ ] Order Endpoint (Bestellung)
- [ ] Fehlerbehandlung & Retries
- [ ] Credentials von Werkstatt verwenden

### Phase 3: Admin UI (2-3h)
- [ ] Werkstatt-Einstellungen → Lieferanten-Tab
- [ ] TyreSystem Zugangsdaten-Formular
- [ ] Checkbox "Automatisch bestellen"
- [ ] Preise pro Zollgröße verwalten
- [ ] API-Verbindung testen

### Phase 4: Customer Flow (3-4h)
- [ ] Reifensuche im Buchungsablauf
- [ ] TyreSystem API aufrufen
- [ ] Preise mit Werkstatt-Aufschlag anzeigen
- [ ] Lagerbestand-Indikator
- [ ] Artikel-Auswahl → Buchung

### Phase 5: Automation (2-3h)
- [ ] Bei Buchung: Auto-Order wenn aktiviert
- [ ] Status-Tracking (bestellt/geliefert)
- [ ] Benachrichtigungen
- [ ] Fehlerbehandlung

---

## Test-Checklist

### Verschlüsselung testen:
```bash
# In Node.js REPL auf Server
node
> const { encrypt, decrypt } = require('./lib/crypto/encryption.ts')
> const test = encrypt('testpassword')
> decrypt(test.encrypted, test.iv)
# Sollte 'testpassword' zurückgeben
```

### Redis testen:
```bash
redis-cli
> SET test "hello"
> GET test
> DEL test
```

### API testen (nach Migration):
```bash
# Test API (ohne Credentials - sollte Warnung geben)
curl http://localhost:3000/api/admin/tyresystem/test?action=inquiry
```

---

## Sicherheitshinweise

⚠️ **ENCRYPTION_KEY ist bereits in .env** vorhanden
⚠️ **NIEMALS** Credentials im Git committen
⚠️ **Redis** sollte mit Passwort gesichert werden (Production)
⚠️ **TyreSystem Credentials** nur von Werkstatt-Admin eintragbar

---

## Kosten-Kalkulation

**Redis Hosting:**
- Lokal: Kostenlos
- Managed (Redis Cloud): ~10€/Monat für Basic
- Hetzner Redis: Selbst hosten, keine Extra-Kosten

**TyreSystem API:**
- Rate Limits unklar → Bei RSU GmbH erfragen
- Kosten pro Request? → Bei RSU GmbH erfragen

---

Bereit für Phase 2? 🚀
