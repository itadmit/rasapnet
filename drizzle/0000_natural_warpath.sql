CREATE TYPE "public"."attendance_status" AS ENUM('present', 'leave', 'shabbat', 'compassionate', 'home', 'other');--> statement-breakpoint
CREATE TYPE "public"."constraint_type" AS ENUM('no_assign', 'prefer_avoid', 'only');--> statement-breakpoint
CREATE TYPE "public"."duty_event_status" AS ENUM('planned', 'done', 'swapped', 'canceled', 'missed');--> statement-breakpoint
CREATE TYPE "public"."duty_frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."soldier_status" AS ENUM('active', 'training', 'exempt', 'vacation');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'commander', 'shlishut', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_log_type" AS ENUM('weekly_summary', 'day_before', 'manual');--> statement-breakpoint
CREATE TABLE "attendance_audit_log" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_audit_log_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"attendance_record_id" integer NOT NULL,
	"old_status" text NOT NULL,
	"new_status" text NOT NULL,
	"old_notes" text,
	"new_notes" text,
	"edited_by" integer NOT NULL,
	"edited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "attendance_records_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"soldier_id" integer NOT NULL,
	"date" text NOT NULL,
	"status" "attendance_status" NOT NULL,
	"notes" text,
	"reported_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "departments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "departments_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "duty_assignments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "duty_assignments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"duty_event_id" integer NOT NULL,
	"soldier_id" integer NOT NULL,
	"role_label" text,
	"is_confirmed" boolean DEFAULT false,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duty_events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "duty_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"duty_type_id" integer NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone,
	"status" "duty_event_status" DEFAULT 'planned' NOT NULL,
	"created_by" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "duty_types" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "duty_types_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"category" text NOT NULL,
	"weight_points" real DEFAULT 1 NOT NULL,
	"default_required_people" integer DEFAULT 1 NOT NULL,
	"default_frequency" "duty_frequency" DEFAULT 'daily' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "points_ledger_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"soldier_id" integer NOT NULL,
	"duty_event_id" integer,
	"points_delta" real NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "refresh_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "soldier_constraints" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "soldier_constraints_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"soldier_id" integer NOT NULL,
	"day_of_week" integer,
	"date_from" text,
	"date_to" text,
	"constraint_type" "constraint_type" NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "soldiers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "soldiers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"full_name" text NOT NULL,
	"phone_e164" text NOT NULL,
	"department_id" integer NOT NULL,
	"status" "soldier_status" DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"role" "user_role" DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "whatsapp_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"soldier_id" integer NOT NULL,
	"duty_event_id" integer,
	"type" "whatsapp_log_type" NOT NULL,
	"request_url_sanitized" text,
	"response_json" text,
	"success" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "whatsapp_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"token_encrypted" text,
	"instance_id" text,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_audit_log" ADD CONSTRAINT "attendance_audit_log_attendance_record_id_attendance_records_id_fk" FOREIGN KEY ("attendance_record_id") REFERENCES "public"."attendance_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_audit_log" ADD CONSTRAINT "attendance_audit_log_edited_by_users_id_fk" FOREIGN KEY ("edited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_assignments" ADD CONSTRAINT "duty_assignments_duty_event_id_duty_events_id_fk" FOREIGN KEY ("duty_event_id") REFERENCES "public"."duty_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_assignments" ADD CONSTRAINT "duty_assignments_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_events" ADD CONSTRAINT "duty_events_duty_type_id_duty_types_id_fk" FOREIGN KEY ("duty_type_id") REFERENCES "public"."duty_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "duty_events" ADD CONSTRAINT "duty_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_duty_event_id_duty_events_id_fk" FOREIGN KEY ("duty_event_id") REFERENCES "public"."duty_events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldier_constraints" ADD CONSTRAINT "soldier_constraints_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "soldiers" ADD CONSTRAINT "soldiers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_soldier_id_soldiers_id_fk" FOREIGN KEY ("soldier_id") REFERENCES "public"."soldiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD CONSTRAINT "whatsapp_logs_duty_event_id_duty_events_id_fk" FOREIGN KEY ("duty_event_id") REFERENCES "public"."duty_events"("id") ON DELETE set null ON UPDATE no action;