import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Users table for simplified authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  password: text("password").notNull(),
});

// MCQs table for storing medical questions
export const mcqs = pgTable("mcqs", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  clinicalScenario: text("clinical_scenario").notNull(),
  question: text("question").notNull(),
  options: text("options").notNull(), // Stored as JSON string
  correctAnswer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema validations
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertMcqSchema = createInsertSchema(mcqs);
export const selectMcqSchema = createSelectSchema(mcqs);

// Types
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertMcq = typeof mcqs.$inferInsert;
export type SelectMcq = typeof mcqs.$inferSelect;