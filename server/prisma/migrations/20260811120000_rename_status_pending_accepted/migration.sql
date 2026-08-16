-- Rename application status enum values: NEW -> PENDING, SLOT_BOOKED -> ACCEPTED
ALTER TYPE "application_status_enum" RENAME VALUE 'NEW' TO 'PENDING';
ALTER TYPE "application_status_enum" RENAME VALUE 'SLOT_BOOKED' TO 'ACCEPTED';
