# Bereifung24 – Programmatic SEO Dokumentation

> Stand: März 2026 | Domain: `https://www.bereifung24.de`

---

## Übersicht

| Kategorie | Anzahl Seiten | Status |
|-----------|--------------|--------|
| Stadt-Seiten (Werkstatt-Registrierung) | ~100 Städte | ✅ Statisch generiert |
| Reifengrößen-Seiten | 46 Größen | ✅ Statisch generiert |
| Service-Seiten | 6 Dienste | ✅ Statisch |
| Blog/Ratgeber | Dynamisch (DB) | ✅ Revalidate 5min |
| Workshop-Landing-Pages | Dynamisch (DB) | ✅ Pro Werkstatt |
| Workshop-Detailseiten | Dynamisch (DB) | ✅ Einzelseiten |
| **Gesamt geschätzt** | **~160+ Seiten** | |

---

## 1. Sitemaps

### 1.1 Sitemap-Dateien

| Datei | Route | Inhalt |
|-------|-------|--------|
| [app/sitemap-werkstatt.xml/route.ts](app/sitemap-werkstatt.xml/route.ts) | `/sitemap-werkstatt.xml` | Werkstatt-Partner-Städte + `/werkstatt` |
| [app/sitemap-reifen.xml/route.ts](app/sitemap-reifen.xml/route.ts) | `/sitemap-reifen.xml` | Reifengrößen-Seiten + `/reifen` |
| [app/sitemap-blog.xml/route.ts](app/sitemap-blog.xml/route.ts) | `/sitemap-blog.xml` | Blog-Beiträge + Kategorien |
| [app/robots.txt/route.ts](app/robots.txt/route.ts) | `/robots.txt` | Alle Sitemaps referenziert |

### 1.2 Robots.txt

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/admin/
Disallow: /employee/
Disallow: /api/auth/

