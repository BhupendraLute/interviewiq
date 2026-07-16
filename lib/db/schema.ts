import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";

/**
 * sessions — one row per interview attempt, keyed by an anonymous
 * session_id (not a user account). No auth required to create one.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull(), // anonymous UUID from the client cookie
  role: text("role").notNull(), // e.g. "SDE-2 Backend"
  difficulty: text("difficulty").notNull(), // e.g. "medium"
  status: text("status").notNull().default("in_progress"), // in_progress | completed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * transcript_events — every turn of the conversation, in order.
 * This is what the feedback report quotes specific moments from.
 */
export const transcriptEvents = pgTable("transcript_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'ai' | 'user'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * feedback_reports — generated once per completed session.
 */
export const feedbackReports = pgTable("feedback_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => sessions.id, { onDelete: "cascade" }),
  correctnessNotes: text("correctness_notes"),
  complexityNotes: text("complexity_notes"),
  communicationNotes: text("communication_notes"),
  quotedMoments: jsonb("quoted_moments").$type<{ speaker: string; quote: string; why: string }[]>(),
  nextSteps: text("next_steps"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
