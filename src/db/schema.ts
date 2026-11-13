import { jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Outcome } from "../ontology/engine";
import type { Intake } from "../ontology/schema";
import type { Person } from "../sim/people";

export const CHANNELS = ["web_call", "phone", "sample"] as const;
export const CALL_STATUSES = ["ringing", "verifying", "verified", "screened"] as const;
export const CASE_STATUSES = ["pending_review", "active", "dismissed", "completed", "advised"] as const;

/** A phone call: strong identification first, then the intake. */
export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status", { enum: CALL_STATUSES }).notNull(),
  /** Set by strong identification. Synthetic in the demo. */
  person: jsonb("person").$type<Person>(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

/** A caller's intake and where it sits in the pathway. */
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  channel: text("channel", { enum: CHANNELS }).notNull(),
  callId: uuid("call_id").references(() => calls.id, { onDelete: "set null" }),
  person: jsonb("person").$type<Person>(),
  county: text("county"),
  pathwayId: text("pathway_id").notNull(),
  pathwayVersion: text("pathway_version").notNull(),
  intake: jsonb("intake").$type<Intake>().notNull(),
  outcome: text("outcome").$type<Outcome>().notNull(),
  /** Matched criteria, most severe first, linked to the observation that met each. */
  matches: jsonb("matches").$type<{ criterionId: string; observationIndex: number }[]>().notNull(),
  status: text("status", { enum: CASE_STATUSES }).notNull(),
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
});

/** Every action, who did it, when. Append-only. */
export const audit = pgTable("audit", {
  id: serial("id").primaryKey(),
  caseId: uuid("case_id")
    .notNull()
    .references(() => cases.id, { onDelete: "cascade" }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  action: text("action").notNull(),
  actor: text("actor", { enum: ["system", "nurse"] }).notNull(),
  data: jsonb("data"),
});