Sitemap: https://www.bereifung24.de/sitemap.xml
Sitemap: https://www.bereifung24.de/sitemap-blog.xml
Sitemap: https://www.bereifung24.de/sitemap-werkstatt.xml
Sitemap: https://www.bereifung24.de/sitemap-reifen.xml
```

- **Cache**: `s-maxage=86400` (24h)
- **Sitemaps Cache**: `s-maxage=3600` (1h)

---

## 2. Stadt-Seiten (Werkstatt-Registrierung)

### 2.1 Technisches Setup

| Eigenschaft | Wert |
|-------------|------|
| **Page** | [app/werkstatt-werden/[city]/page.tsx](app/werkstatt-werden/[city]/page.tsx) |
| **Daten** | [lib/seo/german-cities.ts](lib/seo/german-cities.ts) |
| **URL-Muster** | `/werkstatt-werden/{stadt-slug}` |
| **Generierung** | `generateStaticParams()` – vollständig statisch |
| **Revalidate** | `false` (kein Revalidate, rein statisch) |

### 2.2 Alle 100 Städte nach Bundesland

#### Baden-Württemberg (BW) – 30+ Städte
Stuttgart, Karlsruhe, Mannheim, Freiburg, Heidelberg, Ulm, Heilbronn, Pforzheim, Reutlingen, Esslingen, Ludwigsburg, Tübingen, Konstanz, Sindelfingen, Böblingen, Göppingen, Waiblingen, Villingen-Schwenningen, Offenburg, Aalen, u.v.m.

> Daten auch separat in [lib/seo/bw-cities.ts](lib/seo/bw-cities.ts)

#### Bayern (BY) – 13 Städte
München, Nürnberg, Augsburg, Regensburg, Ingolstadt, Würzburg, Fürth, Erlangen, Bamberg, Rosenheim, Landshut, Kempten

#### Nordrhein-Westfalen (NW) – 16 Städte
Köln, Düsseldorf, Dortmund, Essen, Duisburg, Bochum, Wuppertal, Bielefeld, Bonn, Münster, Aachen, Krefeld, Mönchengladbach, Leverkusen, Paderborn

#### Niedersachsen (NI) – 8 Städte
Hannover, Braunschweig, Oldenburg, Osnabrück, Wolfsburg, Göttingen, Hildesheim, Salzgitter

#### Hessen (HE) – 8 Städte
Frankfurt am Main, Wiesbaden, Kassel, Darmstadt, Offenbach am Main, Gießen, Marburg, Fulda

#### Sachsen (SN) – 5 Städte
Leipzig, Dresden, Chemnitz, Zwickau, Plauen

#### Rheinland-Pfalz (RP) – 6 Städte
Mainz, Ludwigshafen, Koblenz, Trier, Kaiserslautern, Worms

#### Schleswig-Holstein (SH) – 4 Städte
Kiel, Lübeck, Flensburg, Neumünster

#### Thüringen (TH) – 4 Städte
Erfurt, Jena, Gera, Weimar

#### Brandenburg (BB) – 4 Städte
Potsdam, Cottbus, Brandenburg an der Havel, Frankfurt (Oder)

#### Sachsen-Anhalt (ST) – 3 Städte
Halle (Saale), Magdeburg, Dessau-Roßlau

#### Mecklenburg-Vorpommern (MV) – 4 Städte
Rostock, Schwerin, Neubrandenburg, Stralsund

#### Saarland (SL) – 2 Städte
Saarbrücken, Neunkirchen

#### Berlin (BE) – 1 Stadt
Berlin

#### Hamburg (HH) – 1 Stadt
Hamburg

#### Bremen (HB) – 2 Städte
Bremen, Bremerhaven

### 2.3 Stadt-Datenstruktur

```typescript
interface CityData {
  slug: string           // URL-Slug (z.B. "muenchen")
  name: string           // Anzeigename (z.B. "München")
  state: string          // Bundesland
  stateShort: string     // "BY", "BW", etc.
  region: string         // Region (z.B. "Oberbayern")
  population: number     // Einwohnerzahl
  postalCodes: string[]  // PLZ-Liste
  nearbyCity: string     // Nahegelegene Städte
  uniqueFact: string     // Lokaler Fakt für SEO-Text
  cityType: string       // "capital" | "auto" | "metro" | "university" | "industrial" | "default"
}
```

### 2.4 Meta-Tags (Stadt-Seiten)

**Title-Rotation** (4 Varianten, hash-basiert pro Stadt):
1. `Werkstatt registrieren {Stadt} | Bereifung24 – Kostenlose Werkstatt-Website`
2. `KFZ-Werkstatt {Stadt} | Bereifung24 – Eigene Website & Online-Buchung`
3. `Werkstatt-Partner {Stadt} | Bereifung24 – Jetzt kostenlos starten`
4. `Reifenservice {Stadt} | Bereifung24 – Gratis Werkstatt-Website`

**Description-Rotation** (4 Varianten):
- Enthält: Stadtname, geschätzte Autofahrer-Zahl, Features (Buchungssystem, Website, Bestellungen)

**Keywords pro Stadt:**
```
werkstatt registrieren {stadt}, kfz werkstatt {stadt}, reifenservice {stadt},
werkstatt kunden gewinnen {stadt}, online terminbuchung werkstatt {stadt},
werkstatt plattform {stadt}
```

### 2.5 Content-Struktur (Stadt-Seiten)

- **H1**: `Werkstatt registrieren in {Stadt}`
- **Intro-Text**: Variiert nach `cityType` (Hauptstadt, Auto-Hub, Metropole, Uni-Stadt, Industrie, Default)
- **Lokale Fakten**: 4 stadtspezifische Fakten (Werkstätten in Region, Autofahrer, Nachbarstädte, Einzigartiges)
- **Schema.org**: `WebPage` + `Service` mit `LocalBusiness`

---

## 3. Reifengrößen-Seiten

### 3.1 Technisches Setup

| Eigenschaft | Wert |
|-------------|------|
| **Page** | [app/reifen/[size]/page.tsx](app/reifen/[size]/page.tsx) |
| **Daten** | [lib/seo/tire-sizes.ts](lib/seo/tire-sizes.ts) |
| **URL-Muster** | `/reifen/{breite}-{querschnitt}-r{felge}` |
| **Generierung** | `generateStaticParams()` – vollständig statisch |

### 3.2 Alle 46 Reifengrößen

#### 🚗 Kleinwagen
| Größe | Slug | Suchvolumen/Monat |
|-------|------|-------------------|
| 155/65 R14 | `155-65-r14` | 4.800 |
| 165/70 R14 | `165-70-r14` | 3.500 |
| 175/65 R14 | `175-65-r14` | 8.200 |
| 175/65 R15 | `175-65-r15` | 3.200 |

#### 🚙 Kompaktklasse
| Größe | Slug | Suchvolumen/Monat |
|-------|------|-------------------|
| 185/55 R15 | `185-55-r15` | 4.500 |
| 185/60 R15 | `185-60-r15` | 6.800 |
| 185/65 R15 | `185-65-r15` | 9.500 |
| 195/55 R16 | `195-55-r16` | 7.500 |
| 195/60 R16 | `195-60-r16` | 3.800 |
| 195/65 R15 | `195-65-r15` | 18.000 |

#### 🏎️ Mittelklasse
| Größe | Slug | Suchvolumen/Monat |
|-------|------|-------------------|
| **205/55 R16** | `205-55-r16` | **40.000** ⭐ Top |
| 205/45 R17 | `205-45-r17` | 5.000 |
| 205/55 R17 | `205-55-r17` | 6.500 |
| 205/60 R16 | `205-60-r16` | 12.000 |
| 215/45 R17 | `215-45-r17` | 4.200 |
| 215/55 R17 | `215-55-r17` | 9.000 |
| 215/60 R17 | `215-60-r17` | 7.000 |
| 215/65 R16 | `215-65-r16` | 7.200 |

#### ✨ Oberklasse / Performance
| Größe | Slug | Suchvolumen/Monat |
|-------|------|-------------------|
| 225/40 R18 | `225-40-r18` | 15.000 |
| **225/45 R17** | `225-45-r17` | **22.000** |
| 225/45 R18 | `225-45-r18` | 10.000 |
| 225/50 R17 | `225-50-r17` | 8.000 |
| 225/55 R17 | `225-55-r17` | 6.000 |
| 225/55 R18 | `225-55-r18` | 5.500 |
| 225/65 R17 | `225-65-r17` | 6.500 |

#### 🏁 Sportwagen / Performance
| Größe | Slug | Suchvolumen/Monat |
|-------|------|-------------------|
| 235/40 R18 | `235-40-r18` | 5.000 |
| 235/40 R19 | `235-40-r19` | 4.000 |
| 235/45 R17 | `235-45-r17` | 5.500 |
| 235/45 R18 | `235-45-r18` | 7.500 |
| 235/50 R18 | `235-50-r18` | 5.000 |
| 245/40 R18 | `245-40-r18` | 5.500 |
| 245/40 R19 | `245-40-r19` | 4.500 |
| 245/45 R18 | `245-45-r18` | 7.000 |
| 245/45 R19 | `245-45-r19` | 5.000 |
| 245/45 R20 | `245-45-r20` | 4.000 |
| 255/35 R19 | `255-35-r19` | 5.200 |
| 255/40 R19 | `255-40-r19` | 4.200 |
| 255/45 R20 | `255-45-r20` | 3.800 |
| 255/50 R19 | `255-50-r19` | 4.500 |
| 255/55 R18 | `255-55-r18` | 3.500 |

#### 🚜 SUV / Geländewagen
| Größe | Slug | Suchvolumen/Monat |
|-------|------|-------------------|
| 235/55 R17 | `235-55-r17` | 4.500 |
| 235/55 R18 | `235-55-r18` | 5.500 |
| 235/55 R19 | `235-55-r19` | 8.000 |
| 235/60 R18 | `235-60-r18` | 5.000 |
| 265/60 R18 | `265-60-r18` | 3.200 |

#### 🚐 Transporter / Van (C-Kennzeichnung)
| Größe | Slug | Suchvolumen/Monat |
|-------|------|-------------------|
| 195/65 R16C | `195-65-r16c` | 5.500 |
| 205/65 R16C | `205-65-r16c` | 4.500 |
| 215/65 R16C | `215-65-r16c` | 3.800 |
| 235/65 R16C | `235-65-r16c` | 3.000 |

**Gesamtes Suchvolumen: ~340.700/Monat**

### 3.3 Meta-Tags (Reifen-Seiten)

**Title:**
```
{Reifengröße} Reifen günstig kaufen & montieren | Bereifung24
```

**Description:**
```
{Reifengröße} Reifen online bestellen mit Montage-Service. Passend für {Fahrzeug1}, {Fahrzeug2}, {Fahrzeug3} u.v.m. ✓ Bestpreisgarantie ✓ Professionelle Montage ✓ Reifen direkt zur Werkstatt geliefert.
```

**Keywords:**
```
{Größe} reifen, {Größe} reifen kaufen, {Größe} sommerreifen, {Größe} winterreifen,
{Größe} ganzjahresreifen, {Größe} reifen mit montage,
{Fahrzeug1} reifen, {Fahrzeug2} reifen, {Fahrzeug3} reifen
```

### 3.4 Reifen-Datenstruktur

```typescript
interface TireSizeData {
  slug: string              // "205-55-r16"
  width: number             // 205
  aspectRatio: number       // 55
  rimDiameter: number       // 16
  displayName: string       // "205/55 R16"
  category: string          // Fahrzeugkategorie
  commonVehicles: string[]  // ["VW Golf", "Audi A3", "BMW 1er"]
  speedIndices: string[]    // ["H", "V", "W"]
  loadIndices: string[]
  seasonTip: string         // Saisonaler Tipp
  monthlySearchVolume: number
  metaTitle: string
  metaDescription: string
  h1: string
  introText: string
}
```

### 3.5 Schema.org (Reifen)

`WebPage` + `Product` mit:
- Produktname, Kategorie "Autoreifen"
- `availability: InStock`
- Fahrzeug-Kompatibilität
- Marken & Angebote

---

## 4. Service-Seiten (Statisch)

| Service | URL | Datei |
|---------|-----|-------|
| Reifenwechsel | `/services/reifenwechsel` | [app/services/reifenwechsel/page.tsx](app/services/reifenwechsel/page.tsx) |
| Reifenreparatur | `/services/reifenreparatur` | [app/services/reifenreparatur/page.tsx](app/services/reifenreparatur/page.tsx) |
| Räderwechsel | `/services/raederwechsel` | [app/services/raederwechsel/page.tsx](app/services/raederwechsel/page.tsx) |
| Motorradreifen | `/services/motorradreifen` | [app/services/motorradreifen/page.tsx](app/services/motorradreifen/page.tsx) |
| Klimaservice | `/services/klimaservice` | [app/services/klimaservice/page.tsx](app/services/klimaservice/page.tsx) |
| Achsvermessung | `/services/achsvermessung` | [app/services/achsvermessung/page.tsx](app/services/achsvermessung/page.tsx) |

Alle mit statischem `export const metadata = { ... }` implementiert.

---

## 5. Blog / Ratgeber

| Eigenschaft | Wert |
|-------------|------|
| **Übersicht** | [app/ratgeber/page.tsx](app/ratgeber/page.tsx) → `/ratgeber` |
| **Detail** | [app/ratgeber/[slug]/page.tsx](app/ratgeber/[slug]/page.tsx) → `/ratgeber/{slug}` |
| **Daten** | Prisma `blogPost` Tabelle |
| **Revalidate** | 300s (5 Minuten) |

**Meta-Tags aus DB:**
- `metaTitle` oder Fallback: `{Titel} | Bereifung24`
- `metaDescription` oder Fallback: `excerpt`
- `keywords` (Freitext-Feld)
- `canonicalUrl` (benutzerdefiniert oder Auto-Generierung)

**Schema.org:** `Article` mit `publishedTime`, `modifiedTime`, `author`, `image`

---

## 6. Workshop-Seiten

### 6.1 Werkstatt-Detailseiten
- **URL**: `/workshop/{id}`
- **Datei**: [app/workshop/[id]/page.tsx](app/workshop/[id]/page.tsx)
- **Schema.org**: `AutoRepair` + `LocalBusiness` (Name, Adresse, Tel, Öffnungszeiten, Bewertungen)

### 6.2 Werkstatt-Landing-Pages
- **URL**: `/{custom-slug}` (frei wählbar)
- **Datei**: [app/[slug]/page.tsx](app/[slug]/page.tsx)
- **Daten**: Prisma `workshopLandingPage` Tabelle
- **Indexierung**: Nur wenn `isActive = true` UND `workshop.isVerified = true`
- **Meta-Tags**: `metaTitle`, `metaDescription`, `keywords` aus DB

---

## 7. Structured Data (Schema.org / JSON-LD)

| Seitentyp | Schema-Typen |
|-----------|-------------|
| Stadt-Seiten | `WebPage` + `Service` + `LocalBusiness` |
| Reifen-Seiten | `WebPage` + `Product` (mit availability) |
| Blog-Beiträge | `Article` (publishedTime, author, image) |
| Werkstatt-Detail | `AutoRepair` + `LocalBusiness` + `AggregateRating` |
| Übersichtsseiten | `CollectionPage` + `ItemList` |

**Einbindung:**
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

---

## 8. OpenGraph & Social Media

Alle Seiten inkludieren:

```typescript
openGraph: {
  title: metaTitle,
  description: metaDescription,
  type: 'website',  // oder 'article' für Blog
  url: fullUrl,
  siteName: 'Bereifung24',
  locale: 'de_DE',
  images: [{
    url: 'https://www.bereifung24.de/og-image.jpg',
    width: 1200,
    height: 630,
    alt: '...'
  }]
}

