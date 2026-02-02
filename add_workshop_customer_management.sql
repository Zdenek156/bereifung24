-- CreateTable: Workshop Customer Management (CRM)

CREATE TABLE "workshop_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workshop_id" TEXT NOT NULL,
    "customer_type" TEXT NOT NULL DEFAULT 'PRIVATE',
    "salutation" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "company_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "street" TEXT,
    "zip_code" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Deutschland',
    "tags" TEXT,
    "segment" TEXT,
    "importance" TEXT DEFAULT 'NORMAL',
    "total_bookings" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "last_booking_date" TIMESTAMP(3),
    "first_booking_date" TIMESTAMP(3),
    "average_rating" DOUBLE PRECISION,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "bereifung24_user_id" TEXT,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "marketing_consent_date" TIMESTAMP(3),
    "notes" TEXT,
    "data_processing_consent" BOOLEAN NOT NULL DEFAULT true,
    "data_processing_consent_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletion_requested" BOOLEAN NOT NULL DEFAULT false,
    "deletion_requested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workshop_customers_workshop_id_fkey" FOREIGN KEY ("workshop_id") REFERENCES "workshops" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workshop_customers_workshop_id_email_key" ON "workshop_customers"("workshop_id", "email");
CREATE INDEX "workshop_customers_workshop_id_idx" ON "workshop_customers"("workshop_id");
CREATE INDEX "workshop_customers_email_idx" ON "workshop_customers"("email");
CREATE INDEX "workshop_customers_phone_idx" ON "workshop_customers"("phone");
CREATE INDEX "workshop_customers_last_name_idx" ON "workshop_customers"("last_name");
CREATE INDEX "workshop_customers_source_idx" ON "workshop_customers"("source");
CREATE INDEX "workshop_customers_bereifung24_user_id_idx" ON "workshop_customers"("bereifung24_user_id");

-- CreateTable: Workshop Vehicles
CREATE TABLE "workshop_vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "vin" TEXT UNIQUE,
    "license_plate" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "model_year" INTEGER,
    "color" TEXT,
    "engine_type" TEXT,
    "displacement" INTEGER,
    "power" INTEGER,
    "fuel_type" TEXT,
    "transmission" TEXT,
    "front_tire_size" TEXT,
    "rear_tire_size" TEXT,
    "wheel_size" TEXT,
    "current_mileage" INTEGER,
    "last_mileage_update" TIMESTAMP(3),
    "first_registration" TIMESTAMP(3),
    "next_inspection" TIMESTAMP(3),
    "next_emission_test" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sold_date" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workshop_vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "workshop_customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "workshop_vehicles_customer_id_idx" ON "workshop_vehicles"("customer_id");
CREATE INDEX "workshop_vehicles_vin_idx" ON "workshop_vehicles"("vin");
CREATE INDEX "workshop_vehicles_license_plate_idx" ON "workshop_vehicles"("license_plate");
CREATE INDEX "workshop_vehicles_next_inspection_idx" ON "workshop_vehicles"("next_inspection");

-- CreateTable: Workshop Service Records
CREATE TABLE "workshop_service_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "workshop_id" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "service_description" TEXT NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "mileage" INTEGER,
    "labor_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "parts_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
    "payment_method" TEXT,
    "paid_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMP(3),
    "next_service_due" TIMESTAMP(3),
    "next_service_type" TEXT,
    "booking_id" TEXT UNIQUE,
    "invoice_number" TEXT UNIQUE,
    "invoice_url" TEXT,
    "mechanic_name" TEXT,
    "work_order_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workshop_service_records_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "workshop_customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workshop_service_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "workshop_vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workshop_service_records_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "workshop_service_records_customer_id_idx" ON "workshop_service_records"("customer_id");
CREATE INDEX "workshop_service_records_vehicle_id_idx" ON "workshop_service_records"("vehicle_id");
CREATE INDEX "workshop_service_records_workshop_id_idx" ON "workshop_service_records"("workshop_id");
CREATE INDEX "workshop_service_records_service_date_idx" ON "workshop_service_records"("service_date");
CREATE INDEX "workshop_service_records_booking_id_idx" ON "workshop_service_records"("booking_id");

