# Affiliate Tracking Diagnostics for TURBOGA53

## Problem
Sie haben den Link `https://www.bereifung24.de?ref=TURBOGA53` besucht und sich registriert, aber:
- ❌ Keine Klicks wurden gezählt
- ❌ Keine Registrierung wurde gezählt  
- ❌ API Error: `/api/influencer/stats` gibt 500-Fehler

## Root Cause Analysis

### 1. Stats API Error (500)
**File:** `app/api/influencer/stats/route.ts`

**Problem:** Sie sind auf der Influencer-Dashboard-Seite (`/influencer/dashboard`), aber das Cookie `influencer_token` ist nicht gesetzt oder ungültig.

**Lösung:**
- Sie müssen sich als Influencer einloggen unter `/influencer/login`
- Oder der Influencer-Code `TURBOGA53` muss existieren und aktiv sein

### 2. Tracking Flow

#### Schritt 1: Click Tracking
**Component:** `components/AffiliateTracker.tsx`
- Liest `?ref=TURBOGA53` aus der URL
- Setzt Cookie: `b24_affiliate_ref=TURBOGA53`
- Ruft API auf: `/api/affiliate/track?ref=TURBOGA53&cookieId=xxx`

**API:** `app/api/affiliate/track/route.ts`
- Sucht Influencer mit Code `TURBOGA53`
- Prüft ob aktiv
- Erstellt AffiliateClick record
- Erstellt AffiliateConversion (PAGE_VIEW) record

**Mögliche Fehler:**
- ✅ Influencer existiert nicht in DB
- ✅ Influencer ist inaktiv
- ✅ Influencer ist zeitlich begrenzt und außerhalb der Zeitspanne

#### Schritt 2: Registration Tracking
**API:** `app/api/auth/register/customer/route.ts` (Zeile 32)
- Liest Cookie: `b24_affiliate_ref`
- Nach erfolgreicher Registrierung:
  - Sucht Influencer mit Code
  - Erstellt AffiliateConversion (REGISTRATION) record

## Test Script

Um das Problem zu testen, müssen wir prüfen:

1. **Existiert der Influencer TURBOGA53?**
   ```sql
   SELECT * FROM "Influencer" WHERE code = 'TURBOGA53';
   ```

2. **Ist er aktiv?**
   - `isActive = true`
   - Wenn `isUnlimited = false`, dann prüfe `activeFrom` und `activeUntil`

3. **Gibt es Clicks?**
   ```sql
   SELECT COUNT(*) FROM "AffiliateClick" 
   WHERE "influencerId" = (SELECT id FROM "Influencer" WHERE code = 'TURBOGA53');
   ```

4. **Gibt es Conversions?**
   ```sql
   SELECT COUNT(*), type FROM "AffiliateConversion" 
   WHERE "influencerId" = (SELECT id FROM "Influencer" WHERE code = 'TURBOGA53')
   GROUP BY type;
   ```

## Recommended Actions

### Immediate Fix

1. **Prüfen Sie den Influencer in der Datenbank:**
   - Öffnen Sie Prisma Studio: `npx prisma studio`
   - Gehen Sie zur `Influencer` Tabelle
   - Suchen Sie nach Code `TURBOGA53`
   - Prüfen Sie:
     - `isActive` sollte `true` sein
     - `isUnlimited` sollte `true` sein (oder Datum-Range prüfen)

2. **Falls Influencer nicht existiert, erstellen Sie ihn:**
   ```javascript
   // create-influencer-turboga53.js
   const { PrismaClient } = require('@prisma/client')
   const prisma = new PrismaClient()
   
   async function createInfluencer() {
     const influencer = await prisma.influencer.create({
       data: {
         code: 'TURBOGA53',
         email: 'turboga53@example.com',
         password: 'hashed_password',  // Use bcrypt
         isActive: true,
         isUnlimited: true,
         commissionPer1000Views: 1000,  // 1€ per 1000 views
         commissionPerRegistration: 500,  // 0.50€ per registration
         commissionPerAcceptedOffer: 2000  // 2€ per accepted offer
       }
     })
     console.log('Created:', influencer)
   }
   
   createInfluencer()
   ```

3. **Testen Sie das Click-Tracking:**
   - Öffnen Sie: `http://localhost:3000?ref=TURBOGA53`
   - Öffnen Sie Browser DevTools → Console
   - Sie sollten sehen: `[AFFILIATE] Click tracked: { status: 'tracked' }`
   - Öffnen Sie DevTools → Application → Cookies
   - Prüfen Sie ob Cookie `b24_affiliate_ref` gesetzt ist

4. **Testen Sie das Registration-Tracking:**
   - Mit gesetztem Cookie, registrieren Sie einen neuen Kunden
   - Nach erfolgreicher Registrierung sollte eine Conversion erstellt werden
   - Prüfen Sie in der DB: `SELECT * FROM "AffiliateConversion" WHERE type = 'REGISTRATION'`

### Long-term Fix

1. **Besseres Error Handling im Stats API:**
   - Zeigen Sie eine freundliche Fehlermeldung wenn kein Token vorhanden
   - Redirect zum Login wenn nicht authentifiziert

2. **Tracking Monitoring:**
   - Fügen Sie Logging hinzu für fehlgeschlagene Tracking-Versuche
   - Senden Sie Alerts wenn Tracking fails

3. **Testing:**
   - Schreiben Sie E2E Tests für den Affiliate Flow
   - Test mit verschiedenen Szenarien (inaktiver Code, abgelaufener Code, etc.)

## Console Commands for Testing

### Test in Browser Console (Client-Side)
```javascript
// 1. Check if cookie is set
document.cookie.split('; ').find(c => c.startsWith('b24_affiliate_ref'))

// 2. Manually test tracking
fetch('/api/affiliate/track?ref=TURBOGA53&cookieId=test123')
  .then(r => r.json())
  .then(console.log)

// 3. Check conversion tracking  
fetch('/api/influencer/stats', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

### Test with cURL (Server-Side)
```bash
# Test click tracking
curl "http://localhost:3000/api/affiliate/track?ref=TURBOGA53&cookieId=test123"

# Test stats (requires influencer_token cookie)
curl "http://localhost:3000/api/influencer/stats" \
  -H "Cookie: influencer_token=YOUR_TOKEN"
```

## Expected Behavior

### Scenario: New User visits with ref code and registers

1. ✅ User visits: `https://www.bereifung24.de?ref=TURBOGA53`
2. ✅ Cookie `b24_affiliate_ref` is set (30 days expiry)
3. ✅ AffiliateClick record is created
4. ✅ AffiliateConversion (PAGE_VIEW) is created
5. ✅ User navigates to `/register/customer`
6. ✅ User fills form and submits
7. ✅ Cookie is read from request
8. ✅ AffiliateConversion (REGISTRATION) is created
9. ✅ Influencer can see stats at `/influencer/dashboard`

## Files Involved

- `components/AffiliateTracker.tsx` - Client-side cookie & tracking
- `app/api/affiliate/track/route.ts` - Click tracking endpoint
- `app/api/auth/register/customer/route.ts` - Registration with conversion tracking
- `app/api/influencer/stats/route.ts` - Stats dashboard API
- `lib/affiliateTracking.ts` - Helper functions
- `prisma/schema.prisma` - Database schema

## Database Tables

- `Influencer` - Influencer accounts
- `AffiliateClick` - Click tracking
- `AffiliateConversion` - Conversion tracking (PAGE_VIEW, REGISTRATION, ACCEPTED_OFFER)
