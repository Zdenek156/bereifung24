# Blog-System Roadmap - Bereifung24

## 📋 Executive Summary

**Ziel:** SEO-optimiertes Dual-Blog-System für Kunden (B2C) und Werkstätten (B2B)

**Erwarteter Impact:**
- +300-500% organischer Traffic in 6 Monaten
- 20.000-30.000 monatliche Besucher nach 6 Monaten
- 5-10% Conversion zu Anfragen
- ROI: 300% (2.000€ monatliche Provision bei 500€ Content-Kosten)

**Zeitrahmen:** 5-7 Entwicklungstage (4 Phasen)

---

## 🎯 Strategische Ziele

### SEO-Potenzial
```
Keyword                          Suchvolumen/Monat  Wettbewerb
"Reifenwechsel Kosten"           18.000            Mittel
"Winterreifen wechseln"          40.000            Hoch
"Reifendruck kontrollieren"      8.000             Niedrig
"Werkstatt Marketing Tipps"      1.200             Niedrig
"Reifenlagerung"                 5.000             Mittel
"Reifenwechsel München"          2.400             Mittel
"Winterreifenpflicht"            12.000            Mittel
```

### Content-Strategie

**Kunden-Blog (70% Content):**
- Wartung & Pflege (Reifendruck, Profiltiefe, Lagerung)
- Saisonale Themen (Winter-/Sommerreifen)
- Kosten & Preise (Spartipps, Preisvergleiche)
- Lokale Guides (Stadt + Stadtteil + Service)
- Recht & Gesetz (Winterreifenpflicht, Vorschriften)
- Fahrzeug-Typen (SUV, E-Auto, Motorrad)

**Werkstatt-Blog (30% Content):**
- Marketing & Akquise (Google Ads, Kundenbindung)
- Business-Optimierung (Terminmanagement, Kalkulation)
- Fachliches (Neue Technologien, Werkzeuge)
- Digitalisierung (Online-Buchung, Social Media)
- Finanzen & Recht (Steuern, Versicherungen)

---

## 🏗️ Datenbank-Schema

### Prisma Models

```prisma
// ============================================
// BLOG SYSTEM
// ============================================

model BlogPost {
  id              String   @id @default(cuid())
  slug            String   @unique
  title           String
  excerpt         String?  @db.Text
  content         String   @db.Text
  featuredImage   String?
  imageAlt        String?
  
  // SEO Fields
  metaTitle       String?
  metaDescription String?  @db.Text
  keywords        String[]
  canonicalUrl    String?
  focusKeyword    String?
  
  // Organization
  category        BlogCategory @relation(fields: [categoryId], references: [id])
  categoryId      String
  tags            BlogTag[]
  targetAudience  BlogAudience // CUSTOMER | WORKSHOP | BOTH
  
  // Publishing
  status          BlogStatus   // DRAFT | REVIEW | PUBLISHED | ARCHIVED
  author          B24Employee  @relation("AuthoredPosts", fields: [authorId], references: [id])
  authorId        String
  reviewer        B24Employee? @relation("ReviewedPosts", fields: [reviewerId], references: [id])
  reviewerId      String?
  reviewedAt      DateTime?
  publishedAt     DateTime?
  scheduledFor    DateTime?
  archivedAt      DateTime?
  
  // Analytics
  views           Int          @default(0)
  readTime        Int?         // Minuten
  seoScore        Int?         // 0-100
  
  // Related Content
  relatedPosts    BlogPost[]   @relation("RelatedPosts")
  relatedTo       BlogPost[]   @relation("RelatedPosts")
  
  // Timestamps
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  
  @@index([slug])
  @@index([status, publishedAt])
  @@index([categoryId])
  @@index([targetAudience])
  @@index([authorId])
  @@map("blog_posts")
}

model BlogCategory {
  id              String     @id @default(cuid())
  slug            String     @unique
  name            String
  description     String?    @db.Text
  icon            String?    // Emoji oder Lucide Icon Name
  color           String?    // Hex-Code für UI
  parentId        String?    // Für Sub-Kategorien
  
  // SEO
  seoTitle        String?
  seoDescription  String?    @db.Text
  
  // Relations
  posts           BlogPost[]
  parent          BlogCategory?  @relation("SubCategories", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children        BlogCategory[] @relation("SubCategories")
  
  // Ordering
  sortOrder       Int        @default(0)
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  @@index([slug])
  @@index([parentId])
  @@map("blog_categories")
}

model BlogTag {
  id        String     @id @default(cuid())
  slug      String     @unique
  name      String
  posts     BlogPost[]
  usageCount Int       @default(0) // Für Popular Tags
  
  createdAt DateTime   @default(now())
  
  @@index([slug])
  @@index([usageCount])
  @@map("blog_tags")
}

model BlogView {
  id          String   @id @default(cuid())
  postId      String
  post        BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  // Analytics
  ipAddress   String?
  userAgent   String?
  referer     String?
  country     String?
  city        String?
  
  viewedAt    DateTime @default(now())
  
  @@index([postId])
  @@index([viewedAt])
  @@map("blog_views")
}

enum BlogStatus {
  DRAFT
  REVIEW
  PUBLISHED
  ARCHIVED
}

enum BlogAudience {
  CUSTOMER
  WORKSHOP
  BOTH
}
```

### Initial Categories (Seed Data)

```typescript
// Kunden-Kategorien
const customerCategories = [
  { slug: 'wartung-pflege', name: 'Wartung & Pflege', icon: '🔧', color: '#3B82F6' },
  { slug: 'saisonales', name: 'Saisonale Themen', icon: '❄️', color: '#10B981' },
  { slug: 'kosten-preise', name: 'Kosten & Preise', icon: '💰', color: '#F59E0B' },
  { slug: 'recht-gesetz', name: 'Recht & Gesetz', icon: '⚖️', color: '#8B5CF6' },
  { slug: 'fahrzeugtypen', name: 'Fahrzeug-Typen', icon: '🚗', color: '#EF4444' },
  { slug: 'ratgeber', name: 'Ratgeber', icon: '📖', color: '#6366F1' }
]

// Werkstatt-Kategorien
const workshopCategories = [
  { slug: 'marketing', name: 'Marketing & Akquise', icon: '💼', color: '#EC4899' },
  { slug: 'business', name: 'Business-Optimierung', icon: '📊', color: '#14B8A6' },
  { slug: 'fachliches', name: 'Fachliches', icon: '🛠️', color: '#F97316' },
  { slug: 'digitalisierung', name: 'Digitalisierung', icon: '📱', color: '#06B6D4' },
  { slug: 'finanzen', name: 'Finanzen & Recht', icon: '💰', color: '#84CC16' }
]
```

