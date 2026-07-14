-- CreateEnum
CREATE TYPE "application_status_enum" AS ENUM ('NEW', 'SLOT_BOOKED', 'INTERVIEWED', 'SELECTED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "candidate_file_type_enum" AS ENUM ('RESUME', 'ORG_PROOF');

-- CreateEnum
CREATE TYPE "permission_enum" AS ENUM ('CAREER_VIEW', 'CAREER_EDIT', 'CAREER_EXPORT', 'CAREER_ADMIN', 'CAREER_REPORTS', 'CAREER_INTERVIEW');

-- CreateEnum
CREATE TYPE "log_status_enum" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "notification_channel_enum" AS ENUM ('IN_APP', 'EMAIL', 'WHATSAPP');

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_hiring_enabled" BOOLEAN NOT NULL DEFAULT false,
    "synced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_employees" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "department_id" UUID,
    "performx_role" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "synced_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_role_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "performx_role" VARCHAR(50) NOT NULL,
    "permission" "permission_enum" NOT NULL,

    CONSTRAINT "hr_role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "mobile_number" VARCHAR(20) NOT NULL,
    "whatsapp_number" VARCHAR(20),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_code" VARCHAR(20) NOT NULL,
    "candidate_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "self_description" TEXT NOT NULL,
    "status" "application_status_enum" NOT NULL DEFAULT 'NEW',
    "assigned_hr_id" UUID,
    "rejection_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "file_type" "candidate_file_type_enum" NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "storage_path" VARCHAR(500) NOT NULL,
    "file_size_kb" INTEGER,
    "mime_type" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "hr_id" UUID NOT NULL,
    "department_id" UUID,
    "slot_date" DATE NOT NULL,
    "slot_time" TIME NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slot_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "slot_id" UUID NOT NULL,
    "assigned_hr_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "slot_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "hr_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "hr_id" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID NOT NULL,
    "from_status" "application_status_enum",
    "to_status" "application_status_enum" NOT NULL,
    "changed_by_id" UUID,
    "reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID,
    "recipient" VARCHAR(255) NOT NULL,
    "template" VARCHAR(100) NOT NULL,
    "status" "log_status_enum" NOT NULL DEFAULT 'QUEUED',
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "application_id" UUID,
    "recipient_hr_id" UUID,
    "channel" "notification_channel_enum" NOT NULL DEFAULT 'IN_APP',
    "message" TEXT NOT NULL,
    "status" "log_status_enum" NOT NULL DEFAULT 'QUEUED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" UUID,
    "action" VARCHAR(255) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entity_id" UUID NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "ip_address" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE INDEX "idx_departments_hiring" ON "departments"("is_hiring_enabled");

-- CreateIndex
CREATE INDEX "hr_employees_department_id_idx" ON "hr_employees"("department_id");

-- CreateIndex
CREATE INDEX "hr_employees_performx_role_idx" ON "hr_employees"("performx_role");

-- CreateIndex
CREATE INDEX "hr_role_permissions_performx_role_idx" ON "hr_role_permissions"("performx_role");

-- CreateIndex
CREATE UNIQUE INDEX "hr_role_permissions_performx_role_permission_key" ON "hr_role_permissions"("performx_role", "permission");

-- CreateIndex
CREATE INDEX "idx_candidates_email" ON "candidates"("email");

-- CreateIndex
CREATE INDEX "idx_candidates_mobile" ON "candidates"("mobile_number");

-- CreateIndex
CREATE INDEX "idx_candidates_deleted" ON "candidates"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "applications_application_code_key" ON "applications"("application_code");

-- CreateIndex
CREATE INDEX "idx_applications_status_deleted_created" ON "applications"("status", "deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "idx_applications_dept_status_deleted" ON "applications"("department_id", "status", "deleted_at");

-- CreateIndex
CREATE INDEX "idx_applications_hr_status" ON "applications"("assigned_hr_id", "status");

-- CreateIndex
CREATE INDEX "applications_candidate_id_idx" ON "applications"("candidate_id");

-- CreateIndex
CREATE INDEX "idx_files_application_type" ON "candidate_files"("application_id", "file_type");

-- CreateIndex
CREATE INDEX "idx_slots_date_time_booked" ON "interview_slots"("slot_date", "slot_time", "is_booked");

-- CreateIndex
CREATE INDEX "interview_slots_hr_id_slot_date_idx" ON "interview_slots"("hr_id", "slot_date");

-- CreateIndex
CREATE UNIQUE INDEX "uq_hr_slot" ON "interview_slots"("hr_id", "slot_date", "slot_time");

-- CreateIndex
CREATE UNIQUE INDEX "slot_assignments_application_id_key" ON "slot_assignments"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "slot_assignments_slot_id_key" ON "slot_assignments"("slot_id");

-- CreateIndex
CREATE INDEX "slot_assignments_assigned_hr_id_idx" ON "slot_assignments"("assigned_hr_id");

-- CreateIndex
CREATE INDEX "interview_feedback_application_id_idx" ON "interview_feedback"("application_id");

-- CreateIndex
CREATE INDEX "idx_hr_notes_app_created" ON "hr_notes"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_status_history_app_created" ON "status_history"("application_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_email_logs_status_created" ON "email_logs"("status", "created_at");

-- CreateIndex
CREATE INDEX "email_logs_application_id_idx" ON "email_logs"("application_id");

-- CreateIndex
CREATE INDEX "notification_logs_status_created_at_idx" ON "notification_logs"("status", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_recipient_hr_id_idx" ON "notification_logs"("recipient_hr_id");

-- CreateIndex
CREATE INDEX "idx_audit_entity" ON "audit_logs"("entity", "entity_id");

-- CreateIndex
CREATE INDEX "idx_audit_actor" ON "audit_logs"("actor_id");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_assigned_hr_id_fkey" FOREIGN KEY ("assigned_hr_id") REFERENCES "hr_employees"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_files" ADD CONSTRAINT "candidate_files_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_slots" ADD CONSTRAINT "interview_slots_hr_id_fkey" FOREIGN KEY ("hr_id") REFERENCES "hr_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_slots" ADD CONSTRAINT "interview_slots_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_assignments" ADD CONSTRAINT "slot_assignments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_assignments" ADD CONSTRAINT "slot_assignments_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "interview_slots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slot_assignments" ADD CONSTRAINT "slot_assignments_assigned_hr_id_fkey" FOREIGN KEY ("assigned_hr_id") REFERENCES "hr_employees"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_feedback" ADD CONSTRAINT "interview_feedback_hr_id_fkey" FOREIGN KEY ("hr_id") REFERENCES "hr_employees"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_notes" ADD CONSTRAINT "hr_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_notes" ADD CONSTRAINT "hr_notes_hr_id_fkey" FOREIGN KEY ("hr_id") REFERENCES "hr_employees"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_changed_by_id_fkey" FOREIGN KEY ("changed_by_id") REFERENCES "hr_employees"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;
