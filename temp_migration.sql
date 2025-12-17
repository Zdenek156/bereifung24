-- CreateTable
CREATE TABLE "page_views" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "fullUrl" TEXT,
    "pageTitle" TEXT,
    "userId" TEXT,
    "userRole" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "referrer" TEXT,
    "workshopId" TEXT,
    "sessionId" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_views_path_idx" ON "page_views"("path");

-- CreateIndex
CREATE INDEX "page_views_workshopId_idx" ON "page_views"("workshopId");

-- CreateIndex
CREATE INDEX "page_views_viewedAt_idx" ON "page_views"("viewedAt");

-- CreateIndex
CREATE INDEX "page_views_userId_idx" ON "page_views"("userId");
