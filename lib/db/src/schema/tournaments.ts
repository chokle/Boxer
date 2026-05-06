import { pgTable, serial, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  venue: text("venue"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  type: text("type").notNull().default("amateur"),
  status: text("status").notNull().default("upcoming"),
  weightClasses: text("weight_classes"),
  entryDeadline: date("entry_deadline"),
  maxParticipants: integer("max_participants"),
  registeredCount: integer("registered_count").notNull().default(0),
  entryFee: integer("entry_fee_cents"),
  description: text("description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true });
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