-- CreateTable: Workshop Communications
CREATE TABLE "workshop_communications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "email_from" TEXT,
    "email_to" TEXT,
    "email_opened" BOOLEAN NOT NULL DEFAULT false,
    "email_opened_at" TIMESTAMP(3),
    "phone_number" TEXT,
    "duration" INTEGER,
    "status" TEXT DEFAULT 'COMPLETED',
    "related_to" TEXT,
    "related_id" TEXT,
    "created_by" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workshop_communications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "workshop_customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "workshop_communications_customer_id_idx" ON "workshop_communications"("customer_id");
CREATE INDEX "workshop_communications_workshop_id_idx" ON "workshop_communications"("workshop_id");
CREATE INDEX "workshop_communications_type_idx" ON "workshop_communications"("type");
CREATE INDEX "workshop_communications_occurred_at_idx" ON "workshop_communications"("occurred_at");

-- CreateTable: Workshop Documents
CREATE TABLE "workshop_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "workshop_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "related_to" TEXT,
    "related_id" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workshop_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "workshop_customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "workshop_documents_customer_id_idx" ON "workshop_documents"("customer_id");
CREATE INDEX "workshop_documents_workshop_id_idx" ON "workshop_documents"("workshop_id");
CREATE INDEX "workshop_documents_type_idx" ON "workshop_documents"("type");

-- CreateTable: Workshop Reminders
CREATE TABLE "workshop_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "workshop_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reminder_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sent_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "send_email" BOOLEAN NOT NULL DEFAULT true,
    "send_sms" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_interval" INTEGER,
    "next_reminder_date" TIMESTAMP(3),
    "auto_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workshop_reminders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "workshop_customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workshop_reminders_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "workshop_vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "workshop_reminders_customer_id_idx" ON "workshop_reminders"("customer_id");
CREATE INDEX "workshop_reminders_vehicle_id_idx" ON "workshop_reminders"("vehicle_id");
CREATE INDEX "workshop_reminders_workshop_id_idx" ON "workshop_reminders"("workshop_id");
CREATE INDEX "workshop_reminders_reminder_date_idx" ON "workshop_reminders"("reminder_date");
CREATE INDEX "workshop_reminders_status_idx" ON "workshop_reminders"("status");

-- CreateTable: Workshop Manual Appointments
CREATE TABLE "workshop_manual_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workshop_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "vehicle_id" TEXT,
    "customer_name" TEXT,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "vehicle_make" TEXT,
    "vehicle_model" TEXT,
    "license_plate" TEXT,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "appointment_time" TEXT NOT NULL,
    "estimated_duration" INTEGER NOT NULL DEFAULT 60,
    "service_type" TEXT,
    "service_description" TEXT,
    "estimated_price" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "confirmed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "cancellation_reason" TEXT,
    "employee_id" TEXT,
    "google_event_id" TEXT,
    "customer_notes" TEXT,
    "workshop_notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "workshop_manual_appointments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "workshop_customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "workshop_manual_appointments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "workshop_manual_appointments_workshop_id_idx" ON "workshop_manual_appointments"("workshop_id");
CREATE INDEX "workshop_manual_appointments_customer_id_idx" ON "workshop_manual_appointments"("customer_id");
CREATE INDEX "workshop_manual_appointments_appointment_date_idx" ON "workshop_manual_appointments"("appointment_date");
CREATE INDEX "workshop_manual_appointments_status_idx" ON "workshop_manual_appointments"("status");

-- Add relations to existing Booking table
ALTER TABLE "bookings" ADD COLUMN "workshop_customer_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN "workshop_vehicle_id" TEXT;

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_workshop_customer_id_fkey" 
    FOREIGN KEY ("workshop_customer_id") REFERENCES "workshop_customers" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
    
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_workshop_vehicle_id_fkey" 
    FOREIGN KEY ("workshop_vehicle_id") REFERENCES "workshop_vehicles" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
