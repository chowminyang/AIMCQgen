import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

// MCQs table for storing medical questions
export const mcqs = pgTable("mcqs", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  generated_text: text("generated_text").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Schema validations using zod
export const mcqSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  generated_text: z.string().min(1, "Generated text is required"),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type InsertMcq = typeof mcqs.$inferInsert;
export type SelectMcq = typeof mcqs.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;