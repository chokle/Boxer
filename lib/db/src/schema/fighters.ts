import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { gyms } from "./gyms";

export const fighters = pgTable("fighters", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gymId: integer("gym_id").references(() => gyms.id, { onDelete: "set null" }),
  weightClass: text("weight_class").notNull(),
  stance: text("stance").notNull().default("Orthodox"),
  age: integer("age"),
  heightCm: integer("height_cm"),
  reachCm: integer("reach_cm"),
  status: text("status").notNull().default("amateur"),
  recordWins: integer("record_wins").notNull().default(0),
  recordLosses: integer("record_losses").notNull().default(0),
  recordDraws: integer("record_draws").notNull().default(0),
  rankAmateur: integer("rank_amateur"),
  rankPro: integer("rank_pro"),
  style: text("style").notNull().default("balanced"),
  bio: text("bio"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertFighterSchema = createInsertSchema(fighters).omit({ id: true, createdAt: true });
export type Fighter = typeof fighters.$inferSelect;
export type InsertFighter = z.infer<typeof insertFighterSchema>;
