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
      const { topic, purpose, referenceText } = req.body;

      if (!topic) {
        return res.status(400).json({ message: "Topic is required" });
      }

      const prompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists. Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please follow these steps to create the question:

1. Clinical Scenario:
   - Write a 200-word clinical scenario in the present tense.
   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
   - Use ONLY standard international units with reference ranges for any test results.
   - Do not reveal the diagnosis or include investigations that immediately give away the answer.

2. Question:
   - Ensure the question tests at least second-order thinking.
   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.

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
   ${referenceText ? `   - Use this reference text in your explanations where relevant: ${referenceText}` : ''}

For this topic:
Topic: ${topic}
${referenceText ? `Reference text: ${referenceText}` : ''}

Format your response in the following structure, using clear section headers:

CLINICAL SCENARIO:
[Your clinical scenario here]

QUESTION:
[Your question here]

OPTIONS:
A) [First option]
B) [Second option]
C) [Third option]
D) [Fourth option]
E) [Fifth option]

CORRECT ANSWER: [Single letter A-E]

EXPLANATION:
[Your detailed explanation here]`;

      const completion = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [{ role: "user", content: prompt }]
      });

      const generatedContent = completion.choices[0].message.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      res.send(generatedContent); //Send the raw text
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).send({ message: error.message || "Failed to generate MCQ" });
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const validationResult = mcqSchema.safeParse({
        topic: req.body.topic,
        generated_text: req.body.generatedText
      });

      if (!validationResult.success) {
        console.error('Validation errors:', validationResult.error.errors);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        });
      }

      const mcqData = validationResult.data;

      const [newMcq] = await db.insert(mcqs).values({
        topic: mcqData.topic,
        generated_text: mcqData.generated_text
      }).returning();

      res.json(newMcq);
    } catch (error: any) {
      console.error('Save MCQ error:', error);
      res.status(500).json({ message: error.message || "Failed to save MCQ" });
    }
  });

  app.get("/api/mcq/history", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      res.json(mcqHistory);
    } catch (error: any) {
      console.error('MCQ history error:', error);
      res.status(500).json({ message: error.message || "Failed to fetch MCQ history" });
    }
  });

  app.get("/api/mcq/export-pdf", async (req, res) => {
    try {
      const allMcqs = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));

      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        bufferPages: true
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=mcqs.pdf');

      doc.pipe(res);

      allMcqs.forEach((mcq, index) => {
        if (index > 0) {
          doc.addPage();
        }

        doc.fontSize(16).text(`Topic: ${mcq.topic}`, { underline: true });
        doc.moveDown();
        doc.fontSize(12).text(mcq.generated_text);
        doc.moveDown();
      });

      doc.end();
    } catch (error: any) {
      console.error('PDF export error:', error);
      res.status(500).json({ message: error.message || "Failed to export MCQs to PDF" });
    }
  });

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