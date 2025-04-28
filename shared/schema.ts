import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  initials: text("initials").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  initials: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Time entries table
export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  clockIn: timestamp("clock_in").notNull(),
  clockOut: timestamp("clock_out"),
  isActive: boolean("is_active").notNull().default(true),
  date: text("date").notNull(), // Stored as ISO date string (YYYY-MM-DD)
  category: text("category"),
  description: text("description"),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).pick({
  userId: true,
  clockIn: true,
  date: true,
  category: true,
  description: true,
});

export const updateTimeEntrySchema = createInsertSchema(timeEntries).pick({
  clockOut: true,
  isActive: true,
  category: true,
  description: true,
});

// Create a more flexible version of the insert schema for MongoDB compatibility
export const insertTimeEntryMongoSchema = insertTimeEntrySchema.extend({
  userId: z.union([z.string(), z.number()]) // Allow both string and number for MongoDB compatibility
});

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type InsertTimeEntryMongo = z.infer<typeof insertTimeEntryMongoSchema>;
export type UpdateTimeEntry = z.infer<typeof updateTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;

// Type for the response objects
export type TimeEntryWithDuration = TimeEntry & {
  duration: number | null; // Duration in milliseconds
};

export type DailyStats = {
  date: string;
  totalHours: number;
  entries: TimeEntryWithDuration[];
  isToday: boolean;
};

export type WeeklyStats = {
  totalHours: number;
  remainingHours: number;
  progressPercentage: number;
  dailyStats: DailyStats[];
};
