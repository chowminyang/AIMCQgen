import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const mcqs = pgTable("mcqs", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  purpose: text("purpose").notNull(),
  referenceText: text("reference_text"),
  generatedText: text("generated_text").notNull(),
  editedText: text("edited_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  saved: boolean("saved").default(false).notNull(),
});

export const insertMcqSchema = createInsertSchema(mcqs);
export const selectMcqSchema = createSelectSchema(mcqs);
export type InsertMcq = typeof mcqs.$inferInsert;
export type SelectMcq = typeof mcqs.$inferSelect;