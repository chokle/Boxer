import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gyms = pgTable("gyms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("USA"),
  address: text("address"),
  phone: text("phone"),
  website: text("website"),
  coachName: text("coach_name"),
  foundedYear: integer("founded_year"),
  activeMembers: integer("active_members"),
  specialties: text("specialties"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertGymSchema = createInsertSchema(gyms).omit({ id: true, createdAt: true });
export type Gym = typeof gyms.$inferSelect;
export type InsertGym = z.infer<typeof insertGymSchema>;
