import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Generate MCQ endpoint
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      // Add debugging logs for authentication
      console.log('Auth check:', {
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, username: req.user.username } : null
      });

      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authorized");
      }

      const { topic, purpose, referenceText } = req.body;
      // TODO: Implement OpenAI integration after authentication is fixed
      res.status(501).send("Not implemented");
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).send(error.message);
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authorized");
    }

    try {
      const { topic, purpose, referenceText, generatedText, editedText } = req.body;

      const [mcq] = await db
        .insert(mcqs)
        .values({
          userId: req.user.id,
          topic,
          purpose,
          referenceText: referenceText || null,
          generatedText,
          editedText: editedText || null,
          saved: true,
        })
        .returning();

      res.json(mcq);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  // Get MCQ history endpoint
  app.get("/api/mcq/history", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authorized");
    }

    try {
      const history = await db.query.mcqs.findMany({
        where: (mcqs, { eq, and }) =>
          and(eq(mcqs.userId, req.user.id), eq(mcqs.saved, true)),
        orderBy: [desc(mcqs.createdAt)],
      });
      res.json(history);
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}