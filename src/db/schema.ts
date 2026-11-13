import { jsonb, pgTable, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { Outcome } from "../ontology/engine";
import type { Intake } from "../ontology/schema";

export const CHANNELS = ["web_call", "phone", "sample"] as const;
export const CASE_STATUSES = ["pending_review", "active", "dismissed", "completed", "advised"] as const;

/** A caller's intake and where it sits in the pathway. One row per call. */
export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  channel: text("channel", { enum: CHANNELS }).notNull(),
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
