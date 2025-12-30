# 🎯 Affiliate/Influencer Management System - Implementierungsplan

## 📋 Übersicht

Ein vollständiges Affiliate-System für Bereifung24, das Influencern ermöglicht, über personalisierte Links Provisionen zu verdienen.

---

## 🏗️ Datenbank-Schema (ERSTELLT ✓)

### Modelle:

1. **Influencer** - Haupttabelle für Influencer/Affiliates
2. **AffiliateClick** - Tracking aller Klicks auf Affiliate-Links
3. **AffiliateConversion** - Tracking von Conversions (Views, Registrierungen, Angebote)
4. **AffiliatePayment** - Zahlungsabwicklung und Historie

### Relations hinzugefügt:
- Customer ↔ AffiliateConversion
- TireRequest ↔ AffiliateConversion
- Offer ↔ AffiliateConversion

---

## 💰 Provisionsmodell - Plattform-spezifische Empfehlungen

### **TikTok**
- **Zielgruppe**: 16-24 Jahre, geringe Kaufkraft
- **Conversion Rate**: 0.5-1.5%
- **Empfohlene Provisionen**:
  - CPM (pro 1000 Views): €2-3
  - CPA (pro Registrierung): €8-12
  - Pro akzeptiertem Angebot: €15-20

**Info-Text für Admin:**
> "TikTok hat die jüngste Zielgruppe mit hoher Reichweite aber geringer Kaufkraft. Die Plattform eignet sich für Brand Awareness, weniger für direkte Conversions. Empfehlung: Niedrigere Provisionen, dafür größeres Volumen."

---

### **Instagram**
- **Zielgruppe**: 18-34 Jahre, mittlere bis hohe Kaufkraft
- **Conversion Rate**: 1.5-3%
- **Empfohlene Provisionen**:
  - CPM: €3-5
  - CPA: €15-25
  - Pro akzeptiertem Angebot**: €25-35

**Info-Text für Admin:**
> "Instagram ist ideal für visuelle Auto-Services. Die Nutzer sind kaufkräftiger und treffen Entscheidungen schneller. Besonders Stories und Reels mit direktem Call-to-Action funktionieren gut."

---

### **YouTube**
- **Zielgruppe**: 25-54 Jahre, höchste Kaufkraft
- **Conversion Rate**: 3-6%
- **Empfohlene Provisionen**:
  - CPM: €5-8
  - CPA: €25-40
  - Pro akzeptiertem Angebot: €40-60

**Info-Text für Admin:**
> "YouTube hat die beste Conversion-Rate im Affiliate-Marketing. Lange Videos schaffen Vertrauen und die Zielgruppe ist älter und zahlungskräftiger. Besonders Tutorial-Videos und Reviews funktionieren hervorragend."

---

### **Facebook**
- **Zielgruppe**: 30-65 Jahre, hohe Kaufkraft
- **Conversion Rate**: 2-4%
- **Empfohlene Provisionen**:
  - CPM: €3-6
  - CPA: €18-30
  - Pro akzeptiertem Angebot: €30-45

**Info-Text für Admin:**
> "Facebook erreicht eine ältere, kaufkräftige Zielgruppe. Die Plattform eignet sich besonders für lokale Werkstätten und Community-Building. Gruppen und Marketplace-Posts haben gute Conversion-Rates."

---

## 🔧 Technische Implementierung

### Phase 1: Backend & Middleware ⏳
**Dateien zu erstellen:**

1. **`middleware/affiliateTracking.ts`** - Cookie-basiertes Tracking
2. **`lib/affiliateTracker.ts`** - Core Tracking-Logik
3. **`lib/affiliateCalculator.ts`** - Provisionsberechnung

**API Routes:**
```
/api/affiliate/track          - Click Tracking (GET)
/api/affiliate/convert        - Conversion Tracking (POST)
/api/admin/influencers        - CRUD für Influencer
/api/admin/influencers/stats  - Dashboard Statistiken
/api/admin/influencers/payments - Zahlungsabwicklung
/api/influencer/auth/register - Influencer Registrierung
/api/influencer/auth/login    - Influencer Login
/api/influencer/stats         - Eigene Statistiken
/api/influencer/profile       - Profilverwaltung
```

---

