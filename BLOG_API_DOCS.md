# Blog API Endpoints - Test Guide

## Authentication
All endpoints require authentication as B24_EMPLOYEE with ADMIN role.

## Base URL
`https://bereifung24.de/api/admin/blog`

---

## Posts API

### GET /api/admin/blog/posts
List all posts with filters and pagination

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `status` (DRAFT | REVIEW | PUBLISHED | ARCHIVED)
- `categoryId` (string)
- `audience` (CUSTOMER | WORKSHOP | BOTH)
- `authorId` (string)
- `search` (string) - searches in title, content, excerpt

**Example:**
```bash
curl "https://bereifung24.de/api/admin/blog/posts?page=1&limit=10&status=PUBLISHED"
```

### POST /api/admin/blog/posts
Create new post

**Body:**
```json
{
  "title": "Reifenwechsel im Frühling - Der ultimative Guide",
  "slug": "reifenwechsel-fruehling-guide",
  "excerpt": "Alles was Sie über den Reifenwechsel im Frühling wissen müssen",
  "content": "## Wann ist der richtige Zeitpunkt?\n\nDie O-bis-O-Regel...",
  "categoryId": "category-id-here",
  "tags": ["Reifenwechsel", "Saisonales", "Frühjahr"],
  "targetAudience": "CUSTOMER",
  "status": "DRAFT",
  "featuredImage": "https://example.com/image.jpg",
  "imageAlt": "Reifenwechsel Werkstatt",
  "metaTitle": "Reifenwechsel im Frühling 2026 - Guide",
  "metaDescription": "Wann wechseln? Was kostet es? Alle Infos...",
  "keywords": ["Reifenwechsel", "Frühjahr", "Sommerreifen"],
  "focusKeyword": "Reifenwechsel Frühling"
}
```

### GET /api/admin/blog/posts/[id]
Get single post with details

### PUT /api/admin/blog/posts/[id]
Update post (same body as POST)

**Additional field:**
- `changeNote` (string) - Note for revision history

### DELETE /api/admin/blog/posts/[id]
Delete post (only if no views or revisions)

### POST /api/admin/blog/posts/[id]/publish
Publish draft post

### POST /api/admin/blog/posts/[id]/archive
Archive published post

---

## Categories API

### GET /api/admin/blog/categories
List all categories

**Query Parameters:**
- `hierarchy` (true | false) - If true, returns tree structure with children

**Example:**
```bash
curl "https://bereifung24.de/api/admin/blog/categories?hierarchy=true"
```

### POST /api/admin/blog/categories
Create new category

**Body:**
```json
{
  "name": "Test-Kategorie",
  "slug": "test-kategorie",
  "description": "Beschreibung der Kategorie",
  "icon": "🧪",
  "color": "#FF5733",
  "parentId": null,
  "seoTitle": "Test-Kategorie - SEO Title",
  "seoDescription": "SEO Description",
  "sortOrder": 12
}
```

### GET /api/admin/blog/categories/[id]
Get single category with posts

### PUT /api/admin/blog/categories/[id]
Update category (same body as POST)

### DELETE /api/admin/blog/categories/[id]
Delete category (only if no posts and no children)

---

## Tags API

### GET /api/admin/blog/tags
List all tags

**Query Parameters:**
- `search` (string)
- `sortBy` (usage | name | recent, default: usage)

**Example:**
```bash
curl "https://bereifung24.de/api/admin/blog/tags?sortBy=usage"
```

### POST /api/admin/blog/tags
Create new tag

**Body:**
```json
{
  "name": "Neuer Tag",
  "slug": "neuer-tag"
}
```

### GET /api/admin/blog/tags/[id]
Get single tag with posts

### PUT /api/admin/blog/tags/[id]
Update tag

### DELETE /api/admin/blog/tags/[id]
Delete tag (only if no posts)

---

## Stats API

### GET /api/admin/blog/stats
Get blog statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalPosts": 25,
      "publishedCount": 15,
      "draftCount": 8,
      "reviewCount": 2,
      "archivedCount": 0,
      "totalCategories": 11,
      "totalTags": 42,
      "totalViews": 1523,
      "viewsLast30Days": 892
    },
    "recentPosts": [...],
    "topPosts": [...],
    "postsByCategory": [...],
    "topTags": [...]
  }
}
```

---

## Response Format

All endpoints return JSON in this format:

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Paginated:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

---

## Features

✅ **Authentication:** requireAdminOrEmployee middleware
✅ **Pagination:** Page-based with limit control
✅ **Filtering:** Multiple filter options (status, category, audience, author)
✅ **Search:** Full-text search in title, content, excerpt
✅ **Relations:** Includes related data (author, category, tags)
✅ **Validation:** Required fields, unique constraints, circular reference prevention
✅ **Revisions:** Automatic revision creation on edits
✅ **Tag Management:** Auto-increment/decrement usage count
✅ **Reading Time:** Auto-calculated based on word count (200 WPM)
✅ **Status Workflow:** DRAFT → REVIEW → PUBLISHED → ARCHIVED
✅ **Hierarchical Categories:** Parent-child relationships with validation
✅ **Statistics:** Comprehensive blog stats with top posts and categories
