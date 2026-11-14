import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Gap } from "../ontology/clarity";
import type { Outcome } from "../ontology/engine";
import type { Holder, RecordPart } from "../ontology/record";
import type { Intake } from "../ontology/schema";
import type { Person } from "../sim/people";

export const CHANNELS = ["web_call", "phone", "sample"] as const;
export const CALL_STATUSES = ["ringing", "verifying", "verified", "screened", "ended"] as const;
export const TOOLS = ["verify_identity", "get_case", "record_intake", "book_time"] as const;
/** inbound: the patient called the line. callback: Polku calls the patient to book a time the nurse proposed. */
export const CALL_PURPOSES = ["inbound", "callback"] as const;
/** What the server decided on a tool call. "ask" = not clear enough yet, the agent asks again. */
export const VERDICTS = ["allowed", "refused", "ask"] as const;
export const CASE_STATUSES = ["pending_review", "active", "dismissed", "completed", "advised"] as const;

/** Population register. SYNTHETIC: test-range identity codes only (see src/sim/people.ts). */
export const people = pgTable("people", {
  id: text("id").primaryKey(),
  hetu: text("hetu").notNull().unique(),
  name: text("name").notNull(),
  birthDate: date("birth_date").notNull(),
  county: text("county").notNull(),
  phone: text("phone").notNull(),
});

/** A phone call: strong identification first, then the case, then the intake. */
export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status", { enum: CALL_STATUSES }).notNull(),
  purpose: text("purpose", { enum: CALL_PURPOSES }).notNull().default("inbound"),
  /** Set only by strong identification. Nothing about any person is readable before it. */
  personId: text("person_id").references(() => people.id),
  person: jsonb("person").$type<Person>(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  failedVerifications: integer("failed_verifications").notNull().default(0),
  /** The case this call read, opened or updated. For a callback: the case it is about, set before anyone is identified. */
  caseId: uuid("case_id"),
  /** What the caller was told on this call. */
  outcome: text("outcome").$type<Outcome>(),
  transcript: jsonb("transcript").$type<TranscriptLine[]>().notNull().default([]),
  /** The handoff packet as it fills: the last intake the agent sent and what was still missing. */
  draft: jsonb("draft").$type<{ intake: Intake; gaps: Gap[] }>(),
  /** ElevenLabs conversation id, on real phone calls only. Ties the agent's webhook tools to this call. */
  conversationId: text("conversation_id").unique(),
});

/** Every tool call the agent makes, allowed or refused, and why. Append-only. */
export const accessLog = pgTable("access_log", {
  id: serial("id").primaryKey(),
  callId: uuid("call_id")
    .notNull()
    .references(() => calls.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  tool: text("tool", { enum: TOOLS }).notNull(),
  allowed: boolean("allowed").notNull(),
  verdict: text("verdict", { enum: VERDICTS }),
  detail: text("detail").notNull(),
});

export type TranscriptLine = { role: "agent" | "caller"; text: string; at: string };

/** A caller's intake and where it sits in the pathway. */
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  channel: text("channel", { enum: CHANNELS }).notNull(),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "set null" }),
  personId: text("person_id").references(() => people.id),
  person: jsonb("person").$type<Person>(),
  county: text("county"),
  pathwayId: text("pathway_id").notNull(),
  pathwayVersion: text("pathway_version").notNull(),
  intake: jsonb("intake").$type<Intake>().notNull(),
  outcome: text("outcome").$type<Outcome>().notNull(),
  /** Matched criteria, most severe first, linked to the observation that met each. */
  matches: jsonb("matches").$type<{ criterionId: string; observationIndex: number }[]>().notNull(),
  status: text("status", { enum: CASE_STATUSES }).notNull(),
  /** The nurse's notes from the callback. */
  notes: text("notes"),
});

/** One clock per pathway step. Open while stoppedAt is null. */
export const clocks = pgTable("clocks", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  stepId: text("step_id").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  stoppedAt: timestamp("stopped_at", { withTimezone: true }),
  /** Times the nurse proposed; Polku calls the patient, who picks one. Cleared when booked or declined. */
  offeredAt: timestamp("offered_at", { withTimezone: true }),
  offeredSlots: jsonb("offered_slot").$type<{ at: string; unit: string }[]>(),
  /** Booked appointment for this step, if any. */
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  unit: text("unit"),
});

/** Every action, who did it, when. Append-only. */
export const audit = pgTable("audit", {
  id: serial("id").primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  action: text("action").notNull(),
  actor: text("actor", { enum: ["system", "nurse", "patient"] }).notNull(),
  data: jsonb("data"),
});

/** Every time a step opens or writes part of a patient's record. Append-only. */
export const recordAccess = pgTable("record_access", {
  id: serial("id").primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  holder: text("holder").$type<Holder>().notNull(),
  mode: text("mode", { enum: ["read", "write"] }).notNull(),
  parts: jsonb("parts").$type<RecordPart[]>().notNull(),
  /** Who, in plain words: "Polku agent", "Nurse". */
  actor: text("actor").notNull(),
});
