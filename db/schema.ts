import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  isMaster: boolean("is_master").default(false).notNull(),
});

export const mcqs = pgTable("mcqs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  topic: text("topic").notNull(),
  purpose: text("purpose").notNull(),
  referenceText: text("reference_text"),
  generatedText: text("generated_text").notNull(),
  editedText: text("edited_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  saved: boolean("saved").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

export const insertMcqSchema = createInsertSchema(mcqs);
export const selectMcqSchema = createSelectSchema(mcqs);
export type InsertMcq = typeof mcqs.$inferInsert;
export type SelectMcq = typeof mcqs.$inferSelect;