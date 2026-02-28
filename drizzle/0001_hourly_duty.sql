-- Add duty_schedule_type enum for hourly rotation support
CREATE TYPE "public"."duty_schedule_type" AS ENUM('daily', 'hourly');
--> statement-breakpoint
ALTER TABLE "duty_types" ADD COLUMN "schedule_type" "duty_schedule_type" DEFAULT 'daily' NOT NULL;
--> statement-breakpoint
ALTER TABLE "duty_types" ADD COLUMN "rotation_interval_hours" integer;
--> statement-breakpoint
ALTER TABLE "duty_types" ADD COLUMN "default_start_hour" integer;
--> statement-breakpoint
ALTER TABLE "duty_types" ADD COLUMN "default_end_hour" integer;
--> statement-breakpoint
ALTER TABLE "duty_assignments" ADD COLUMN "slot_start_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "duty_assignments" ADD COLUMN "slot_end_at" timestamp with time zone;