---

## 📂 Ordner-Struktur

```
bereifung24/
├── app/
│   ├── admin/
│   │   └── blog/                          # Blog-Admin
│   │       ├── page.tsx                   # Dashboard/Übersicht
│   │       ├── artikel/
│   │       │   ├── page.tsx               # Artikel-Liste
│   │       │   ├── neu/
│   │       │   │   └── page.tsx           # Neuer Artikel
│   │       │   ├── [id]/
│   │       │   │   └── bearbeiten/
│   │       │   │       └── page.tsx       # Artikel bearbeiten
│   │       │   └── entwuerfe/
│   │       │       └── page.tsx           # Draft-Artikel
│   │       ├── kategorien/
│   │       │   ├── page.tsx               # Kategorie-Liste
│   │       │   └── [id]/
│   │       │       └── page.tsx           # Kategorie bearbeiten
│   │       ├── tags/
│   │       │   └── page.tsx               # Tag-Verwaltung
│   │       ├── seo-tools/
│   │       │   └── page.tsx               # SEO-Analyse & Tools
│   │       ├── analytics/
│   │       │   └── page.tsx               # Traffic-Statistiken
│   │       └── einstellungen/
│   │           └── page.tsx               # Blog-Einstellungen
│   │
│   ├── ratgeber/                          # Public Kunden-Blog
│   │   ├── page.tsx                       # Blog-Übersicht
│   │   ├── [category]/
│   │   │   └── page.tsx                   # Kategorie-Seite
│   │   ├── [slug]/
│   │   │   └── page.tsx                   # Artikel-Seite
│   │   └── tag/
│   │       └── [tag]/
│   │           └── page.tsx               # Tag-Seite
│   │
│   ├── werkstatt-blog/                    # Public Werkstatt-Blog
│   │   ├── page.tsx                       # Blog-Übersicht
│   │   ├── [category]/
│   │   │   └── page.tsx                   # Kategorie-Seite
│   │   └── [slug]/
│   │       └── page.tsx                   # Artikel-Seite
│   │
│   └── api/
│       └── admin/
│           └── blog/
│               ├── posts/
│               │   ├── route.ts           # GET, POST
│               │   └── [id]/
│               │       ├── route.ts       # GET, PUT, DELETE
│               │       ├── publish/
│               │       │   └── route.ts   # POST (Publish)
│               │       ├── archive/
│               │       │   └── route.ts   # POST (Archive)
│               │       └── duplicate/
│               │           └── route.ts   # POST (Duplizieren)
│               ├── categories/
│               │   ├── route.ts           # GET, POST
│               │   └── [id]/
│               │       └── route.ts       # GET, PUT, DELETE
│               ├── tags/
│               │   ├── route.ts           # GET, POST
│               │   └── [id]/
│               │       └── route.ts       # DELETE
│               ├── analytics/
│               │   ├── overview/
│               │   │   └── route.ts       # GET (Dashboard Stats)
│               │   ├── top-posts/
│               │   │   └── route.ts       # GET (Top-Performer)
│               │   └── [postId]/
│               │       └── route.ts       # GET (Post Analytics)
│               └── seo/
│                   ├── keyword-research/
│                   │   └── route.ts       # POST (Keyword-Analyse)
│                   ├── score/
│                   │   └── route.ts       # POST (SEO-Score)
│                   └── suggestions/
│                       └── route.ts       # POST (Interlinking)
│
├── components/
│   ├── blog/
│   │   ├── BlogCard.tsx                   # Artikel-Vorschau-Card
│   │   ├── BlogGrid.tsx                   # Grid-Layout für Artikel
│   │   ├── BlogHero.tsx                   # Hero-Section
│   │   ├── CategoryBadge.tsx              # Kategorie-Badge
│   │   ├── TagCloud.tsx                   # Tag-Wolke
│   │   ├── ReadingTime.tsx                # Lesezeit-Anzeige
│   │   ├── ShareButtons.tsx               # Social-Media-Buttons
│   │   ├── RelatedPosts.tsx               # Ähnliche Artikel
│   │   ├── Breadcrumbs.tsx                # Breadcrumb-Navigation
│   │   └── TableOfContents.tsx            # Inhaltsverzeichnis
│   │
│   └── admin/
│       └── blog/
│           ├── MarkdownEditor.tsx         # Markdown-Editor
│           ├── SEOPanel.tsx               # SEO-Felder-Panel
│           ├── PublishPanel.tsx           # Publishing-Optionen
│           ├── CategorySelector.tsx       # Kategorie-Auswahl
│           ├── TagInput.tsx               # Tag-Eingabe
│           ├── ImageUpload.tsx            # Featured-Image Upload
│           ├── SEOScoreIndicator.tsx      # SEO-Score-Anzeige
│           └── ArticlePreview.tsx         # Live-Vorschau
│
├── lib/
│   ├── blog/
│   │   ├── blogService.ts                 # CRUD-Operationen
│   │   ├── seoService.ts                  # SEO-Analyse
│   │   ├── slugify.ts                     # Slug-Generierung
│   │   ├── readingTime.ts                 # Lesezeit-Berechnung
│   │   ├── markdownParser.ts              # Markdown → HTML
│   │   ├── schemaGenerator.ts             # Schema.org JSON-LD
│   │   └── analytics.ts                   # View-Tracking
│   │
│   └── seo/
│       ├── keywords.ts                    # Keyword-Density
│       ├── metaTags.ts                    # Meta-Tag-Generierung
│       └── sitemap.ts                     # XML-Sitemap
│
└── prisma/
    └── migrations/
        └── YYYYMMDD_add_blog_system/
            └── migration.sql              # Blog-Schema
```

---

## 🚀 Phase 1: MVP (2-3 Tage)

### 1.1 Database Setup ✅
**Aufwand:** 1-2 Stunden

- [ ] Prisma Schema erweitern (BlogPost, BlogCategory, BlogTag)
- [ ] Migration erstellen: `npx prisma migrate dev --name add_blog_system`
- [ ] Seed-Daten für Kategorien erstellen
- [ ] Production Migration: `npx prisma migrate deploy`

**Files:**
- `prisma/schema.prisma` - Blog Models hinzufügen
- `prisma/seed.ts` - Kategorien seeden

### 1.2 Backend APIs ✅
**Aufwand:** 3-4 Stunden

