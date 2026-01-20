-- Add permissions columns to b24_employee_applications
ALTER TABLE "b24_employee_applications" 
ADD COLUMN "canCreateTasks" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "canEditTasks" BOOLEAN NOT NULL DEFAULT false;

-- Create roadmap_task_help_offers table
CREATE TABLE "roadmap_task_help_offers" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "helperId" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roadmap_task_help_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roadmap_task_help_offers_taskId_helperId_key" ON "roadmap_task_help_offers"("taskId", "helperId");

-- AddForeignKey
ALTER TABLE "roadmap_task_help_offers" ADD CONSTRAINT "roadmap_task_help_offers_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "roadmap_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roadmap_task_help_offers" ADD CONSTRAINT "roadmap_task_help_offers_helperId_fkey" FOREIGN KEY ("helperId") REFERENCES "b24_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
