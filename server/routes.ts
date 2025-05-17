// @ts-nocheck
import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";
import OpenAI from "openai";
import PDFDocument from "pdfkit";
import XLSX from "xlsx";

// Store the current prompt in memory
let currentPrompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists. Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy about {topic}

Please follow these steps to create the question:

1. Clinical Scenario:
   - Write a 120-word clinical scenario in the present tense.
   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
   - Use ONLY standard international units with reference ranges for any test results.
   - STRICTLY do not hint / mention or reveal the diagnosis or include investigations that give away the answer.
   - The clinical scenario also needs to be written to ensure the candidate is tested on the higher level skills of Bloom's taxonomy and on second order thinking.

2. Question:
   - Ensure the question tests at least second-order thinking skills
   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.
   - STRICTLY do not hint / mention any diagnosis or include investigations that give away the answer.
   - Keep the question stem concise and short.
   - DO NOT summarize the clinical scenario. For e.g. "In this patient with a familial pattern of mild hypercalcemia, which investigation is most appropriate to differentiate benign familial hypercalcemia from other hypercalcemic disorders?" should be "Which investigation is most appropriate to confirm the diagnosis". "In evaluating this patient’s hypercalcemia with a relevant family history, which investigation should be performed next?" should be "In evaluating this patient’s hypercalcemia, which investigation should be performed next?"

3. Multiple Choice Options:
   - Provide 5 options in alphabetical order. There needs to be:
     > One best and correct answer
     > One correct answer, but not the best option
     > Three plausible options that might be correct, but are not the best answer
   - Keep the length of all options consistent.
   - Avoid misleading or ambiguously worded distractors.
   - STRICTLY do not hint / mention / reveal the diagnosis or include investigations that immediately give away the answer.
   - The options are to be STRICT in ascending alphabetical order.

4. Correct Answer and Feedback:
   - Identify the correct answer and explain why it is the best option.
   - Provide option-specific explanations for why each option is correct or incorrect.

5. Question Structure:
   - Ensure the stem focuses on one specific idea or concept without blowing the cover of the second order intention.
   - Write the stem clearly and concisely.
   - Include all necessary information within the stem itself.
   - STRICTLY do not hint / mention / reveal any possible diagnoses or include investigations that immediately give away the answer
   
6. Multiple Choice Options:
   - Provide 5 options in alphabetical order. There needs to be:
     > One best and correct answer, which should have an equal chance of being option A, B, C, D or E
     > One correct answer, but not the best option
     > Three plausible options that might be correct, but are not the best answer
   - Keep the length of all options consistent.
   - Avoid misleading or ambiguously worded distractors.
   - STRICTLY do not hint / mention / reveal the diagnosis or include investigations that immediately give away the answer.
   - The options are to be STRICTLY sorted in ascending alphabetical order of their starting word, after "Option X"

7. Correct Answer and Feedback:
   - Identify the correct answer and explain why it is the best option.
   - Provide option-specific explanations for why each option is correct or incorrect.

Return your response in this exact JSON format:

{
  "name": "Descriptive name of the MCQ",
  "clinical_scenario": "Clinical scenario text",
  "question": "Question text",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text",
    "E": "Option E text"
  },
  "correct_answer": "Single letter A-E",
  "explanation": "Combined explanation for correct and incorrect answers"
}`;

// Default model setting
let currentModel = "o4-mini";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function parseGeneratedContent(content: string) {
  try {
    const jsonContent = JSON.parse(content);
    return {
      name: jsonContent.name,
      clinicalScenario: jsonContent.clinical_scenario,
      question: jsonContent.question,
      options: jsonContent.options,
      correctAnswer: jsonContent.correct_answer,
      explanation: jsonContent.explanation,
    };
  } catch (error) {
    console.error("Failed to parse JSON content:", error);
    throw new Error("Failed to parse generated MCQ content");
  }
}

export function registerRoutes(app: Express): Server {
  // Add model selection endpoint
  app.post("/api/settings/model", (req, res) => {
    try {
      const { model } = req.body;
      if (model !== "o4-mini") {
        return res.status(400).send("Invalid model selection");
      }
      currentModel = model;
      res.json({ success: true, currentModel });
    } catch (error: any) {
      console.error("Model selection error:", error);
      res.status(500).send(error.message || "Failed to update model selection");
    }
  });

  // Get current model endpoint
  app.get("/api/settings/model", (_req, res) => {
    res.json({ currentModel });
  });

  // MCQ Generation endpoint
  app.post("/api/mcq/generate", async (req, res) => {
    try {
      const { topic, referenceText, reasoningEffort = "medium" } = req.body;

      if (!topic) {
        return res.status(400).send("Topic is required");
      }

      let promptContent = currentPrompt.replace("{topic}", topic);
      if (referenceText) {
        promptContent += `\n\nReference Material:\n${referenceText}`;
      }

      const response = await openai.chat.completions.create({
        model: currentModel,
        messages: [
          {
            role: "developer",
            content: promptContent,
          },
        ],
        response_format: { type: "json_object" },
      });

      const generatedContent = response.choices[0].message.content;
      if (!generatedContent) {
        throw new Error("No content generated");
      }

      const parsedContent = parseGeneratedContent(generatedContent);
      console.log("Generated and parsed MCQ:", {
        name: parsedContent.name,
        model: currentModel,
        reasoningEffort,
      });

      res.json({
        raw: generatedContent,
        parsed: parsedContent,
      });
    } catch (error: any) {
      console.error("MCQ generation error:", error);
      res.status(500).send(error.message || "Failed to generate MCQ");
    }
  });

  // Save MCQ endpoint
  app.post("/api/mcq/save", async (req, res) => {
    try {
      const { name, topic, rawContent, parsedContent, model, reasoningEffort } =
        req.body;

      if (!parsedContent || !name || name.trim() === "") {
        return res.status(400).send("MCQ name is required");
      }

      const [newMcq] = await db
        .insert(mcqs)
        .values({
          name: name.trim(),
          topic: topic.trim(),
          raw_content: rawContent,
          parsed_content: parsedContent,
          model: model || "o4-mini",
          reasoning_effort: reasoningEffort || "medium",
        })
        .returning();

      res.json(newMcq);
    } catch (error: any) {
      console.error("Save MCQ error:", error);
      res.status(500).send(error.message || "Failed to save MCQ");
    }
  });

  // Get MCQ history endpoint
  app.get("/api/mcq/history", async (_req, res) => {
    try {
      console.log("Fetching MCQ history...");
      const mcqHistory = await db
        .select()
        .from(mcqs)
        .orderBy(desc(mcqs.created_at));
      console.log(
        "MCQ history fetched successfully:",
        mcqHistory.length,
        "items",
      );
      res.json(mcqHistory);
    } catch (error: any) {
      console.error("MCQ history error:", error);
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
      console.error("Delete MCQ error:", error);
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
      console.error("Update MCQ error:", error);
      res.status(500).send(error.message || "Failed to update MCQ");
    }
  });

  // Rate MCQ endpoint
  app.post("/api/mcq/:id/rate", async (req, res) => {
    try {
      console.log("Rating MCQ...");
      const mcqId = parseInt(req.params.id);
      const { rating } = req.body;

      if (isNaN(mcqId)) {
        console.error("Invalid MCQ ID:", req.params.id);
        return res.status(400).send("Invalid MCQ ID");
      }

      if (typeof rating !== "number" || rating < 0 || rating > 5) {
        console.error("Invalid rating value:", rating);
        return res.status(400).send("Rating must be a number between 0 and 5");
      }

      console.log(`Updating MCQ ${mcqId} with rating ${rating}`);
      await db.update(mcqs).set({ rating }).where(eq(mcqs.id, mcqId));

      console.log("Rating updated successfully");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update rating error:", error);
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
      if (typeof prompt !== "string" || !prompt.trim()) {
        return res.status(400).send("Prompt is required");
      }
      currentPrompt = prompt.trim();
      res.json({ success: true });
    } catch (error: any) {
      console.error("Update prompt error:", error);
      res.status(500).send(error.message || "Failed to update prompt");
    }
  });

  // Export to XLSX endpoint
  app.get("/api/mcq/export/xlsx", async (req, res) => {
    try {
      const { ids } = req.query;
      let mcqData;

      if (ids) {
        const mcqIds = (ids as string).split(",").map(Number);
        mcqData = await db
          .select()
          .from(mcqs)
          .where(inArray(mcqs.id, mcqIds))
          .orderBy(desc(mcqs.created_at));
      } else {
        mcqData = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws_data = mcqData.map((mcq) => ({
        Name: mcq.name,
        Topic: mcq.topic,
        Model: mcq.model || "o4-mini",
        "Clinical Scenario": mcq.parsed_content.clinicalScenario,
        Question: mcq.parsed_content.question,
        "Option A": mcq.parsed_content.options.A,
        "Option B": mcq.parsed_content.options.B,
        "Option C": mcq.parsed_content.options.C,
        "Option D": mcq.parsed_content.options.D,
        "Option E": mcq.parsed_content.options.E,
        "Correct Answer": mcq.parsed_content.correctAnswer,
        Explanation: mcq.parsed_content.explanation,
        Rating: mcq.rating || 0,
        "Created At": new Date(mcq.created_at).toLocaleString(),
      }));

      const ws = XLSX.utils.json_to_sheet(ws_data);

      // Adjust column widths for better readability
      const colWidths = [
        { wch: 20 }, // Name
        { wch: 15 }, // Topic
        { wch: 15 }, // Model
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
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "MCQs");

      // Generate buffer with proper encoding
      const excelBuffer = XLSX.write(wb, {
        type: "buffer",
        bookType: "xlsx",
        bookSST: false,
        compression: true,
      });

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=mcq-export.xlsx",
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.end(excelBuffer);
    } catch (error: any) {
      console.error("XLSX export error:", error);
      res.status(500).send(error.message || "Failed to export to XLSX");
    }
  });

  // Export to PDF endpoint
  app.get("/api/mcq/export/pdf", async (req, res) => {
    try {
      const { ids } = req.query;
      let mcqData;

      if (ids) {
        const mcqIds = (ids as string).split(",").map(Number);
        mcqData = await db
          .select()
          .from(mcqs)
          .where(inArray(mcqs.id, mcqIds))
          .orderBy(desc(mcqs.created_at));
      } else {
        mcqData = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      }

      // Create PDF document with better formatting
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: "MCQ Export",
          Author: "MCQ Generator",
          Subject: "Medical MCQ Questions",
          Keywords: "mcq, medical, questions",
          CreationDate: new Date(),
        },
      });

      // Create a write stream buffer
      const chunks: any[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=mcq-export.pdf",
        );
        res.setHeader("Content-Length", pdfBuffer.length);
        res.end(pdfBuffer);
      });

      // Add content with improved formatting
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .text("MCQ Export", { align: "center" });
      doc.moveDown(2);

      mcqData.forEach((mcq, index) => {
        // Add MCQ number and name
        doc
          .font("Helvetica-Bold")
          .fontSize(16)
          .text(`${index + 1}. ${mcq.name}`, { underline: true });

        doc
          .font("Helvetica")
          .fontSize(12)
          .text(`Topic: ${mcq.topic} • Model: ${mcq.model || "o4-mini"}`, {
            color: "grey",
          });
        doc.moveDown();

        // Clinical Scenario
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Clinical Scenario:", { underline: true });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text(mcq.parsed_content.clinicalScenario, { align: "justify" });
        doc.moveDown();

        // Question
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Question:", { underline: true });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text(mcq.parsed_content.question, { align: "justify" });
        doc.moveDown();

        // Options
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Options:", { underline: true });
        Object.entries(mcq.parsed_content.options).forEach(([letter, text]) => {
          doc
            .font("Helvetica")
            .fontSize(12)
            .text(`${letter}) ${text}`, { indent: 20 });
        });
        doc.moveDown();

        // Correct Answer
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Correct Answer:", { underline: true });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text(`Option ${mcq.parsed_content.correctAnswer}`);
        doc.moveDown();

        // Explanation
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Explanation:", { underline: true });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text(mcq.parsed_content.explanation, { align: "justify" });
        doc.moveDown();

        // Rating
        doc
          .font("Helvetica")
          .fontSize(10)
          .text(`Rating: ${mcq.rating || 0} stars`, { color: "grey" });

        // Add a page break between MCQs
        if (index < mcqData.length - 1) {
          doc.addPage();
        }
      });

      // Finalize PDF
      doc.end();
    } catch (error: any) {
      console.error("PDF export error:", error);
      res.status(500).send(error.message || "Failed to export to PDF");
    }
  });

  // Export to Practice PDF endpoint (without answers)
  app.get("/api/mcq/export/pdf/learner", async (req, res) => {
    try {
      const { ids } = req.query;
      let mcqData;

      if (ids) {
        const mcqIds = (ids as string).split(",").map(Number);
        mcqData = await db
          .select()
          .from(mcqs)
          .where(inArray(mcqs.id, mcqIds))
          .orderBy(desc(mcqs.created_at));
      } else {
        mcqData = await db.select().from(mcqs).orderBy(desc(mcqs.created_at));
      }

      // Create PDF document with better formatting
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: "MCQ Practice Set",
          Author: "MCQ Generator",
          Subject: "Medical MCQ Practice Questions",
          Keywords: "mcq, medical, practice, questions",
          CreationDate: new Date(),
        },
      });

      // Create a write stream buffer
      const chunks: any[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename=mcq-practice.pdf",
        );
        res.setHeader("Content-Length", pdfBuffer.length);
        res.end(pdfBuffer);
      });

      // Add content
      doc
        .font("Helvetica-Bold")
        .fontSize(24)
        .text("MCQ Practice Set", { align: "center" });
      doc.moveDown(2);

      mcqData.forEach((mcq, index) => {
        // Add MCQ number and name
        doc
          .font("Helvetica-Bold")
          .fontSize(16)
          .text(`${index + 1}. ${mcq.name}`, { underline: true });

        doc
          .font("Helvetica")
          .fontSize(12)
          .text(`Topic: ${mcq.topic}`, { color: "grey" });
        doc.moveDown();

        // Clinical Scenario
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Clinical Scenario:", { underline: true });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text(mcq.parsed_content.clinicalScenario, { align: "justify" });
        doc.moveDown();

        // Question
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Question:", { underline: true });
        doc
          .font("Helvetica")
          .fontSize(12)
          .text(mcq.parsed_content.question, { align: "justify" });
        doc.moveDown();

        // Options
        doc
          .font("Helvetica-Bold")
          .fontSize(14)
          .text("Options:", { underline: true });
        Object.entries(mcq.parsed_content.options).forEach(([letter, text]) => {
          doc
            .font("Helvetica")
            .fontSize(12)
            .text(`${letter}) ${text}`, { indent: 20 });
        });
        doc.moveDown();

        // Answer space
        doc.font("Helvetica-Bold").fontSize(14).text("Your Answer: _____");
        doc.moveDown();

        if (index < mcqData.length - 1) {
          doc.addPage();
        }
      });

      // Add answer sheet at the end
      doc.addPage();
      doc
        .font("Helvetica-Bold")
        .fontSize(20)
        .text("Answer Sheet", { align: "center" });
      doc.moveDown();

      // Create a grid for answers
      const columns = 4;
      const rows = Math.ceil(mcqData.length / columns);

      for (let row = 0; row < rows; row++) {
        const answers = mcqData.slice(row * columns, (row + 1) * columns);
        const line = answers
          .map((mcq, idx) => {
            const num = row * columns + idx + 1;
            return `${num}. ${mcq.parsed_content.correctAnswer}`.padEnd(15);
          })
          .join("  ");

        doc.font("Helvetica").fontSize(12).text(line);
        doc.moveDown(0.5);
      }

      // Finalize PDF
      doc.end();
    } catch (error: any) {
      console.error("PDF export error:", error);
      res.status(500).send(error.message || "Failed to export to PDF");
    }
  });

  // Rewrite clinical scenario endpoint
  app.post("/api/mcq/rewrite-scenario", async (req, res) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).send("Clinical scenario text is required");
      }

      const prompt = `Please rewrite the following clinical scenario to be clear, concise, and grammatically correct while maintaining all medical details and information:\n\n${text}`;

      const response = await openai.chat.completions.create({
        model: "o4-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const rewrittenText = response.choices[0].message.content;
      if (!rewrittenText) {
        throw new Error("No content generated");
      }

      res.json({ text: rewrittenText });
    } catch (error: any) {
      console.error("Clinical scenario rewrite error:", error);
      res
        .status(500)
        .send(error.message || "Failed to rewrite clinical scenario");
    }
  });

  const httpServer = createServer(app);
  console.log("Routes registered successfully");
  return httpServer;
}