twitter: {
  card: 'summary_large_image',
  title: metaTitle,
  description: metaDescription,
  images: [imageUrl]
}
```

---

## 9. Canonical URLs

| Seitentyp | Canonical-Muster |
|-----------|------------------|
| Stadt-Seiten | `https://www.bereifung24.de/werkstatt-werden/{slug}` |
| Reifen-Seiten | `https://www.bereifung24.de/reifen/{slug}` |
| Blog-Beiträge | `post.canonicalUrl` oder `https://bereifung24.de/ratgeber/{slug}` |
| Landing-Pages | `https://bereifung24.de/{slug}` |

**Internationalisierung**: Nicht implementiert (rein deutscher Markt, kein hreflang nötig)

---

## 10. Datei-Übersicht

```
lib/seo/
├── german-cities.ts    # ~100 Städte mit SEO-Daten (290KB+)
├── bw-cities.ts        # BW-Städte separat (Original)
└── tire-sizes.ts       # 46 Reifengrößen mit SEO-Daten

app/
├── robots.txt/route.ts
├── sitemap-werkstatt.xml/route.ts
├── sitemap-reifen.xml/route.ts
├── sitemap-blog.xml/route.ts
├── werkstatt-werden/[city]/page.tsx    # Stadt-Landing-Pages
├── reifen/[size]/page.tsx              # Reifengrößen-Seiten
├── ratgeber/[slug]/page.tsx            # Blog-Beiträge
├── workshop/[id]/page.tsx              # Werkstatt-Detail
├── [slug]/page.tsx                     # Workshop-Landing-Pages
└── services/
    ├── reifenwechsel/page.tsx
    ├── reifenreparatur/page.tsx
    ├── raederwechsel/page.tsx
    ├── motorradreifen/page.tsx
    ├── klimaservice/page.tsx
    └── achsvermessung/page.tsx
```

