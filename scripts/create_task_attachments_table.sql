-- Create employee_task_attachments table
-- This table stores file attachments for employee tasks

CREATE TABLE IF NOT EXISTS "employee_task_attachments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "downloadUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_task_attachments_pkey" PRIMARY KEY ("id")
);

-- Create index on taskId for faster queries
CREATE INDEX IF NOT EXISTS "employee_task_attachments_taskId_idx" ON "employee_task_attachments"("taskId");

-- Add foreign key constraints
ALTER TABLE "employee_task_attachments" 
ADD CONSTRAINT "employee_task_attachments_taskId_fkey" 
FOREIGN KEY ("taskId") REFERENCES "employee_tasks"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_task_attachments" 
ADD CONSTRAINT "employee_task_attachments_uploadedById_fkey" 
FOREIGN KEY ("uploadedById") REFERENCES "b24_employees"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Grant permissions (if needed)
-- GRANT ALL ON "employee_task_attachments" TO bereifung24user;
