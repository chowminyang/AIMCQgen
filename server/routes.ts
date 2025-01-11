import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert educational content creator specializing in creating multiple-choice questions (MCQs). Your task is to generate high-quality MCQs based on the given topic and reference text.

Follow these guidelines:
1. Each MCQ should have:
   - A clear, concise question
   - 4 options (A, B, C, D)
   - One correct answer
   - A brief explanation why the answer is correct
2. Questions should test understanding, not just memorization
3. Options should be plausible but clearly distinguishable
4. Use simple, clear language

Format each MCQ as a JSON object with the following structure:
{
  "questions": [
    {
      "question": "The question text",
      "options": {
        "A": "First option",
        "B": "Second option",
        "C": "Third option",
        "D": "Fourth option"
      },
      "correctAnswer": "A",
      "explanation": "Why this is the correct answer"
    }
  ]
}`;

export function registerRoutes(app: Express): Server {
  // Create MCQ
  app.post("/api/mcqs", async (req, res) => {
    try {
      const { question, options, correctAnswer, topic, explanation } = req.body;
      const newMcq = await db.insert(mcqs).values({
        question,
        options: JSON.stringify(options),
        correctAnswer,
        explanation,
        topic
      }).returning();
      res.json(newMcq[0]);
    } catch (error: any) {
      console.error('Create MCQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all MCQs
  app.get("/api/mcqs", async (req, res) => {
    try {
      const allMcqs = await db.select().from(mcqs)
        .orderBy(desc(mcqs.createdAt));
      res.json(allMcqs);
    } catch (error: any) {
      console.error('Fetch MCQs error:', error);
      res.status(500).json({ message: error.message });
    }
  });

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
            content: `Generate 3 multiple choice questions for the following topic: ${topic}\n\nReference text: ${referenceText}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      // Parse the generated MCQs
      const generatedContent = JSON.parse(completion.choices[0].message.content);
      res.json(generatedContent);

    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const { topic, question, options, correctAnswer, explanation } = req.body;
      const newMcq = await db.insert(mcqs).values({
        topic,
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

  const httpServer = createServer(app);
  return httpServer;
}