**Posts API:**
```typescript
// app/api/admin/blog/posts/route.ts
GET    /api/admin/blog/posts              // Liste mit Filter
POST   /api/admin/blog/posts              // Neuer Artikel

// app/api/admin/blog/posts/[id]/route.ts
GET    /api/admin/blog/posts/[id]         // Einzelner Artikel
PUT    /api/admin/blog/posts/[id]         // Update
DELETE /api/admin/blog/posts/[id]         // Löschen

// app/api/admin/blog/posts/[id]/publish/route.ts
POST   /api/admin/blog/posts/[id]/publish // Publish

// app/api/admin/blog/posts/[id]/archive/route.ts
POST   /api/admin/blog/posts/[id]/archive // Archive
```

**Categories API:**
```typescript
GET    /api/admin/blog/categories         // Liste
POST   /api/admin/blog/categories         // Neu
PUT    /api/admin/blog/categories/[id]    // Update
DELETE /api/admin/blog/categories/[id]    // Löschen
```

**Tags API:**
```typescript
GET    /api/admin/blog/tags               // Liste
POST   /api/admin/blog/tags               // Neu
DELETE /api/admin/blog/tags/[id]          // Löschen
```

**Features:**
- Pagination (default: 20 per page)
- Filter: status, category, tag, audience, author
- Suche: title, content, excerpt
- Sorting: publishedAt, views, createdAt
- Authorization: nur B24_EMPLOYEE mit HR-Access oder ADMIN

### 1.3 Admin Dashboard ✅
**Aufwand:** 2-3 Stunden

**Dashboard-Kachel:**
```tsx
// app/admin/page.tsx
<Link href="/admin/blog">
  <Card>
    <CardHeader>
      <CardTitle>📝 Blog & Content</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Artikel veröffentlicht</span>
          <span className="font-semibold">{publishedCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Views (30 Tage)</span>
          <span className="font-semibold">{totalViews.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600">Entwürfe</span>
          <span className="font-semibold">{draftCount}</span>
        </div>
      </div>
      <Button className="w-full mt-4">Neuer Artikel</Button>
    </CardContent>
  </Card>
</Link>
```

**Blog-Dashboard:**
```tsx
// app/admin/blog/page.tsx
- Quick Stats (Published, Drafts, Views, Top Post)
- Recent Articles (letzte 5)
- Quick Actions (Neuer Artikel, Kategorien, Tags, Analytics)
```

### 1.4 Artikel-Liste ✅
**Aufwand:** 2-3 Stunden

```tsx
// app/admin/blog/artikel/page.tsx
Features:
- Tabellen-Ansicht mit Status-Badge
- Filter: Status, Kategorie, Zielgruppe
- Suche: Titel, Autor
- Actions: Bearbeiten, Duplizieren, Löschen, Archivieren
- Bulk-Actions: Mehrere Artikel auf einmal bearbeiten
```

### 1.5 Artikel-Editor (Basis) ✅
**Aufwand:** 4-5 Stunden

```tsx
// app/admin/blog/artikel/neu/page.tsx
Components:
- Title Input (Auto-Slug-Generierung)
- Slug Editor (manuell editierbar)
- Markdown Editor (Textarea mit Preview)
- Category Selector (Dropdown)
- Tag Input (Autocomplete)
- Target Audience (Radio: Kunden/Werkstätten/Beide)
- Status Selector (Draft/Review/Published)
- Featured Image Upload
- Save Draft / Publish Buttons
```

**Markdown-Editor:**
```tsx
// components/admin/blog/MarkdownEditor.tsx
- Toolbar: Bold, Italic, H1, H2, Bullet List, Link, Image
- Split View: Editor | Preview
- Syntax Highlighting
- Keyboard Shortcuts (Ctrl+B, Ctrl+I, etc.)
```

### 1.6 Public Blog Pages ✅
**Aufwand:** 3-4 Stunden

**Blog-Übersicht:**
```tsx
// app/ratgeber/page.tsx
- Hero-Section mit Suche
- Featured Post (Latest Published)
- Kategorie-Filter (Horizontal Scroll)
- Artikel-Grid (3 Spalten)
- Pagination
- Sidebar: Popular Tags, Top Articles
```

**Artikel-Seite:**
```tsx
// app/ratgeber/[slug]/page.tsx
- Breadcrumbs
- Featured Image
- Title, Meta (Author, Date, Reading Time)
- Content (Markdown → HTML)
- Category Badge, Tags
- Share Buttons
- Related Articles (3-4)
- Schema.org JSON-LD
```

**Kategorie-Seite:**
```tsx
// app/ratgeber/[category]/page.tsx
- Category Header (Name, Description)
- Artikel-Grid (alle Artikel dieser Kategorie)
- Pagination
```

### 1.7 SEO-Grundlagen ✅
**Aufwand:** 2-3 Stunden

