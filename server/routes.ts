import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs, mcqSchema, type InsertMcq } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

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
      const validationResult = mcqSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const mcqData = validationResult.data;

      const [newMcq] = await db.insert(mcqs).values({
        topic: mcqData.topic,
        clinical_scenario: mcqData.clinical_scenario,
        question: mcqData.question,
        options: mcqData.options,
        correct_answer: mcqData.correct_answer,
        explanation: mcqData.explanation,
      }).returning();

      res.json(newMcq);
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      res.status(500).json({ message: error.message || "Failed to save MCQ" });
    }
  });

  // Get MCQ history endpoint
  app.get("/api/mcq/history", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      res.json(mcqHistory);
    } catch (error: any) {
      console.error('MCQ history error:', error);
      res.status(500).json({ message: error.message || "Failed to fetch MCQ history" });
    }
  });

  // Export MCQs to PDF endpoint
  app.get("/api/mcq/export-pdf", async (req, res) => {
    try {
      const allMcqs = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));

      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=mcqs.pdf');

      // Pipe the PDF to the response
      doc.pipe(res);

      // Add each MCQ to the PDF
      allMcqs.forEach((mcq, index) => {
        if (index > 0) {
          doc.addPage(); // Start each question on a new page
        }

        // Add topic and clinical scenario
        doc.fontSize(16).text(`Topic: ${mcq.topic}`, { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(mcq.clinical_scenario);
        doc.moveDown();

        // Add question
        doc.fontSize(14).text('Question:', { underline: true });
        doc.fontSize(12).text(mcq.question);
        doc.moveDown();

        // Add options
        doc.fontSize(14).text('Options:', { underline: true });
        Object.entries(mcq.options).forEach(([key, value]) => {
          doc.fontSize(12).text(`${key}. ${value}`);
        });
        doc.moveDown();

        // Add correct answer
        doc.fontSize(14).text('Correct Answer:', { underline: true });
        doc.fontSize(12).text(mcq.correct_answer);
        doc.moveDown();

        // Add explanation
        doc.fontSize(14).text('Explanation:', { underline: true });
        doc.fontSize(12).text(mcq.explanation);
      });

      // Finalize the PDF
      doc.end();
    } catch (error: any) {
      console.error('PDF export error:', error);
      res.status(500).json({ message: error.message || "Failed to export MCQs to PDF" });
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

      res.json(mcq);
    } catch (error: any) {
      console.error('Get MCQ error:', error);
      res.status(500).json({ message: error.message || "Failed to fetch MCQ" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}