---

## 11. Keyword-Strategie Zusammenfassung

### Primäre Keywords (Stadt)
- `werkstatt registrieren {stadt}`
- `kfz werkstatt {stadt}`
- `reifenservice {stadt}`
- `werkstatt kunden gewinnen {stadt}`
- `online terminbuchung werkstatt {stadt}`

### Primäre Keywords (Reifen)
- `{größe} reifen kaufen`
- `{größe} sommerreifen / winterreifen / ganzjahresreifen`
- `{größe} reifen mit montage`
- `{fahrzeug} reifen` (z.B. "VW Golf Reifen")

### Primäre Keywords (Services)
- `reifenwechsel in der nähe`
- `reifen montieren lassen`
- `klimaservice auto`
- `achsvermessung kosten`

---

## 12. Middleware-Konfiguration

**Datei**: [middleware.ts](middleware.ts)

Statische SEO-Routen (kein DB-Check nötig):
```typescript
STATIC_ROUTES = [
  '/werkstatt', '/werkstatt-werden', '/ratgeber', '/reifen',
  '/robots.txt', '/sitemap', '/sitemap.xml',
  '/sitemap-blog.xml', '/sitemap-werkstatt.xml', '/sitemap-reifen.xml'
]
```

---

## 13. Zukünftige SEO-Erweiterungen

- [ ] Haupt-`sitemap.xml` Route (Index-Sitemap)
- [ ] Breadcrumb-Schema für bessere SERP-Darstellung
- [ ] FAQ-Schema für Service-Seiten
- [ ] Interne Verlinkung zwischen Stadt- und Reifenseiten
- [ ] Preis-Historie und Trends-Seiten
- [ ] Weitere Städte hinzufügen (aktuell ~100, Potenzial 200+)
- [ ] Lokale Landingpages pro Service + Stadt (z.B. `/reifenwechsel-berlin`)
