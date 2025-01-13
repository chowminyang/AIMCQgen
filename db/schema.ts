import { pgTable, text, serial, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import type { ParsedMCQ } from "@/types";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

// MCQs table for storing medical questions
export const mcqs = pgTable("mcqs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  topic: text("topic").notNull(),
  raw_content: text("raw_content").notNull(),
  parsed_content: jsonb("parsed_content").$type<ParsedMCQ>().notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  rating: integer("rating").default(0),
  difficulty_prediction: jsonb("difficulty_prediction").$type<{
    level: "easy" | "medium" | "hard",
    confidence: number,
    factors: string[]
  }>(),
});

// Schema validations using zod
export const mcqSchema = z.object({
  name: z.string().min(1, "MCQ name is required"),
  topic: z.string().min(1, "Topic is required"),
  raw_content: z.string().min(1, "Generated text is required"),
  parsed_content: z.object({
    name: z.string(),
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
  }),
  rating: z.number().min(0).max(5).default(0),
  difficulty_prediction: z.object({
    level: z.enum(["easy", "medium", "hard"]),
    confidence: z.number().min(0).max(1),
    factors: z.array(z.string())
  }).optional(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type InsertMcq = typeof mcqs.$inferInsert;
export type SelectMcq = typeof mcqs.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;