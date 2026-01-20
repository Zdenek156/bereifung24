-- CreateEnum
CREATE TYPE "RoadmapTaskPriority" AS ENUM ('P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW');

-- CreateEnum  
CREATE TYPE "RoadmapTaskStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED');

-- CreateTable
CREATE TABLE "roadmap_phases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startMonth" TEXT NOT NULL,
    "endMonth" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roadmap_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "RoadmapTaskPriority" NOT NULL,
    "status" "RoadmapTaskStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "assignedToId" TEXT,
    "phaseId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "category" TEXT,
    "tags" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "blockedReason" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roadmap_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "roadmap_tasks_assignedToId_phaseId_month_status_priority_idx" ON "roadmap_tasks"("assignedToId", "phaseId", "month", "status", "priority");

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "b24_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "roadmap_phases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "b24_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_tasks" ADD CONSTRAINT "roadmap_tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "b24_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