**Meta Tags:**
```tsx
// app/ratgeber/[slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  
  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.keywords,
    canonical: post.canonicalUrl || `https://bereifung24.de/ratgeber/${post.slug}`,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.featuredImage],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name]
    }
  }
}
```

**Schema.org:**
```typescript
// lib/blog/schemaGenerator.ts
export function generateArticleSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "author": {
      "@type": "Person",
      "name": post.author.name,
      "email": post.author.email
    },
    "publisher": {
      "@type": "Organization",
      "name": "Bereifung24",
      "logo": {
        "@type": "ImageObject",
        "url": "https://bereifung24.de/logo.png"
      }
    },
    "datePublished": post.publishedAt,
    "dateModified": post.updatedAt,
    "image": post.featuredImage,
    "articleBody": post.content,
    "mainEntityOfPage": `https://bereifung24.de/ratgeber/${post.slug}`
  }
}
```

**Breadcrumbs Schema:**
```typescript
export function generateBreadcrumbSchema(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://bereifung24.de"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Ratgeber",
        "item": "https://bereifung24.de/ratgeber"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": post.category.name,
        "item": `https://bereifung24.de/ratgeber/${post.category.slug}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": post.title
      }
    ]
  }
}
```

**Phase 1 Deliverables:**
- ✅ Vollständiges CMS mit CRUD-Operationen
- ✅ Admin-Kachel im Dashboard
- ✅ Basis-Editor (Markdown)
- ✅ Public Blog-Seiten (Übersicht, Artikel, Kategorie)
- ✅ SEO-Meta-Tags und Schema.org
- ✅ Slug-Generierung und URL-Structure

---

## 🎨 Phase 2: SEO & UX Features (1-2 Tage)

### 2.1 Advanced SEO Fields ✅
**Aufwand:** 2-3 Stunden

```tsx
// components/admin/blog/SEOPanel.tsx
<Card>
  <CardHeader>
    <CardTitle>SEO-Einstellungen</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Meta Title */}
    <div>
      <Label>Meta-Titel (max. 60 Zeichen)</Label>
      <Input 
        value={metaTitle} 
        onChange={handleMetaTitleChange}
        maxLength={70}
      />
      <div className="flex justify-between text-xs mt-1">
        <span className={metaTitle.length > 60 ? 'text-red-500' : 'text-green-500'}>
          {metaTitle.length}/60 Zeichen
        </span>
        {metaTitle.length > 60 && <span className="text-red-500">Zu lang!</span>}
      </div>
    </div>

    {/* Meta Description */}
    <div>
      <Label>Meta-Description (max. 160 Zeichen)</Label>
      <Textarea 
        value={metaDescription} 
        onChange={handleMetaDescriptionChange}
        maxLength={170}
        rows={3}
      />
      <div className="flex justify-between text-xs mt-1">
        <span className={metaDescription.length > 160 ? 'text-red-500' : 'text-green-500'}>
          {metaDescription.length}/160 Zeichen
        </span>
      </div>
    </div>

    {/* Focus Keyword */}
    <div>
      <Label>Focus Keyword</Label>
      <Input 
        value={focusKeyword}
        onChange={handleFocusKeywordChange}
        placeholder="Hauptkeyword für diesen Artikel"
      />
    </div>

    {/* Keywords */}
    <div>
      <Label>Keywords (Komma-getrennt)</Label>
      <Input 
        value={keywords.join(', ')}
        onChange={handleKeywordsChange}
        placeholder="Winterreifen, Reifenwechsel, Sicherheit"
      />
    </div>

    {/* Canonical URL */}
    <div>
      <Label>Canonical URL (optional)</Label>
      <Input 
        value={canonicalUrl}
        onChange={handleCanonicalChange}
        placeholder="https://bereifung24.de/ratgeber/..."
      />
      <p className="text-xs text-gray-500 mt-1">
        Nur bei Duplicate Content angeben
      </p>
    </div>

    {/* SEO Preview */}
    <div className="border-t pt-4">
      <Label>Google-Vorschau</Label>
      <div className="bg-gray-50 p-4 rounded mt-2">
        <div className="text-blue-600 text-lg hover:underline">
          {metaTitle || title}
        </div>
        <div className="text-green-700 text-sm">
          bereifung24.de › ratgeber › {slug}
        </div>
        <div className="text-gray-600 text-sm mt-1">
          {metaDescription || excerpt || 'Keine Beschreibung verfügbar...'}
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### 2.2 SEO-Score Calculator ✅
**Aufwand:** 3-4 Stunden

```typescript
// lib/blog/seoService.ts
export function calculateSEOScore(post: BlogPost): {
  score: number
  checks: SEOCheck[]
} {
  const checks: SEOCheck[] = []
  let score = 0

  // Title Check (10 points)
  if (post.metaTitle) {
    if (post.metaTitle.length >= 30 && post.metaTitle.length <= 60) {
      checks.push({ type: 'success', message: 'Title-Länge optimal' })
      score += 10
    } else {
      checks.push({ type: 'warning', message: 'Title-Länge nicht optimal' })
      score += 5
    }
  } else {
    checks.push({ type: 'error', message: 'Kein Meta-Title' })
  }

  // Description Check (10 points)
  if (post.metaDescription) {
    if (post.metaDescription.length >= 120 && post.metaDescription.length <= 160) {
      checks.push({ type: 'success', message: 'Description-Länge optimal' })
      score += 10
    } else {
      checks.push({ type: 'warning', message: 'Description-Länge nicht optimal' })
      score += 5
    }
  } else {
    checks.push({ type: 'error', message: 'Keine Meta-Description' })
  }

  // Keyword Density Check (15 points)
  if (post.focusKeyword) {
    const density = calculateKeywordDensity(post.content, post.focusKeyword)
    if (density >= 1 && density <= 2) {
      checks.push({ type: 'success', message: `Keyword-Dichte optimal (${density.toFixed(1)}%)` })
      score += 15
    } else if (density > 2) {
      checks.push({ type: 'warning', message: `Keyword-Dichte zu hoch (${density.toFixed(1)}%)` })
      score += 8
    } else {
      checks.push({ type: 'warning', message: `Keyword-Dichte zu niedrig (${density.toFixed(1)}%)` })
      score += 8
    }
  }

  // Image Alt-Text Check (10 points)
  const images = extractImages(post.content)
  const imagesWithAlt = images.filter(img => img.alt).length
  if (images.length > 0) {
    if (imagesWithAlt === images.length) {
      checks.push({ type: 'success', message: 'Alle Bilder haben Alt-Text' })
      score += 10
    } else {
      checks.push({ type: 'error', message: `${images.length - imagesWithAlt} Bilder ohne Alt-Text` })
      score += (imagesWithAlt / images.length) * 10
    }
  }

  // Content Length Check (10 points)
  const wordCount = countWords(post.content)
  if (wordCount >= 800) {
    checks.push({ type: 'success', message: `Content-Länge gut (${wordCount} Wörter)` })
    score += 10
  } else {
    checks.push({ type: 'warning', message: `Content zu kurz (${wordCount} Wörter, empfohlen: 800+)` })
    score += (wordCount / 800) * 10
  }

  // Heading Structure Check (10 points)
  const headings = extractHeadings(post.content)
  if (headings.h1.length === 1 && headings.h2.length >= 3) {
    checks.push({ type: 'success', message: 'Heading-Struktur optimal' })
    score += 10
  } else {
    checks.push({ type: 'warning', message: 'Heading-Struktur verbesserungswürdig' })
    score += 5
  }

  // Internal Links Check (10 points)
  const internalLinks = extractInternalLinks(post.content)
  if (internalLinks.length >= 3) {
    checks.push({ type: 'success', message: `${internalLinks.length} interne Links` })
    score += 10
  } else {
    checks.push({ type: 'warning', message: 'Zu wenige interne Links' })
    score += internalLinks.length * 3
  }

  // External Links Check (5 points)
  const externalLinks = extractExternalLinks(post.content)
  if (externalLinks.length >= 1) {
    checks.push({ type: 'success', message: `${externalLinks.length} externe Links` })
    score += 5
  }

  // Featured Image Check (10 points)
  if (post.featuredImage) {
    if (post.imageAlt) {
      checks.push({ type: 'success', message: 'Featured Image mit Alt-Text' })
      score += 10
    } else {
      checks.push({ type: 'warning', message: 'Featured Image ohne Alt-Text' })
      score += 5
    }
  } else {
    checks.push({ type: 'error', message: 'Kein Featured Image' })
  }

  // Reading Time Check (5 points)
  if (post.readTime && post.readTime >= 3 && post.readTime <= 10) {
    checks.push({ type: 'success', message: `Lesezeit optimal (${post.readTime} Min.)` })
    score += 5
  }

  // Category Check (5 points)
  if (post.categoryId) {
    checks.push({ type: 'success', message: 'Kategorie zugewiesen' })
    score += 5
  }

  // Tags Check (5 points)
  if (post.tags.length >= 3 && post.tags.length <= 8) {
    checks.push({ type: 'success', message: `${post.tags.length} Tags` })
    score += 5
  }

  return { score, checks }
}
```

**Live SEO-Score in Editor:**
```tsx
// components/admin/blog/SEOScoreIndicator.tsx
<Card className="sticky top-4">
  <CardHeader>
    <CardTitle>SEO-Score</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-center mb-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getScoreColor(seoScore)}
            strokeWidth="10"
            strokeDasharray={`${seoScore * 2.83} 283`}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold">{seoScore}</span>
        </div>
      </div>
    </div>

    <div className="space-y-2">
      {checks.map((check, i) => (
        <div key={i} className="flex items-start gap-2">
          {check.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
          {check.type === 'warning' && <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />}
          {check.type === 'error' && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
          <span className="text-sm">{check.message}</span>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### 2.3 XML Sitemap ✅
**Aufwand:** 1-2 Stunden

```typescript
// app/sitemap-blog.xml/route.ts
export async function GET() {
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      slug: true,
      updatedAt: true,
      category: {
        select: { slug: true }
      }
    }
  })

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${posts.map(post => `
        <url>
          <loc>https://bereifung24.de/ratgeber/${post.slug}</loc>
          <lastmod>${post.updatedAt.toISOString()}</lastmod>
          <changefreq>monthly</changefreq>
          <priority>0.8</priority>
        </url>
      `).join('')}
    </urlset>
  `

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
```

### 2.4 Related Articles ✅
**Aufwand:** 2-3 Stunden

```typescript
// lib/blog/blogService.ts
export async function getRelatedPosts(
  postId: string, 
  limit: number = 4
): Promise<BlogPost[]> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: { tags: true, category: true }
  })

  if (!post) return []

  // Strategy: Find posts with matching tags or same category
  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: 'PUBLISHED',
      OR: [
        { tags: { some: { id: { in: post.tags.map(t => t.id) } } } },
        { categoryId: post.categoryId }
      ]
    },
    include: {
      author: true,
      category: true,
      tags: true
    },
    orderBy: {
      views: 'desc'
    },
    take: limit
  })

  return relatedPosts
}
```

```tsx
// components/blog/RelatedPosts.tsx
<section className="mt-12 border-t pt-8">
  <h2 className="text-2xl font-bold mb-6">Ähnliche Artikel</h2>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {relatedPosts.map(post => (
      <BlogCard key={post.id} post={post} />
    ))}
  </div>
