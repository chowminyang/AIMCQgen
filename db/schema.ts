import { pgTable, text, serial, timestamp, boolean, json } from "drizzle-orm/pg-core";
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
  clinical_scenario: text("clinical_scenario").notNull(),
  question: text("question").notNull(),
  options: json("options").$type<{
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  }>().notNull(),
  correct_answer: text("correct_answer").notNull(),
  explanation: text("explanation").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
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

// Custom Zod schema for MCQ validation
export const mcqSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  clinical_scenario: z.string().min(1, "Clinical scenario is required"),
  question: z.string().min(1, "Question is required"),
  options: z.object({
    A: z.string().min(1, "Option A is required"),
    B: z.string().min(1, "Option B is required"),
    C: z.string().min(1, "Option C is required"),
    D: z.string().min(1, "Option D is required"),
    E: z.string().min(1, "Option E is required"),
  }),
  correct_answer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().min(1, "Explanation is required"),
});