### Phase 2: Admin-Bereich 📊
**Neue Admin-Seite:** `/admin/influencer-management`

**Features:**
- ✅ Influencer anlegen (Email + Plattform)
- ✅ Affiliate-Code generieren (unique)
- ✅ Provisionen pro Influencer festlegen
- ✅ Zeitliche Begrenzung setzen
- ✅ Statistiken Dashboard
  - Top Influencer nach Umsatz
  - Conversion-Rates pro Plattform
  - Pending Payments
- ✅ Zahlungsabwicklung
  - Download CSV für Buchhaltung
  - Status: PENDING → APPROVED → PAID

**Komponenten:**
```
app/admin/influencer-management/
  ├── page.tsx                    - Hauptübersicht
  ├── create/page.tsx             - Neuer Influencer
  ├── [id]/page.tsx               - Influencer Details
  ├── [id]/edit/page.tsx          - Bearbeiten
  ├── payments/page.tsx           - Zahlungsübersicht
  ├── components/
  │   ├── InfluencerList.tsx
  │   ├── InfluencerStats.tsx
  │   ├── PaymentCalculator.tsx
  │   ├── PlatformRecommendations.tsx
  │   └── DownloadCSV.tsx
```

---

### Phase 3: Influencer Portal 🎬
**Neue Route:** `/influencer/*`

**Features:**
- ✅ Registrierung via Token-Link
- ✅ Login/Logout
- ✅ Dashboard mit Statistiken
  - Klicks (heute, diese Woche, dieser Monat)
  - Registrierungen
  - Akzeptierte Angebote
  - Verdiente Provision
- ✅ Analytics mit Zeitfilter
- ✅ Profilverwaltung
  - Zahlungsmethode (PayPal/Überweisung)
  - Steuerdaten (Privat/Gewerbe)
  - Bankverbindung/PayPal-Email
- ✅ Affiliate-Link anzeigen + Kopieren
- ✅ Zahlungshistorie

**Komponenten:**
```
app/influencer/
  ├── layout.tsx                  - Influencer Layout
  ├── auth/
  │   ├── register/page.tsx       - Registrierung
  │   └── login/page.tsx          - Login
  ├── dashboard/page.tsx          - Haupt-Dashboard
  ├── analytics/page.tsx          - Detaillierte Analytics
  ├── profile/page.tsx            - Profil & Zahlungsdaten
  ├── payments/page.tsx           - Zahlungshistorie
  ├── components/
  │   ├── StatsCards.tsx
  │   ├── ConversionChart.tsx
  │   ├── AffiliateLink.tsx
  │   └── PaymentForm.tsx
```

---

### Phase 4: Tracking Integration 🔍
**Zu modifizierende Dateien:**

1. **`middleware.ts`** - Affiliate Cookie setzen
2. **`app/page.tsx`** - Landing Page Tracking
3. **`app/api/auth/register/customer/route.ts`** - Registration Conversion
4. **`app/api/offers/[id]/accept/route.ts`** - Offer Acceptance Conversion

**Tracking-Flow:**
```
1. User klickt auf bereifung24.de?ref=PETER24
2. Middleware setzt Cookie: affiliate_ref=PETER24 (90 Tage)
3. AffiliateClick wird erstellt mit:
   - influencerId, ipAddress, userAgent, cookieId
4. Bei Registration:
   - Check Cookie → Create AffiliateConversion (REGISTRATION)
5. Bei erstem akzeptierten Angebot:
   - Check Cookie → Create AffiliateConversion (ACCEPTED_OFFER)
6. Views werden alle 1000 Klicks summiert:
   - Create AffiliateConversion (PAGE_VIEW)
```

---

## 🔐 Sicherheit & Best Practices

### Attribution Window:
- **Cookie-Laufzeit**: 90 Tage (Branchenstandard)
- **First-Click Attribution**: Erster Affiliate bekommt die Provision
- **Fraud Prevention**: 
  - IP-Tracking gegen Self-Clicking
  - Max 1 Click pro IP/24h
  - Conversion nur bei verschiedener IP

### Datenschutz:
- DSGVO-konform: Cookie Consent erforderlich
- IP-Adressen anonymisiert speichern (letzte 8 Bit maskiert)
- User Agent nur für Analytics, nicht für Tracking

---

