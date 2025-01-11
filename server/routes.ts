import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs, mcqSchema } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function registerRoutes(app: Express): Server {
  // MCQ Generation endpoint
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const { topic, referenceText } = req.body;

      if (!topic) {
        return res.status(400).send("Topic is required");
      }

      const prompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question about "${topic}". Your goal is to test second-order thinking.

Please format your response exactly as follows:

CLINICAL SCENARIO:
[Write a detailed clinical scenario in present tense, 200 words max]

QUESTION:
[Write your second-order thinking question]

OPTIONS:
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
E) [Fifth option]

CORRECT ANSWER: [Single letter A-E]

EXPLANATION:
[Your detailed explanation for each option]
${referenceText ? `\nReference text to include: ${referenceText}` : ''}`;

      const completion = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const generatedContent = completion.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      // Save the MCQ to the database
      const [savedMcq] = await db.insert(mcqs).values({
        topic,
        generated_text: generatedContent,
      }).returning();

      res.json({ text: generatedContent, id: savedMcq.id });
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || "Failed to generate MCQ";
      res.status(error.response?.status || 500).send(errorMessage);
    }
  });

  // Get MCQ history endpoint
  app.get("/api/mcq/history", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      res.json(mcqHistory);
    } catch (error: any) {
      console.error('MCQ history error:', error);
      res.status(500).send(error.message || "Failed to fetch MCQ history");
    }
  });

  // Get single MCQ endpoint
  app.get("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      if (isNaN(mcqId)) {
        return res.status(400).send("Invalid MCQ ID");
      }

      const [mcq] = await db.select().from(mcqs).where(eq(mcqs.id, mcqId));
      if (!mcq) {
        return res.status(404).send("MCQ not found");
      }

      res.json(mcq);
    } catch (error: any) {
      console.error('Get MCQ error:', error);
      res.status(500).send(error.message || "Failed to fetch MCQ");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}