import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
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

      const prompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists about "${topic}". Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please follow these steps to create the question:

1. Clinical Scenario:
   - Write a 200-word clinical scenario in the present tense.
   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
   - Use ONLY standard international units with reference ranges for any test results.
   - Do not reveal the diagnosis or include investigations that immediately give away the answer.

2. Question:
   - Test second-order thinking skills about ${topic}.
   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.
   - Do not reveal or hint at the diagnosis in the question.
   - Avoid including obvious investigations or management options that would immediately give away the answer.

3. Multiple Choice Options:
   - Provide 5 options (A-E) in alphabetical order:
     a) One best and correct answer
     b) One correct answer, but not the best option
     c-e) Plausible options that might be correct, but are not the best answer
   - Keep the length of all options consistent.
   - Avoid misleading or ambiguously worded distractors.

4. Correct Answer and Feedback:
   - Identify the correct answer and explain why it is the best option.
   - Provide option-specific explanations for why each option is correct or incorrect.
   ${referenceText ? `   - Use this reference text in your explanations where relevant: ${referenceText}` : ''}`;

      const completion = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [{ role: "user", content: prompt }]
      });

      const generatedContent = completion.choices[0].message.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      // Return raw text only - parsing will be done client-side
      res.json({ generated: generatedContent });
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).send(error.message || "Failed to generate MCQ");
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const { name, topic, clinicalScenario, question, options, correctAnswer, explanation } = req.body;

      const [newMcq] = await db.insert(mcqs).values({
        name,
        topic,
        clinical_scenario: clinicalScenario,
        question,
        options,
        correct_answer: correctAnswer,
        explanation,
      }).returning();

      res.json(newMcq);
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      res.status(500).send(error.message || "Failed to save MCQ");
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

  // Delete MCQ endpoint
  app.delete("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      if (isNaN(mcqId)) {
        return res.status(400).send("Invalid MCQ ID");
      }

      await db.delete(mcqs).where(eq(mcqs.id, mcqId));
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete MCQ error:', error);
      res.status(500).send(error.message || "Failed to delete MCQ");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}