</section>
```

### 2.5 Reading Time & Stats ✅
**Aufwand:** 1 Stunde

```typescript
// lib/blog/readingTime.ts
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  const readTime = Math.ceil(wordCount / wordsPerMinute)
  return readTime
}

// Auto-calculate on save
export async function updateReadingTime(postId: string) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId }
  })
  
  if (post) {
    const readTime = calculateReadingTime(post.content)
    await prisma.blogPost.update({
      where: { id: postId },
      data: { readTime }
    })
  }
}
```

```tsx
// components/blog/ReadingTime.tsx
<div className="flex items-center gap-2 text-sm text-gray-600">
  <Clock className="h-4 w-4" />
  <span>{readTime} Min. Lesezeit</span>
</div>
```

### 2.6 Internal Linking Suggestions ✅
**Aufwand:** 2-3 Stunden

```typescript
// lib/blog/seoService.ts
export async function suggestInternalLinks(content: string, currentPostId?: string) {
  // Extract keywords from content
  const keywords = extractKeywords(content)
  
  // Find posts matching keywords
  const suggestions = await prisma.blogPost.findMany({
    where: {
      id: { not: currentPostId },
      status: 'PUBLISHED',
      OR: [
        { title: { contains: keywords[0], mode: 'insensitive' } },
        { content: { contains: keywords[0], mode: 'insensitive' } },
        { keywords: { hasSome: keywords } }
      ]
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true
    },
    take: 5
  })

  return suggestions
}
```

```tsx
// components/admin/blog/InternalLinkingSuggestions.tsx
<Card>
  <CardHeader>
    <CardTitle>📎 Link-Vorschläge</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-gray-600 mb-4">
      Verlinke zu diesen Artikeln für besseres SEO:
    </p>
    <div className="space-y-2">
      {suggestions.map(post => (
        <div key={post.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <div>
            <div className="font-medium text-sm">{post.title}</div>
            <div className="text-xs text-gray-500">
              /ratgeber/{post.slug}
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => insertLink(post)}
          >
            Einfügen
          </Button>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

**Phase 2 Deliverables:**
- ✅ Advanced SEO-Felder (Meta Title, Description, Keywords, Canonical)
- ✅ SEO-Score-Calculator mit Live-Feedback
- ✅ XML-Sitemap für Blog-Artikel
- ✅ Related Articles basierend auf Tags/Kategorie
- ✅ Reading Time Calculation
- ✅ Internal Linking Suggestions

---

## ⚙️ Phase 3: Workflow & Management (1 Tag)

### 3.1 Status-Workflow ✅
**Aufwand:** 2-3 Stunden

**Workflow:**
```
DRAFT → REVIEW → PUBLISHED → ARCHIVED
  ↓        ↓         ↓
Edit    Approve   Archive
```

**Permissions:**
- **DRAFT**: Alle Autoren können erstellen/bearbeiten
- **REVIEW**: Nur Reviewer (hierarchyLevel <= 1) können freigeben
- **PUBLISHED**: Nur Geschäftsführer (hierarchyLevel 0) kann archivieren
- **ARCHIVED**: Nur Geschäftsführer kann wiederherstellen

```typescript
// app/api/admin/blog/posts/[id]/review/route.ts
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if user is reviewer (Manager or higher)
  const employee = await prisma.b24Employee.findUnique({
    where: { email: session.user.email }
  })

  if (!employee || employee.hierarchyLevel > 1) {
    return NextResponse.json(
      { error: 'Only managers can review articles' },
      { status: 403 }
    )
  }

  const post = await prisma.blogPost.findUnique({
    where: { id: params.id }
  })

  if (post?.status !== 'DRAFT') {
    return NextResponse.json(
      { error: 'Only draft articles can be sent to review' },
      { status: 400 }
    )
  }

  const updated = await prisma.blogPost.update({
    where: { id: params.id },
    data: {
      status: 'REVIEW',
      reviewerId: employee.id,
      reviewedAt: new Date()
    }
  })

  return NextResponse.json({ success: true, data: updated })
}
```

### 3.2 Scheduling ✅
**Aufwand:** 2-3 Stunden

```tsx
// components/admin/blog/PublishPanel.tsx
<Card>
  <CardHeader>
    <CardTitle>Veröffentlichung</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label>Status</Label>
      <Select value={status} onValueChange={setStatus}>
        <SelectOption value="DRAFT">Entwurf</SelectOption>
        <SelectOption value="REVIEW">Zur Review</SelectOption>
        <SelectOption value="PUBLISHED">Veröffentlicht</SelectOption>
      </Select>
    </div>

    {status === 'PUBLISHED' && (
      <div>
        <Label>Veröffentlichung</Label>
        <RadioGroup value={publishMode} onValueChange={setPublishMode}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="now" id="now" />
            <Label htmlFor="now">Sofort veröffentlichen</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="scheduled" id="scheduled" />
            <Label htmlFor="scheduled">Zeitgesteuert</Label>
          </div>
        </RadioGroup>

        {publishMode === 'scheduled' && (
          <div className="mt-4">
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Artikel wird automatisch am gewählten Zeitpunkt veröffentlicht
            </p>
          </div>
        )}
      </div>
    )}
  </CardContent>
</Card>
```

**Cron-Job für Scheduling:**
```typescript
// app/api/cron/publish-scheduled-posts/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Find posts scheduled for publishing
  const scheduledPosts = await prisma.blogPost.findMany({
    where: {
      status: 'DRAFT',
      scheduledFor: {
        lte: now
      }
    }
  })

  // Publish them
  for (const post of scheduledPosts) {
    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: now
      }
    })
  }

  return NextResponse.json({
    success: true,
    published: scheduledPosts.length
  })
}
```

### 3.3 Versioning ✅
**Aufwand:** 3-4 Stunden

```prisma
// Add to schema.prisma
model BlogPostRevision {
  id        String   @id @default(cuid())
  postId    String
  post      BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  // Snapshot of post data
  title     String
  content   String   @db.Text
  excerpt   String?  @db.Text
  
  // Who made this revision
  authorId  String
  author    B24Employee @relation(fields: [authorId], references: [id])
  
  // Change note
  changeNote String? @db.Text
  
  createdAt DateTime @default(now())
  
  @@index([postId])
  @@index([createdAt])
  @@map("blog_post_revisions")
}
```

```typescript
// lib/blog/blogService.ts
export async function saveRevision(
  postId: string, 
  authorId: string, 
  changeNote?: string
) {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId }
  })

  if (!post) throw new Error('Post not found')

  await prisma.blogPostRevision.create({
    data: {
      postId,
      authorId,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      changeNote
    }
  })
}

export async function restoreRevision(revisionId: string) {
  const revision = await prisma.blogPostRevision.findUnique({
    where: { id: revisionId }
  })

  if (!revision) throw new Error('Revision not found')

  await prisma.blogPost.update({
    where: { id: revision.postId },
    data: {
      title: revision.title,
      content: revision.content,
      excerpt: revision.excerpt
    }
  })

  return revision.postId
}
```

### 3.4 Multi-Author Support ✅
**Aufwand:** 1-2 Stunden

```tsx
// app/admin/blog/artikel/page.tsx
// Filter by author
<Select value={authorFilter} onValueChange={setAuthorFilter}>
  <SelectOption value="">Alle Autoren</SelectOption>
  {authors.map(author => (
    <SelectOption key={author.id} value={author.id}>
      {author.firstName} {author.lastName}
    </SelectOption>
  ))}
</Select>

// Show author in list
<div className="flex items-center gap-2">
  <Avatar>
    <AvatarImage src={post.author.profileImage} />
    <AvatarFallback>
      {post.author.firstName[0]}{post.author.lastName[0]}
    </AvatarFallback>
  </Avatar>
  <div>
    <div className="font-medium">{post.author.firstName} {post.author.lastName}</div>
    <div className="text-xs text-gray-500">{formatDate(post.createdAt)}</div>
  </div>
</div>
```

**Phase 3 Deliverables:**
- ✅ Status-Workflow (Draft → Review → Published → Archived)
- ✅ Scheduling (Zeitgesteuerte Veröffentlichung)
- ✅ Versioning (Änderungsverlauf)
- ✅ Multi-Author Support
- ✅ Review-Workflow mit Berechtigungen

---

## 📊 Phase 4: Analytics & Optimization (1 Tag)

### 4.1 View Tracking ✅
**Aufwand:** 2-3 Stunden

```typescript
// app/api/blog/track-view/route.ts
export async function POST(request: NextRequest) {
  const { postId } = await request.json()
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const referer = request.headers.get('referer')

  // Optional: Use IP-geolocation service
  const geo = await getGeolocation(ip)

  await prisma.blogView.create({
    data: {
      postId,
      ipAddress: ip,
      userAgent,
      referer,
      country: geo?.country,
      city: geo?.city
    }
  })

  // Increment view counter
  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      views: { increment: 1 }
    }
  })

  return NextResponse.json({ success: true })
}
```

```tsx
// app/ratgeber/[slug]/page.tsx
'use client'

useEffect(() => {
  // Track view on client-side
  fetch('/api/blog/track-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId: post.id })
  })
}, [post.id])
```

### 4.2 Analytics Dashboard ✅
**Aufwand:** 3-4 Stunden

```tsx
// app/admin/blog/analytics/page.tsx
export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="Gesamt-Views (30 Tage)"
          value={totalViews.toLocaleString()}
          change="+15.3%"
          positive={true}
        />
        <StatsCard
          title="Veröffentlichte Artikel"
          value={publishedCount}
          change="+3"
          positive={true}
        />
        <StatsCard
          title="Ø Lesezeit"
          value={`${avgReadTime} Min.`}
          change="-0.5 Min."
          positive={false}
        />
        <StatsCard
          title="SEO-Score"
          value={avgSeoScore}
          change="+5"
          positive={true}
        />
      </div>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Artikel (30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Artikel</TableHead>
                <TableHead>Kategorie</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Ø Lesezeit</TableHead>
                <TableHead>SEO-Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPosts.map(post => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link href={`/admin/blog/artikel/${post.id}/bearbeiten`}>
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={post.category} />
                  </TableCell>
                  <TableCell>{post.views.toLocaleString()}</TableCell>
                  <TableCell>{post.readTime} Min.</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{post.seoScore}/100</span>
                      <div className="w-12 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={`h-full rounded-full ${getScoreColor(post.seoScore)}`}
                          style={{ width: `${post.seoScore}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic-Entwicklung (90 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={trafficData} />
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance nach Kategorie</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart data={categoryStats} />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4.3 Keyword Research Tool ✅
**Aufwand:** 2-3 Stunden

```tsx
// app/admin/blog/seo-tools/page.tsx
export default function SEOToolsPage() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<KeywordData[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true)
    const response = await fetch('/api/admin/blog/seo/keyword-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    })
    const data = await response.json()
    setResults(data.results)
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Keyword-Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="z.B. Reifenwechsel München"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Analysiere...' : 'Analysieren'}
            </Button>
          </div>

          {results.length > 0 && (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Suchvolumen/Monat</TableHead>
                    <TableHead>Wettbewerb</TableHead>
                    <TableHead>Deine Artikel</TableHead>
                    <TableHead>Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map(result => (
                    <TableRow key={result.keyword}>
                      <TableCell className="font-medium">{result.keyword}</TableCell>
                      <TableCell>{result.volume.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={result.competition === 'LOW' ? 'success' : 'warning'}>
                          {result.competition}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {result.existingArticles > 0 ? (
                          <span>{result.existingArticles} Artikel</span>
                        ) : (
                          <span className="text-gray-500">Keine</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/blog/artikel/neu?keyword=${result.keyword}`}>
                          <Button size="sm">Artikel erstellen</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Warnings */}
      <Card>
        <CardHeader>
          <CardTitle>⚠️ SEO-Warnungen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {seoWarnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-yellow-50 rounded">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{warning.title}</div>
                  <div className="text-sm text-gray-600">{warning.description}</div>
                </div>
                <Button size="sm" variant="outline">
                  Beheben
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 4.4 Search Console Integration (Optional) ✅
**Aufwand:** 3-4 Stunden

```typescript
// lib/seo/searchConsole.ts
import { google } from 'googleapis'

export async function getSearchConsoleData(
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  auth.setCredentials({
    access_token: process.env.GOOGLE_SEARCH_CONSOLE_TOKEN
  })

  const searchConsole = google.searchconsole({ version: 'v1', auth })

  const response = await searchConsole.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['PAGE', 'QUERY'],
      dimensionFilterGroups: [{
        filters: [{
          dimension: 'PAGE',
          operator: 'CONTAINS',
          expression: '/ratgeber/'
        }]
      }]
    }
  })

  return response.data.rows
}
```

**Phase 4 Deliverables:**
- ✅ View-Tracking mit IP-Geolocation
- ✅ Analytics-Dashboard (Stats, Charts, Top Posts)
- ✅ Keyword-Research-Tool
- ✅ SEO-Warnungen und Verbesserungsvorschläge
- ⚠️ Optional: Google Search Console Integration

---

## 📝 Content-Strategie & Launch-Plan

### Initial Content (20-30 Artikel)

**Kunden-Blog (20 Artikel):**

**Wartung & Pflege (5):**
1. "Reifendruck richtig prüfen - So geht's"
2. "Profiltiefe messen: Wann sind Reifen abgefahren?"
3. "Reifen richtig lagern - Tipps für Sommer und Winter"
4. "Wann Reifen wechseln? Die optimalen Zeitpunkte"
5. "Reifenpflege im Winter - 7 wichtige Tipps"

**Saisonales (5):**
6. "Winterreifen 2026: Alles zur Winterreifenpflicht"
7. "Von O bis O - Die Faustformel für Reifenwechsel"
8. "Sommerreifen vs. Ganzjahresreifen - Was ist besser?"
9. "Wetter-Alarm: Wann Winterreifen wechseln?"
10. "Die besten Winterreifen 2026 im Test"

**Kosten & Preise (4):**
11. "Reifenwechsel Kosten 2026 - Vollständiger Preisvergleich"
12. "Was kostet eine Einlagerung? Preise & Spartipps"
13. "Reifen online kaufen vs. Werkstatt - Kostenvergleich"
14. "Günstige Winterreifen - Top 5 unter 100€"

**Lokale Guides (4):**
15. "Reifenwechsel München: Die 10 besten Werkstätten"
16. "Winterreifen Berlin - Preisvergleich & Werkstätten"
17. "Hamburg: Wo Reifenwechsel am günstigsten ist"
18. "Reifenwechsel Frankfurt - Top-Werkstätten mit Terminen"

**Recht & Gesetz (2):**
19. "Winterreifenpflicht Deutschland 2026 - Alle Regeln"
20. "M+S vs. Alpine-Symbol - Was gilt ab 2026?"

**Werkstatt-Blog (10 Artikel):**

**Marketing (3):**
21. "5 Wege, wie Werkstätten 30% mehr Kunden gewinnen"
22. "Google Ads für Werkstätten - Lohnt sich das?"
23. "Social Media Marketing für KFZ-Werkstätten"

**Business (3):**
24. "Online-Terminbuchung: Vorteile für Werkstätten"
25. "Preiskalkulation Reifenwechsel - So rechnen Sie richtig"
26. "Werkstatt-Software 2026 - Die besten Tools"

**Digitalisierung (2):**
27. "Digitale Annahme - So modernisieren Sie Ihre Werkstatt"
28. "WhatsApp-Marketing für Werkstätten - Best Practices"

**Finanzen (2):**
29. "Provisionsmodelle für Reifendienste im Vergleich"
30. "Steuertipps für Werkstatt-Inhaber 2026"

### Content-Produktions-Plan

**Woche 1-2: Setup & Initial 10 Artikel**
- Tag 1-5: Entwicklung (Phase 1-4)
- Tag 6-7: 5 Kunden-Artikel schreiben (Wartung & Pflege)
- Tag 8-9: 5 Kunden-Artikel schreiben (Saisonales)
- Tag 10: Review & Publish

**Woche 3: 10 weitere Artikel**
- 4 Artikel: Kosten & Preise
- 4 Artikel: Lokale Guides
- 2 Artikel: Recht & Gesetz

**Woche 4: Werkstatt-Content (10 Artikel)**
- 3 Artikel: Marketing
- 3 Artikel: Business
- 2 Artikel: Digitalisierung
- 2 Artikel: Finanzen

**Ab Monat 2: Kontinuierliche Produktion**
- 4-6 neue Artikel/Monat
- 70% Kunden, 30% Werkstätten
- Focus auf Long-tail Keywords

### Content-Outsourcing-Optionen

**Option 1: Freelancer (empfohlen)**
- Plattformen: Upwork, Fiverr, Textbroker
- Kosten: 15-30€ pro Artikel (800 Wörter)
- Qualität: Briefing + Review erforderlich

**Option 2: Content-Agentur**
- SEO-optimierte Artikel inkl. Keyword-Research
- Kosten: 100-200€ pro Artikel
- Qualität: Professionell, wenig Aufwand

**Option 3: Inhouse (Mitarbeiter)**
- Mitarbeiter schreiben selbst (Eduard, Matthias, Zdenek)
- Kosten: Arbeitszeit
- Qualität: Authentisch, weniger SEO-optimiert

**Empfehlung: Mix aus Freelancer + Inhouse**
- 80% Freelancer (SEO-optimiert)
- 20% Inhouse (authentische Erfahrungsberichte)

---

## 🔧 Technische Implementierungs-Details

### Dependencies (npm install)

```json
{
  "dependencies": {
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "slugify": "^1.6.6",
    "reading-time": "^1.5.0",
    "date-fns": "^3.0.0",
    "recharts": "^2.10.0"
  },
  "devDependencies": {
    "@types/reading-time": "^1.5.0"
  }
}
```

### Environment Variables

```env
# Optional: Google Search Console
GOOGLE_SEARCH_CONSOLE_TOKEN=your_token_here

# Optional: IP Geolocation
IPSTACK_API_KEY=your_api_key_here

# Cron Secret
CRON_SECRET=random_secure_string_here
```

### Nginx Config Update

```nginx
# Separate cache for blog posts
location ~ ^/ratgeber/ {
    proxy_pass http://localhost:3000;
    proxy_cache blog_cache;
    proxy_cache_valid 200 60m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    add_header X-Cache-Status $upstream_cache_status;
}
```

---

## 📈 Success Metrics & KPIs

### Month 1:
- ✅ 20-30 Artikel veröffentlicht
- ✅ 1.000-2.000 organische Besucher
- ✅ 10+ Keywords in Top 100

### Month 3:
- ✅ 40-50 Artikel
- ✅ 5.000-10.000 organische Besucher
- ✅ 50+ Keywords in Top 100
- ✅ 5-10 Keywords in Top 10

### Month 6:
- ✅ 60+ Artikel
- ✅ 20.000-30.000 organische Besucher
- ✅ 10+ Keywords in Top 10
- ✅ 5-10% CTR zu Werkstatt-Suche
- ✅ Blog = 30% des Traffics

### ROI-Tracking:
```
Blog-Traffic → CTA-Klicks → Anfragen → Buchungen → Provision

Beispiel:
20.000 Besucher
→ 3% CTR (600 Klicks auf "Werkstatt finden")
→ 20% Anfragen (120 Anfragen)
→ 30% Conversion (36 Buchungen)
→ 50€ Provision = 1.800€ Umsatz

Kosten: 500€ Content + 0€ Entwicklung (einmalig)
ROI: 260%
```

---

## ✅ Checkliste vor Launch

### Development:
- [ ] Prisma Migration deployed
- [ ] Kategorien geseeded
- [ ] Admin-Kachel funktioniert
- [ ] CRUD-APIs getestet
- [ ] Public Pages rendern korrekt
- [ ] SEO-Meta-Tags generiert
- [ ] Schema.org JSON-LD vorhanden
- [ ] XML-Sitemap erreichbar
- [ ] Mobile-Responsive

### Content:
- [ ] Mindestens 10 Artikel veröffentlicht
- [ ] Featured Images hochgeladen
- [ ] Alt-Texte für Bilder
- [ ] Internal Links gesetzt
- [ ] SEO-Score >= 80 pro Artikel
- [ ] Kategorien erstellt

### SEO:
- [ ] Sitemap bei Google eingereicht
- [ ] robots.txt aktualisiert
- [ ] Canonical URLs gesetzt
- [ ] OpenGraph Tags vorhanden
- [ ] Breadcrumbs implementiert

### Marketing:
- [ ] Social Media Posts vorbereitet
- [ ] Newsletter vorbereitet
- [ ] Internal Links auf Homepage gesetzt
- [ ] Footer-Links zu Blog hinzugefügt

---

## 🎯 Quick Win: Priorisierung

**Wenn Zeit knapp ist, starte mit:**

### Minimaler MVP (2 Tage):
1. ✅ Prisma Schema + Migration (2h)
2. ✅ Posts API (CRUD) (3h)
3. ✅ Admin-Liste + Basis-Editor (4h)
4. ✅ Public Blog-Seite (3h)
5. ✅ 5 Artikel schreiben + veröffentlichen (4h)

**Ergebnis:** Funktionierender Blog mit 5 Artikeln

### Danach schrittweise erweitern:
- Woche 2: SEO-Features (Meta Tags, Score)
- Woche 3: Analytics (Views, Stats)
- Woche 4: Workflow (Review, Scheduling)

---

## 🚀 Ready to Start!

**Nächste Schritte:**
1. ✅ Dokumentation erstellt (diese Datei)
2. ⏳ Phase 1 starten: Database Setup
3. ⏳ Phase 1 fortsetzen: Backend APIs
4. ⏳ Phase 1 abschließen: Admin UI + Public Pages

**Geschätzter Zeitrahmen:**
- Phase 1 (MVP): 2-3 Tage
- Phase 2 (SEO): 1-2 Tage
- Phase 3 (Workflow): 1 Tag
- Phase 4 (Analytics): 1 Tag

**Total: 5-7 Entwicklungstage**

---

**Status:** 📋 Roadmap komplett - Ready for Implementation!
**Datum:** 26. Januar 2026
**Version:** 1.0
