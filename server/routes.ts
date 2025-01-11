import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Medical MCQ system prompt
const SYSTEM_PROMPT = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists. Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please follow these steps to create the question:

1. Clinical Scenario:
   - Write a 200-word clinical scenario in the present tense
   - Include relevant details like presenting complaint, history, physical examination findings, and investigations
   - Use standard international units with reference ranges
   - Do not reveal the diagnosis immediately

2. Question:
   - Ensure the question tests second-order thinking
   - Make it clear and specific

3. Multiple Choice Options:
   - Provide 5 options (A through E)
   - Include one best answer and plausible alternatives
   - Keep options consistent in length and style

4. Explanation:
   - Explain why the correct answer is best
   - Provide explanations for all options

Format your response as a JSON object with this structure:
{
  "mcq": {
    "clinicalScenario": "Your clinical scenario here",
    "question": "Your question here",
    "options": {
      "A": "First option",
      "B": "Second option",
      "C": "Third option", 
      "D": "Fourth option",
      "E": "Fifth option"
    },
    "correctAnswer": "Letter of correct option (A-E)",
    "explanation": "Full explanation here"
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
            content: `Generate one challenging medical MCQ for the following topic and reference text:\n\nTopic: ${topic}\n\nReference text: ${referenceText}`
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
      res.status(500).json({ message: error.message || "Failed to generate MCQ" });
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const { topic, clinicalScenario, question, options, correctAnswer, explanation } = req.body;

      if (!topic || !clinicalScenario || !question || !options || !correctAnswer || !explanation) {
        return res.status(400).json({ message: "All MCQ fields are required" });
      }

      const mcqData = {
        clinicalScenario,
        question,
        options,
        correctAnswer,
        explanation
      };

      const [newMcq] = await db.insert(mcqs).values({
        topic,
        generated_text: JSON.stringify(mcqData),
        saved: true,
      }).returning();

      const savedMcqData = {
        id: newMcq.id,
        topic: newMcq.topic,
        ...mcqData,
        createdAt: newMcq.created_at
      };

      res.json(savedMcqData);
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      res.status(500).json({ message: error.message || "Failed to save MCQ" });
    }
  });

  // Get MCQ history endpoint
  app.get("/api/mcq/history", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));

      const formattedHistory = mcqHistory.map(mcq => {
        const mcqData = JSON.parse(mcq.generated_text);
        return {
          id: mcq.id,
          topic: mcq.topic,
          ...mcqData,
          createdAt: mcq.created_at
        };
      });

      res.json(formattedHistory);
    } catch (error: any) {
      console.error('MCQ history error:', error);
      res.status(500).json({ message: error.message || "Failed to fetch MCQ history" });
    }
  });

  // Get single MCQ endpoint
  app.get("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      if (isNaN(mcqId)) {
        return res.status(400).json({ message: "Invalid MCQ ID" });
      }

      const [mcq] = await db.select().from(mcqs).where(eq(mcqs.id, mcqId));
      if (!mcq) {
        return res.status(404).json({ message: "MCQ not found" });
      }

      const mcqData = JSON.parse(mcq.generated_text);
      const formattedMcq = {
        id: mcq.id,
        topic: mcq.topic,
        ...mcqData,
        createdAt: mcq.created_at
      };

      res.json(formattedMcq);
    } catch (error: any) {
      console.error('Get MCQ error:', error);
      res.status(500).json({ message: error.message || "Failed to fetch MCQ" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}