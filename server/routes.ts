import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs, mcqSchema } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";
import XLSX from "xlsx";
import PDFDocument from "pdfkit";
import type { PDFKit } from "pdfkit";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store the current prompt in memory
let currentPrompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists about "{topic}". Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.
17:
18:Please follow these steps to create the question:
19:
20:1. Clinical Scenario:
21:   - Write a 200-word clinical scenario in the present tense.
22:   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
23:   - Use ONLY standard international units with reference ranges for any test results.
24:   - Do not reveal the diagnosis or include investigations that immediately give away the answer.
25:
26:2. Question:
27:   - Test second-order thinking skills about {topic}.
28:   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.
29:   - Do not reveal or hint at the diagnosis in the question.
30:   - Avoid including obvious investigations or management options that would immediately give away the answer.
31:
32:3. Multiple Choice Options:
33:   - Provide 5 options (A-E) in alphabetical order:
34:     a) One best and correct answer
35:     b) One correct answer, but not the best option
36:     c-e) Plausible options that might be correct, but are not the best answer
37:   - Keep the length of all options consistent.
38:   - Avoid misleading or ambiguously worded distractors.
39:
40:4. Correct Answer and Feedback:
41:   - Identify the correct answer and explain why it is the best option.
42:   - Provide option-specific explanations for why each option is correct or incorrect.
43:
44:Return your response in this EXACT format with these EXACT section headers:
45:
46:CLINICAL SCENARIO:
47:[Clinical scenario text]
48:
49:QUESTION:
50:[Question text]
51:
52:OPTIONS:
53:A) [Option A text]
54:B) [Option B text]
55:C) [Option C text]
56:D) [Option D text]
57:E) [Option E text]
58:
59:CORRECT ANSWER: [Single letter A-E]
60:
61:EXPLANATION:
62:[Detailed explanation text]`;

export function registerRoutes(app: Express): Server {
  // Get current prompt
  app.get("/api/prompt", async (req, res) => {
    res.json({ prompt: currentPrompt });
  });

  // Update prompt
  app.post("/api/prompt", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).send("Prompt is required");
    }

    currentPrompt = prompt;
    res.json({ prompt: currentPrompt });
  });

  // MCQ Generation endpoint
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const { topic, referenceText } = req.body;

      if (!topic) {
        return res.status(400).send("Topic is required");
      }

      // Replace the topic placeholder in the prompt
      const prompt = currentPrompt
        .replace(/\{topic\}/g, topic)
        .replace(/\{referenceText\}/, referenceText ? `\n   Use this reference text in your explanations where relevant: ${referenceText}` : '');

      const completion = await openai.chat.completions.create({
        model: "o1-mini",
        messages: [{ role: "user", content: prompt }]
      });

      const generatedContent = completion.choices[0].message.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      // Parse the generated content into structured sections
      const sections = generatedContent.split(/\n\n(?=[A-Z ]+:)/);
      const parsedContent = {
        clinicalScenario: "",
        question: "",
        options: {
          A: "",
          B: "",
          C: "",
          D: "",
          E: "",
        },
        correctAnswer: "",
        explanation: "",
      };

      sections.forEach(section => {
        const [header, ...content] = section.split(":\n");
        const sectionContent = content.join(":\n").trim();

        switch (header.trim()) {
          case "CLINICAL SCENARIO":
            parsedContent.clinicalScenario = sectionContent;
            break;
          case "QUESTION":
            parsedContent.question = sectionContent;
            break;
          case "OPTIONS":
            const options = sectionContent.split("\n");
            options.forEach(option => {
              const [letter, text] = option.split(") ");
              if (letter && text) {
                parsedContent.options[letter.trim() as keyof typeof parsedContent.options] = text.trim();
              }
            });
            break;
          case "CORRECT ANSWER":
            const answerMatch = sectionContent.match(/[A-E]$/);
            parsedContent.correctAnswer = answerMatch ? answerMatch[0] : "";
            console.log('Parsing correct answer:', { 
              raw: sectionContent,
              match: answerMatch,
              extracted: parsedContent.correctAnswer 
            });
            break;
          case "EXPLANATION":
            parsedContent.explanation = sectionContent;
            break;
        }
      });

      // Log the final parsed content for debugging
      console.log('Final parsed MCQ:', {
        ...parsedContent,
        correctAnswer: parsedContent.correctAnswer
      });

      res.json({
        raw: generatedContent,
        parsed: parsedContent
      });
    } catch (error: any) {
      console.error('MCQ generation error:', error);
      res.status(500).send(error.message || "Failed to generate MCQ");
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const { name, topic, rawContent, parsedContent } = req.body;

      const [newMcq] = await db.insert(mcqs).values({
        name,
        topic,
        raw_content: rawContent,
        parsed_content: parsedContent,
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

  // Delete MCQ endpoint
  app.delete("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      if (isNaN(mcqId)) {
        return res.status(400).send("Invalid MCQ ID");
      }

      await db.delete(mcqs).where(eq(mcqs.id, mcqId));
      res.status(200).send("MCQ deleted successfully");
    } catch (error: any) {
      console.error('Delete MCQ error:', error);
      res.status(500).send(error.message || "Failed to delete MCQ");
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

  // Export to XLSX
  app.get("/api/mcq/export/xlsx", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));

      // Transform data for Excel
      const data = mcqHistory.map(mcq => ({
        Name: mcq.name,
        Topic: mcq.topic,
        'Clinical Scenario': mcq.parsed_content.clinicalScenario,
        Question: mcq.parsed_content.question,
        'Option A': mcq.parsed_content.options.A,
        'Option B': mcq.parsed_content.options.B,
        'Option C': mcq.parsed_content.options.C,
        'Option D': mcq.parsed_content.options.D,
        'Option E': mcq.parsed_content.options.E,
        'Correct Answer': mcq.parsed_content.correctAnswer,
        Explanation: mcq.parsed_content.explanation,
        'Created At': new Date(mcq.created_at).toLocaleString(),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "MCQs");

      // Generate buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=mcq-library.xlsx');
      res.send(buffer);
    } catch (error: any) {
      console.error('Export XLSX error:', error);
      res.status(500).send(error.message || "Failed to export MCQs to Excel");
    }
  });

  // Export to PDF
  app.get("/api/mcq/export/pdf", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));

      // Create PDF document
      const doc = new PDFDocument();

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=mcq-library.pdf');

      // Pipe PDF directly to response
      doc.pipe(res);

      // Add content
      mcqHistory.forEach((mcq, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Title and metadata with styling
        doc.font('Helvetica-Bold').fontSize(16).text(mcq.name);
        doc.font('Helvetica').fontSize(12).text(`Topic: ${mcq.topic}`);
        doc.moveDown();

        // Clinical Scenario
        doc.font('Helvetica-Bold').fontSize(14).text('Clinical Scenario');
        doc.font('Helvetica').fontSize(12).text(mcq.parsed_content.clinicalScenario, {
          width: 500,
          align: 'justify'
        });
        doc.moveDown();

        // Question
        doc.font('Helvetica-Bold').fontSize(14).text('Question');
        doc.font('Helvetica').fontSize(12).text(mcq.parsed_content.question, {
          width: 500,
          align: 'justify'
        });
        doc.moveDown();

        // Options
        doc.font('Helvetica-Bold').fontSize(14).text('Options');
        Object.entries(mcq.parsed_content.options).forEach(([letter, text]) => {
          doc.font('Helvetica').fontSize(12).text(`${letter}) ${text}`, {
            width: 500,
            indent: 20
          });
        });
        doc.moveDown();

        // Correct Answer
        doc.font('Helvetica-Bold').fontSize(14).text('Correct Answer');
        doc.font('Helvetica').fontSize(12).text(`Option ${mcq.parsed_content.correctAnswer}`);
        doc.moveDown();

        // Explanation
        doc.font('Helvetica-Bold').fontSize(14).text('Explanation');
        doc.font('Helvetica').fontSize(12).text(mcq.parsed_content.explanation, {
          width: 500,
          align: 'justify'
        });

        // Footer with creation date
        doc.moveDown()
          .font('Helvetica-Oblique')
          .fontSize(10)
          .text(`Created: ${new Date(mcq.created_at).toLocaleString()}`, {
            align: 'right'
          });
      });

      // End the document
      doc.end();
    } catch (error: any) {
      console.error('Export PDF error:', error);
      res.status(500).send(error.message || "Failed to export MCQs to PDF");
    }
  });

  // Export to PDF for learners (without answers)
  app.get("/api/mcq/export/pdf/learner", async (req, res) => {
    try {
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));

      // Create PDF document
      const doc = new PDFDocument();

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=mcq-practice.pdf');

      // Pipe PDF directly to response
      doc.pipe(res);

      // Add content
      mcqHistory.forEach((mcq, index) => {
        if (index > 0) {
          doc.addPage();
        }

        // Title and metadata with styling
        doc.font('Helvetica-Bold').fontSize(16).text(mcq.name);
        doc.font('Helvetica').fontSize(12).text(`Topic: ${mcq.topic}`);
        doc.moveDown();

        // Clinical Scenario
        doc.font('Helvetica-Bold').fontSize(14).text('Clinical Scenario');
        doc.font('Helvetica').fontSize(12).text(mcq.parsed_content.clinicalScenario, {
          width: 500,
          align: 'justify'
        });
        doc.moveDown();

        // Question
        doc.font('Helvetica-Bold').fontSize(14).text('Question');
        doc.font('Helvetica').fontSize(12).text(mcq.parsed_content.question, {
          width: 500,
          align: 'justify'
        });
        doc.moveDown();

        // Options
        doc.font('Helvetica-Bold').fontSize(14).text('Options');
        Object.entries(mcq.parsed_content.options).forEach(([letter, text]) => {
          doc.font('Helvetica').fontSize(12).text(`${letter}) ${text}`, {
            width: 500,
            indent: 20
          });
        });
        doc.moveDown();

        // Footer with space for answers
        doc.moveDown()
          .font('Helvetica')
          .fontSize(12)
          .text('Your Answer: _____', {
            align: 'left'
          })
          .moveDown()
          .text('Notes:', {
            align: 'left'
          })
          .moveDown(3);
      });

      // End the document
      doc.end();
    } catch (error: any) {
      console.error('Export PDF error:', error);
      res.status(500).send(error.message || "Failed to export MCQs to PDF");
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}