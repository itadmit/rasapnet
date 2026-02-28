import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "commander",
  "shlishut",
  "viewer",
]);
export const soldierStatusEnum = pgEnum("soldier_status", [
  "active",
  "training",
  "exempt",
  "vacation",
]);
export const constraintTypeEnum = pgEnum("constraint_type", [
  "no_assign",
  "prefer_avoid",
  "only",
]);
export const dutyFrequencyEnum = pgEnum("duty_frequency", [
  "daily",
  "weekly",
  "monthly",
]);
export const dutyEventStatusEnum = pgEnum("duty_event_status", [
  "planned",
  "done",
  "swapped",
  "canceled",
  "missed",
]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "leave",
  "shabbat",
  "compassionate",
  "home",
  "other",
]);
export const whatsappLogTypeEnum = pgEnum("whatsapp_log_type", [
  "weekly_summary",
  "day_before",
  "manual",
]);

// ─── Users (Auth) ───────────────────────────────────────────────
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  phone: text("phone").notNull().unique(),
  role: userRoleEnum("role").notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// ─── Refresh Tokens ─────────────────────────────────────────────
export const refreshTokens = pgTable("refresh_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Departments ────────────────────────────────────────────────
export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Soldiers ───────────────────────────────────────────────────
export const soldiers = pgTable("soldiers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  fullName: text("full_name").notNull(),
  phoneE164: text("phone_e164").notNull(),
  departmentId: integer("department_id")
    .notNull()
    .references(() => departments.id, { onDelete: "cascade" }),
  status: soldierStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Soldier Constraints ────────────────────────────────────────
export const soldierConstraints = pgTable("soldier_constraints", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  soldierId: integer("soldier_id")
    .notNull()
    .references(() => soldiers.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week"),
  dateFrom: text("date_from"),
  dateTo: text("date_to"),
  constraintType: constraintTypeEnum("constraint_type").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Duty Types ─────────────────────────────────────────────────
export const dutyTypes = pgTable("duty_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  weightPoints: real("weight_points").notNull().default(1),
  defaultRequiredPeople: integer("default_required_people").notNull().default(1),
  defaultFrequency: dutyFrequencyEnum("default_frequency")
    .notNull()
    .default("daily"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Duty Events (Instances) ────────────────────────────────────
export const dutyEvents = pgTable("duty_events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  dutyTypeId: integer("duty_type_id")
    .notNull()
    .references(() => dutyTypes.id, { onDelete: "cascade" }),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }),
  status: dutyEventStatusEnum("status").notNull().default("planned"),
  createdBy: integer("created_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Duty Assignments ───────────────────────────────────────────
export const dutyAssignments = pgTable("duty_assignments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  dutyEventId: integer("duty_event_id")
    .notNull()
    .references(() => dutyEvents.id, { onDelete: "cascade" }),
  soldierId: integer("soldier_id")
    .notNull()
    .references(() => soldiers.id, { onDelete: "cascade" }),
  roleLabel: text("role_label"),
  isConfirmed: boolean("is_confirmed").default(false),
  doneAt: timestamp("done_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Points Ledger ──────────────────────────────────────────────
export const pointsLedger = pgTable("points_ledger", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  soldierId: integer("soldier_id")
    .notNull()
    .references(() => soldiers.id, { onDelete: "cascade" }),
  dutyEventId: integer("duty_event_id").references(() => dutyEvents.id, {
    onDelete: "set null",
  }),
  pointsDelta: real("points_delta").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Attendance Records ─────────────────────────────────────────
export const attendanceRecords = pgTable("attendance_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  soldierId: integer("soldier_id")
    .notNull()
    .references(() => soldiers.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  notes: text("notes"),
  reportedBy: integer("reported_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── Attendance Audit Log ────────────────────────────────────────
export const attendanceAuditLog = pgTable("attendance_audit_log", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  attendanceRecordId: integer("attendance_record_id")
    .notNull()
    .references(() => attendanceRecords.id, { onDelete: "cascade" }),
  oldStatus: text("old_status").notNull(),
  newStatus: text("new_status").notNull(),
  oldNotes: text("old_notes"),
  newNotes: text("new_notes"),
  editedBy: integer("edited_by")
    .notNull()
    .references(() => users.id),
  editedAt: timestamp("edited_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── WhatsApp Settings ──────────────────────────────────────────
export const whatsappSettings = pgTable("whatsapp_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  tokenEncrypted: text("token_encrypted"),
  instanceId: text("instance_id"),
  isEnabled: boolean("is_enabled").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

// ─── WhatsApp Logs ──────────────────────────────────────────────
export const whatsappLogs = pgTable("whatsapp_logs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  soldierId: integer("soldier_id")
    .notNull()
    .references(() => soldiers.id, { onDelete: "cascade" }),
  dutyEventId: integer("duty_event_id").references(() => dutyEvents.id, {
    onDelete: "set null",
  }),
  type: whatsappLogTypeEnum("type").notNull(),
  requestUrlSanitized: text("request_url_sanitized"),
  responseJson: text("response_json"),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