## 📊 Reporting & Analytics

### Admin-Dashboard:
- **Top 10 Influencer** (nach Umsatz)
- **Platform Performance** (Conversion-Rates pro Plattform)
- **Pending Payments** (offene Beträge)
- **Monthly Overview** (Trend-Charts)

### Influencer-Dashboard:
- **Real-time Stats**:
  - Heute: Klicks, Conversions, Verdienst
  - Diese Woche/Monat: Trends
- **Conversion Funnel**:
  - Klicks → Registrierungen → Angebote
- **Payment Status**: PENDING, APPROVED, PAID

---

## 💳 Zahlungsabwicklung

### Monatlicher Zyklus:
1. **1. des Monats**: System erstellt AffiliatePayment-Einträge
2. **Bis 5. des Monats**: Admin reviewed & approved
3. **Bis 15. des Monats**: Zahlungen ausgeführt
4. **Status-Update**: PENDING → APPROVED → PAID

### CSV-Export für Buchhaltung:
```csv
Influencer,Plattform,Clicks,Registrierungen,Angebote,Betrag,Zahlungsmethode,IBAN/PayPal,Periode
Max Mustermann,YouTube,15000,45,12,€720.00,BANK_TRANSFER,DE89370400440532013000,01.12.2025-31.12.2025
```

---

## 🚀 Deployment-Schritte

### 1. Datenbank Migration:
```bash
npx prisma migrate dev --name add_affiliate_system
npx prisma generate
```

### 2. Admin-Zugriff erweitern:
- B24Employee: Neue Permission "MANAGE_AFFILIATES"
- AdminAccessibleResource: "influencer-management"

### 3. Middleware aktivieren:
- Affiliate-Tracking in `middleware.ts` einbinden

### 4. Testing:
- Test Affiliate-Link: `bereifung24.de?ref=TEST123`
- Test Registration Conversion
- Test Offer Acceptance Conversion
- Test Payment Calculation

---

## 📈 Success Metrics (KPIs)

### Tracking:
- **Click-Through-Rate (CTR)**: Klicks / Impressions
- **Conversion Rate**: Registrierungen / Klicks
- **Offer Acceptance Rate**: Angebote / Registrierungen
- **Return on Investment (ROI)**: Umsatz / Provisionen

### Benchmarks:
- CTR > 2% = Gut
- Conversion > 1.5% = Gut  
- Offer Acceptance > 10% = Gut
- ROI > 5:1 = Profitabel

---

## 🎨 UI/UX Überlegungen

### Affiliate-Link Generierung:
- **Format**: `bereifung24.de?ref=CODE`
- **Alternativ**: `bereifung24.de/ref/CODE` (SEO-freundlicher)

### Admin UI:
- Kachel im Admin-Bereich: "🎬 Influencer Management"
- Dashboard mit Charts (Recharts/Chart.js)
- Plattform-Icons (TikTok, Instagram, YouTube, Facebook)

### Influencer Portal:
- Eigenes Branding/Logo
- Dark Mode Support
- Mobile-optimiert
- Dashboard mit Echtzeit-Updates

---

## 🔄 Nächste Schritte

1. ✅ **Datenbank-Schema erstellt** (DONE)
2. ⏳ **Migration ausführen** (NEXT)
3. ⏳ **Tracking-Middleware implementieren**
4. ⏳ **Admin-Bereich erstellen**
5. ⏳ **Influencer-Portal erstellen**
6. ⏳ **Email-Templates für Einladungen**
7. ⏳ **Testing & Deployment**

---

## 💡 Zusätzliche Features (Optional)

- **Referral Tiers**: Mehrstufige Provisionen (Affiliate wirbt Affiliate)
- **Bonus-System**: Extra-Provision bei X Conversions/Monat
- **Custom Landing Pages**: Influencer-spezifische Landing Pages
- **A/B Testing**: Verschiedene Affiliate-Links für Performance-Tests
- **Fraud Detection**: Machine Learning für Click-Fraud-Erkennung
- **API Access**: Influencer können via API ihre Stats abrufen
- **Webhooks**: Benachrichtigung bei neuen Conversions
- **White-Label**: Influencer bekommen eigene Subdomain

---

**Status**: Schema fertig ✅ | Bereit für Implementierung ⏳
