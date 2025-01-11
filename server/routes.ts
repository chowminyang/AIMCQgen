import type { Express } from "express";
import { createServer, type Server } from "http";
import { requireAuth } from "./auth";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Create MCQ
  app.post("/api/mcqs", requireAuth, async (req, res) => {
    try {
      const { question, options, correctAnswer, topic } = req.body;
      const newMcq = await db.insert(mcqs).values({
        question,
        options: JSON.stringify(options),
        correctAnswer,
        topic
      }).returning();
      res.json(newMcq[0]);
    } catch (error: any) {
      console.error('Create MCQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all MCQs
  app.get("/api/mcqs", requireAuth, async (req, res) => {
    try {
      const allMcqs = await db.select().from(mcqs)
        .orderBy(desc(mcqs.createdAt));
      res.json(allMcqs);
    } catch (error: any) {
      console.error('Fetch MCQs error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // MCQ Generation endpoint (protected)
  app.post("/api/mcq/generate", requireAuth, async (req, res) => {
    try {
      const { topic, purpose, referenceText } = req.body;
      // TODO: Implement OpenAI integration
      res.status(501).json({ message: "MCQ generation not implemented yet" });
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Save MCQ endpoint (protected)
  app.post("/api/mcq/save", requireAuth, async (req, res) => {
    try {
      const { topic, purpose, referenceText, generatedText, editedText } = req.body;
      const newMcq = await db.insert(mcqs).values({
        topic,
        purpose,
        referenceText,
        generatedText,
        editedText,
        saved: true
      }).returning();

      res.json(newMcq[0]);
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get MCQ history endpoint (protected)
  app.get("/api/mcq/history", requireAuth, async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.createdAt));
      res.json(mcqHistory);
    } catch (error: any) {
      console.error('MCQ history error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}