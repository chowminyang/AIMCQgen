import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import OpenAI from "openai";
import PDFDocument from "pdfkit";
import XLSX from "xlsx";

// Store the current prompt in memory
let currentPrompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists about "{topic}". Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.
10:
11:Please follow these steps to create the question:
12:
13:1. Give this MCQ a concise descriptive name that summarizes its content (e.g., "Acute Pancreatitis Management", "Beta-Blocker Pharmacology").
14:
15:2. Clinical Scenario:
16:   - Write a clinical scenario about {topic} in the present tense (maximum 120 words).
17:   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
18:   - Use ONLY standard international units with reference ranges for any test results.
19:   - Do not reveal the diagnosis or include investigations that immediately give away the answer.
20:
21:3. Question:
22:   - Test second-order thinking skills about {topic}.
23:   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.
24:   - Do not reveal or hint at the diagnosis in the question.
25:   - Avoid including obvious investigations or management options that would immediately give away the answer.
26:
27:4. Multiple Choice Options:
28:   - Provide 5 options (A-E) in alphabetical order:
29:     a) One best and correct answer
30:     b) One correct answer, but not the best option
31:     c-e) Plausible options that might be correct, but are not the best answer
32:   - Keep the length of all options consistent.
33:   - Avoid misleading or ambiguously worded distractors.
34:
35:5. Correct Answer and Feedback:
36:   - Identify the correct answer and explain why it is the best option.
37:   - Provide option-specific explanations for why each option is correct or incorrect.
38:
39:Return your response in this EXACT format with these EXACT section headers:
40:
41:NAME:
42:[MCQ name]
43:
44:CLINICAL SCENARIO:
45:[Clinical scenario text]
46:
47:QUESTION:
48:[Question text]
49:
50:OPTIONS:
51:A) [Option A text]
52:B) [Option B text]
53:C) [Option C text]
54:D) [Option D text]
55:E) [Option E text]
56:
57:CORRECT ANSWER: [Single letter A-E]
58:
59:EXPLANATION:
60:[Detailed explanation text]`;

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseGeneratedContent(content: string) {
  const sections = content.split(/\n\n(?=NAME:|CLINICAL SCENARIO:|QUESTION:|OPTIONS:|CORRECT ANSWER:|EXPLANATION:)/i);

  const parsedContent = {
    name: "",
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

  for (const section of sections) {
    const [header, ...contentLines] = section.split(/:\s*/);
    const trimmedHeader = header.trim().toUpperCase();
    const sectionContent = contentLines.join(":").trim();

    switch (trimmedHeader) {
      case "NAME":
        parsedContent.name = sectionContent;
        break;
      case "CLINICAL SCENARIO":
        parsedContent.clinicalScenario = sectionContent;
        break;
      case "QUESTION":
        parsedContent.question = sectionContent;
        break;
      case "OPTIONS":
        const options = sectionContent.split(/\n/);
        options.forEach(option => {
          const match = option.match(/^([A-E])\)\s*(.+)$/);
          if (match) {
            const [, letter, text] = match;
            parsedContent.options[letter as keyof typeof parsedContent.options] = text.trim();
          }
        });
        break;
      case "CORRECT ANSWER":
        // Extract just the letter A-E, ignore any additional text
        const answerMatch = sectionContent.match(/[A-E]/);
        parsedContent.correctAnswer = answerMatch ? answerMatch[0] : "";
        break;
      case "EXPLANATION":
        parsedContent.explanation = sectionContent;
        break;
    }
  }

  // Validate parsed content
  const isValid = parsedContent.name &&
                 parsedContent.clinicalScenario &&
                 parsedContent.question &&
                 Object.values(parsedContent.options).every(Boolean) &&
                 /^[A-E]$/.test(parsedContent.correctAnswer) &&
                 parsedContent.explanation;

  if (!isValid) {
    console.error("Invalid parsed content:", parsedContent);
    throw new Error("Failed to parse generated MCQ content correctly");
  }

  return parsedContent;
}

export function registerRoutes(app: Express): Server {
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
        model: "gpt-4o", // Updated to use the correct model name
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      });

      const generatedContent = completion.choices[0].message.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      const parsedContent = parseGeneratedContent(generatedContent);
      console.log("Generated and parsed MCQ:", {
        name: parsedContent.name,
        correctAnswer: parsedContent.correctAnswer,
        optionsCount: Object.keys(parsedContent.options).length
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

      if (!parsedContent || !name || name.trim() === '') {
        return res.status(400).send("MCQ name is required");
      }

      const [newMcq] = await db.insert(mcqs).values({
        name: name.trim(),
        topic: topic.trim(),
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
  app.get("/api/mcq/history", async (_req, res) => {
    try {
      console.log('Fetching MCQ history...');
      const mcqHistory = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      console.log('MCQ history fetched successfully:', mcqHistory.length, 'items');
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

  // Update MCQ endpoint
  app.put("/api/mcq/:id", async (req, res) => {
    try {
      const mcqId = parseInt(req.params.id);
      const { name, parsedContent } = req.body;

      if (isNaN(mcqId)) {
        return res.status(400).send("Invalid MCQ ID");
      }

      const [updatedMcq] = await db
        .update(mcqs)
        .set({
          name,
          parsed_content: parsedContent,
        })
        .where(eq(mcqs.id, mcqId))
        .returning();

      res.json(updatedMcq);
    } catch (error: any) {
      console.error('Update MCQ error:', error);
      res.status(500).send(error.message || "Failed to update MCQ");
    }
  });

  // Rate MCQ endpoint
  app.post("/api/mcq/:id/rate", async (req, res) => {
    try {
      console.log('Rating MCQ...');
      const mcqId = parseInt(req.params.id);
      const { rating } = req.body;

      if (isNaN(mcqId)) {
        console.error('Invalid MCQ ID:', req.params.id);
        return res.status(400).send("Invalid MCQ ID");
      }

      if (typeof rating !== 'number' || rating < 0 || rating > 5) {
        console.error('Invalid rating value:', rating);
        return res.status(400).send("Rating must be a number between 0 and 5");
      }

      console.log(`Updating MCQ ${mcqId} with rating ${rating}`);
      await db.update(mcqs)
        .set({ rating })
        .where(eq(mcqs.id, mcqId));

      console.log('Rating updated successfully');
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update rating error:', error);
      res.status(500).send(error.message || "Failed to update rating");
    }
  });

  // Get system prompt endpoint
  app.get("/api/prompt", (_req, res) => {
    res.json({ prompt: currentPrompt });
  });

  // Update system prompt endpoint
  app.post("/api/prompt", (req, res) => {
    try {
      const { prompt } = req.body;
      if (typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).send("Prompt is required");
      }
      currentPrompt = prompt.trim();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Update prompt error:', error);
      res.status(500).send(error.message || "Failed to update prompt");
    }
  });

  // Export to XLSX endpoint
  app.get("/api/mcq/export/xlsx", async (req, res) => {
    try {
      const { ids } = req.query;
      let mcqData;

      if (ids) {
        const mcqIds = (ids as string).split(',').map(Number);
        mcqData = await db.select().from(mcqs)
          .where(inArray(mcqs.id, mcqIds))
          .orderBy(desc(mcqs.created_at));
      } else {
        mcqData = await db.select().from(mcqs)
          .orderBy(desc(mcqs.created_at));
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws_data = mcqData.map(mcq => ({
        'Name': mcq.name,
        'Topic': mcq.topic,
        'Clinical Scenario': mcq.parsed_content.clinicalScenario,
        'Question': mcq.parsed_content.question,
        'Option A': mcq.parsed_content.options.A,
        'Option B': mcq.parsed_content.options.B,
        'Option C': mcq.parsed_content.options.C,
        'Option D': mcq.parsed_content.options.D,
        'Option E': mcq.parsed_content.options.E,
        'Correct Answer': mcq.parsed_content.correctAnswer,
        'Explanation': mcq.parsed_content.explanation,
        'Rating': mcq.rating || 0,
        'Created At': new Date(mcq.created_at).toLocaleString(),
      }));

      const ws = XLSX.utils.json_to_sheet(ws_data);

      // Adjust column widths for better readability
      const colWidths = [
        { wch: 20 }, // Name
        { wch: 15 }, // Topic
        { wch: 40 }, // Clinical Scenario
        { wch: 30 }, // Question
        { wch: 25 }, // Option A
        { wch: 25 }, // Option B
        { wch: 25 }, // Option C
        { wch: 25 }, // Option D
        { wch: 25 }, // Option E
        { wch: 15 }, // Correct Answer
        { wch: 40 }, // Explanation
        { wch: 10 }, // Rating
        { wch: 20 }, // Created At
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "MCQs");

      // Generate buffer with proper encoding
      const excelBuffer = XLSX.write(wb, { 
        type: 'buffer', 
        bookType: 'xlsx',
        bookSST: false,
        compression: true
      });

      res.setHeader('Content-Disposition', 'attachment; filename=mcq-export.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.end(excelBuffer);

    } catch (error: any) {
      console.error('XLSX export error:', error);
      res.status(500).send(error.message || "Failed to export to XLSX");
    }
  });

  // Export to PDF endpoint
  app.get("/api/mcq/export/pdf", async (req, res) => {
    try {
      const { ids } = req.query;
      let mcqData;

      if (ids) {
        const mcqIds = (ids as string).split(',').map(Number);
        mcqData = await db.select().from(mcqs)
          .where(inArray(mcqs.id, mcqIds))
          .orderBy(desc(mcqs.created_at));
      } else {
        mcqData = await db.select().from(mcqs)
          .orderBy(desc(mcqs.created_at));
      }

      // Create PDF document with better formatting
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: 'MCQ Export',
          Author: 'MCQ Generator',
          Subject: 'Medical MCQ Questions',
          Keywords: 'mcq, medical, questions',
          CreationDate: new Date()
        }
      });

      // Create a write stream buffer
      const chunks: any[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=mcq-export.pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
      });

      // Add content with improved formatting
      doc.font('Helvetica-Bold').fontSize(24).text('MCQ Export', { align: 'center' });
      doc.moveDown(2);

      mcqData.forEach((mcq, index) => {
        // Add MCQ number and name
        doc.font('Helvetica-Bold').fontSize(16)
          .text(`${index + 1}. ${mcq.name}`, { underline: true });

        doc.font('Helvetica').fontSize(12)
          .text(`Topic: ${mcq.topic}`, { color: 'grey' });
        doc.moveDown();

        // Clinical Scenario
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Clinical Scenario:', { underline: true });
        doc.font('Helvetica').fontSize(12)
          .text(mcq.parsed_content.clinicalScenario, { align: 'justify' });
        doc.moveDown();

        // Question
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Question:', { underline: true });
        doc.font('Helvetica').fontSize(12)
          .text(mcq.parsed_content.question, { align: 'justify' });
        doc.moveDown();

        // Options
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Options:', { underline: true });
        Object.entries(mcq.parsed_content.options).forEach(([letter, text]) => {
          doc.font('Helvetica').fontSize(12)
            .text(`${letter}) ${text}`, { indent: 20 });
        });
        doc.moveDown();

        // Correct Answer
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Correct Answer:', { underline: true });
        doc.font('Helvetica').fontSize(12)
          .text(`Option ${mcq.parsed_content.correctAnswer}`);
        doc.moveDown();

        // Explanation
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Explanation:', { underline: true });
        doc.font('Helvetica').fontSize(12)
          .text(mcq.parsed_content.explanation, { align: 'justify' });
        doc.moveDown();

        // Rating
        doc.font('Helvetica').fontSize(10)
          .text(`Rating: ${mcq.rating || 0} stars`, { color: 'grey' });

        // Add a page break between MCQs
        if (index < mcqData.length - 1) {
          doc.addPage();
        }
      });

      // Finalize PDF
      doc.end();

    } catch (error: any) {
      console.error('PDF export error:', error);
      res.status(500).send(error.message || "Failed to export to PDF");
    }
  });

  // Export to Practice PDF endpoint (without answers)
  app.get("/api/mcq/export/pdf/learner", async (req, res) => {
    try {
      const { ids } = req.query;
      let mcqData;

      if (ids) {
        const mcqIds = (ids as string).split(',').map(Number);
        mcqData = await db.select().from(mcqs)
          .where(inArray(mcqs.id, mcqIds))
          .orderBy(desc(mcqs.created_at));
      } else {
        mcqData = await db.select().from(mcqs)
          .orderBy(desc(mcqs.created_at));
      }

      // Create PDF document with better formatting
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4',
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: 'MCQ Practice Set',
          Author: 'MCQ Generator',
          Subject: 'Medical MCQ Practice Questions',
          Keywords: 'mcq, medical, practice, questions',
          CreationDate: new Date()
        }
      });

      // Create a write stream buffer
      const chunks: any[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=mcq-practice.pdf');
        res.setHeader('Content-Length', pdfBuffer.length);
        res.end(pdfBuffer);
      });

      // Add content
      doc.font('Helvetica-Bold').fontSize(24)
        .text('MCQ Practice Set', { align: 'center' });
      doc.moveDown(2);

      mcqData.forEach((mcq, index) => {
        // Add MCQ number and name
        doc.font('Helvetica-Bold').fontSize(16)
          .text(`${index + 1}. ${mcq.name}`, { underline: true });

        doc.font('Helvetica').fontSize(12)
          .text(`Topic: ${mcq.topic}`, { color: 'grey' });
        doc.moveDown();

        // Clinical Scenario
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Clinical Scenario:', { underline: true });
        doc.font('Helvetica').fontSize(12)
          .text(mcq.parsed_content.clinicalScenario, { align: 'justify' });
        doc.moveDown();

        // Question
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Question:', { underline: true });
        doc.font('Helvetica').fontSize(12)
          .text(mcq.parsed_content.question, { align: 'justify' });
        doc.moveDown();

        // Options
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Options:', { underline: true });
        Object.entries(mcq.parsed_content.options).forEach(([letter, text]) => {
          doc.font('Helvetica').fontSize(12)
            .text(`${letter}) ${text}`, { indent: 20 });
        });
        doc.moveDown();

        // Answer space
        doc.font('Helvetica-Bold').fontSize(14)
          .text('Your Answer: _____');
        doc.moveDown();

        if (index < mcqData.length - 1) {
          doc.addPage();
        }
      });

      // Add answer sheet at the end
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(20)
        .text('Answer Sheet', { align: 'center' });
      doc.moveDown();

      // Create a grid for answers
      const columns = 4;
      const rows = Math.ceil(mcqData.length / columns);

      for (let row = 0; row < rows; row++) {
        const answers = mcqData.slice(row * columns, (row + 1) * columns);
        const line = answers.map((mcq, idx) => {
          const num = row * columns + idx + 1;
          return `${num}. ${mcq.parsed_content.correctAnswer}`.padEnd(15);
        }).join('  ');

        doc.font('Helvetica').fontSize(12).text(line);
        doc.moveDown(0.5);
      }

      // Finalize PDF
      doc.end();

    } catch (error: any) {
      console.error('PDF export error:', error);
      res.status(500).send(error.message || "Failed to export to PDF");
    }
  });

  const httpServer = createServer(app);
  console.log('Routes registered successfully');
  return httpServer;
}