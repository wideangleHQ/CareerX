ALTER TABLE "notification_logs" ADD COLUMN IF NOT EXISTS "read_at" TIMESTAMPTZ(6);

CREATE INDEX IF NOT EXISTS "idx_notifications_recipient_read_created"
ON "notification_logs"("recipient_hr_id", "read_at", "created_at");
