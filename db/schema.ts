import { pgTable, text, serial, timestamp, json } from "drizzle-orm/pg-core";
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
  name: text("name").notNull(), // Custom name for the MCQ
  topic: text("topic"),
  reference_text: text("reference_text"),
  generated_text: text("generated_text").notNull(),
  parsed_data: json("parsed_data").$type<{
    clinicalScenario: string;
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
      E: string;
    };
    correctAnswer: string;
    explanation: string;
  }>(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

// Schema validations using zod
export const mcqSchema = z.object({
  name: z.string().min(1, "Name is required"),
  topic: z.string().optional(),
  reference_text: z.string().optional(),
  generated_text: z.string().min(1, "Generated text is required"),
  parsed_data: z.object({
    clinicalScenario: z.string(),
    question: z.string(),
    options: z.object({
      A: z.string(),
      B: z.string(),
      C: z.string(),
      D: z.string(),
      E: z.string(),
    }),
    correctAnswer: z.string(),
    explanation: z.string(),
  }).optional(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type InsertMcq = typeof mcqs.$inferInsert;
export type SelectMcq = typeof mcqs.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;