import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Medical MCQ system prompt from the template
const SYSTEM_PROMPT = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists. Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please create a single high-quality MCQ following this format:
{
  "mcq": {
    "clinicalScenario": "A detailed 200-word clinical scenario",
    "question": "The second-order thinking question",
    "options": {
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option",
      "E": "Fifth option"
    },
    "correctAnswer": "The letter of correct option (A-E)",
    "explanation": "Detailed explanation of why the correct answer is best, and explanations for all options"
  }
}`;

export function registerRoutes(app: Express): Server {
  // MCQ Generation endpoint
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const { topic, referenceText } = req.body;

      if (!topic || !referenceText) {
        return res.status(400).json({ message: "Topic and reference text are required" });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Generate one challenging medical MCQ for the following topic: ${topic}\n\nReference text: ${referenceText}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const generatedContent = completion.choices[0].message.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      const result = JSON.parse(generatedContent);
      res.json(result);
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).json({ message: error.message || "Failed to generate MCQs" });
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const { clinicalScenario, question, options, correctAnswer, explanation, topic } = req.body;
      const newMcq = await db.insert(mcqs).values({
        topic,
        clinicalScenario,
        question,
        options: JSON.stringify(options),
        correctAnswer,
        explanation,
      }).returning();

      res.json(newMcq[0]);
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get MCQ history endpoint
  app.get("/api/mcq/history", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs)
        .orderBy(desc(mcqs.createdAt));
      res.json(mcqHistory);
    } catch (error: any) {
      console.error('MCQ history error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get single MCQ endpoint
  app.get("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      const [mcq] = await db.select().from(mcqs).where(eq(mcqs.id, mcqId));

      if (!mcq) {
        return res.status(404).json({ message: "MCQ not found" });
      }

      res.json(mcq);
    } catch (error: any) {
      console.error('Get MCQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}