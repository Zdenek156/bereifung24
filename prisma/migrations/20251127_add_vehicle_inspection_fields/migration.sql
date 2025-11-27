-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN "nextInspectionDate" TIMESTAMP(3),
ADD COLUMN "inspectionReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "inspectionReminderDays" INTEGER DEFAULT 30;
