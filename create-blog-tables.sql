-- Blog System Tables Migration
-- Date: 2026-01-26

-- Create Enums
DO $$ BEGIN
    CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "BlogAudience" AS ENUM ('CUSTOMER', 'WORKSHOP', 'BOTH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS "blog_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "parentId" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_categories_slug_key" ON "blog_categories"("slug");
CREATE INDEX IF NOT EXISTS "blog_categories_slug_idx" ON "blog_categories"("slug");
CREATE INDEX IF NOT EXISTS "blog_categories_parentId_idx" ON "blog_categories"("parentId");

-- Add foreign key for self-referencing
ALTER TABLE "blog_categories" DROP CONSTRAINT IF EXISTS "blog_categories_parentId_fkey";
ALTER TABLE "blog_categories" ADD CONSTRAINT "blog_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Create blog_tags table
CREATE TABLE IF NOT EXISTS "blog_tags" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_tags_slug_key" ON "blog_tags"("slug");
CREATE INDEX IF NOT EXISTS "blog_tags_slug_idx" ON "blog_tags"("slug");
CREATE INDEX IF NOT EXISTS "blog_tags_usageCount_idx" ON "blog_tags"("usageCount");

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "featuredImage" TEXT,
    "imageAlt" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "keywords" TEXT[],
    "canonicalUrl" TEXT,
    "focusKeyword" TEXT,
    "categoryId" TEXT NOT NULL,
    "targetAudience" "BlogAudience" NOT NULL,
    "status" "BlogStatus" NOT NULL,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "readTime" INTEGER,
    "seoScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_slug_idx" ON "blog_posts"("slug");
CREATE INDEX IF NOT EXISTS "blog_posts_status_publishedAt_idx" ON "blog_posts"("status", "publishedAt");
CREATE INDEX IF NOT EXISTS "blog_posts_categoryId_idx" ON "blog_posts"("categoryId");
CREATE INDEX IF NOT EXISTS "blog_posts_targetAudience_idx" ON "blog_posts"("targetAudience");
CREATE INDEX IF NOT EXISTS "blog_posts_authorId_idx" ON "blog_posts"("authorId");

-- Add foreign keys for blog_posts
ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_categoryId_fkey";
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_authorId_fkey";
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "b24_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "blog_posts" DROP CONSTRAINT IF EXISTS "blog_posts_reviewerId_fkey";
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "b24_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create junction table for many-to-many relationship between posts and tags
CREATE TABLE IF NOT EXISTS "_BlogPostToBlTagTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_BlogPostToBlTagTag_AB_unique" ON "_BlogPostToBlTagTag"("A", "B");
CREATE INDEX IF NOT EXISTS "_BlogPostToBlTagTag_B_index" ON "_BlogPostToBlTagTag"("B");

ALTER TABLE "_BlogPostToBlTagTag" DROP CONSTRAINT IF EXISTS "_BlogPostToBlTagTag_A_fkey";
ALTER TABLE "_BlogPostToBlTagTag" ADD CONSTRAINT "_BlogPostToBlTagTag_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_BlogPostToBlTagTag" DROP CONSTRAINT IF EXISTS "_BlogPostToBlTagTag_B_fkey";
ALTER TABLE "_BlogPostToBlTagTag" ADD CONSTRAINT "_BlogPostToBlTagTag_B_fkey" FOREIGN KEY ("B") REFERENCES "blog_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create junction table for related posts (self-referencing many-to-many)
CREATE TABLE IF NOT EXISTS "_RelatedPosts" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_RelatedPosts_AB_unique" ON "_RelatedPosts"("A", "B");
CREATE INDEX IF NOT EXISTS "_RelatedPosts_B_index" ON "_RelatedPosts"("B");

ALTER TABLE "_RelatedPosts" DROP CONSTRAINT IF EXISTS "_RelatedPosts_A_fkey";
ALTER TABLE "_RelatedPosts" ADD CONSTRAINT "_RelatedPosts_A_fkey" FOREIGN KEY ("A") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_RelatedPosts" DROP CONSTRAINT IF EXISTS "_RelatedPosts_B_fkey";
ALTER TABLE "_RelatedPosts" ADD CONSTRAINT "_RelatedPosts_B_fkey" FOREIGN KEY ("B") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create blog_views table
CREATE TABLE IF NOT EXISTS "blog_views" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referer" TEXT,
    "country" TEXT,
    "city" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "blog_views_postId_idx" ON "blog_views"("postId");
CREATE INDEX IF NOT EXISTS "blog_views_viewedAt_idx" ON "blog_views"("viewedAt");

ALTER TABLE "blog_views" DROP CONSTRAINT IF EXISTS "blog_views_postId_fkey";
ALTER TABLE "blog_views" ADD CONSTRAINT "blog_views_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create blog_post_revisions table
CREATE TABLE IF NOT EXISTS "blog_post_revisions" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "authorId" TEXT NOT NULL,
    "changeNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "blog_post_revisions_postId_idx" ON "blog_post_revisions"("postId");
CREATE INDEX IF NOT EXISTS "blog_post_revisions_createdAt_idx" ON "blog_post_revisions"("createdAt");

ALTER TABLE "blog_post_revisions" DROP CONSTRAINT IF EXISTS "blog_post_revisions_postId_fkey";
ALTER TABLE "blog_post_revisions" ADD CONSTRAINT "blog_post_revisions_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blog_post_revisions" DROP CONSTRAINT IF EXISTS "blog_post_revisions_authorId_fkey";
ALTER TABLE "blog_post_revisions" ADD CONSTRAINT "blog_post_revisions_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "b24_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Blog System tables created successfully!';
END $$;
