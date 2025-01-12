import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { mcqs } from "@db/schema";
import { desc, eq } from "drizzle-orm";
import OpenAI from "openai";

// Store the current prompt in memory
let currentPrompt = `You are an expert medical educator tasked with creating an extremely challenging multiple-choice question for medical specialists about "{topic}". Your goal is to test second-order thinking, emphasizing the application, analysis, and evaluation of knowledge based on Bloom's taxonomy.

Please follow these steps to create the question:

1. Give this MCQ a concise descriptive name that summarizes its content (e.g., "Acute Pancreatitis Management", "Beta-Blocker Pharmacology").

2. Clinical Scenario:
   - Write a clinical scenario about {topic} in the present tense (maximum 120 words).
   - Include relevant details such as presenting complaint, history, past medical history, drug history, social history, sexual history, physical examination findings, bedside parameters, and necessary investigations.
   - Use ONLY standard international units with reference ranges for any test results.
   - Do not reveal the diagnosis or include investigations that immediately give away the answer.

3. Question:
   - Test second-order thinking skills about {topic}.
   - For example, for a question that tests the learner's ability to reach a diagnosis, formulate a question that requires the individual to first come to a diagnosis but then give options to choose the right investigation or management plans.
   - Do not reveal or hint at the diagnosis in the question.
   - Avoid including obvious investigations or management options that would immediately give away the answer.

4. Multiple Choice Options:
   - Provide 5 options (A-E) in alphabetical order:
     a) One best and correct answer
     b) One correct answer, but not the best option
     c-e) Plausible options that might be correct, but are not the best answer
   - Keep the length of all options consistent.
   - Avoid misleading or ambiguously worded distractors.

5. Correct Answer and Feedback:
   - Identify the correct answer and explain why it is the best option.
   - Provide option-specific explanations for why each option is correct or incorrect.

Return your response in this EXACT format with these EXACT section headers:

NAME:
[MCQ name]

CLINICAL SCENARIO:
[Clinical scenario text]

QUESTION:
[Question text]

OPTIONS:
A) [Option A text]
B) [Option B text]
C) [Option C text]
D) [Option D text]
E) [Option E text]

CORRECT ANSWER: [Single letter A-E]

EXPLANATION:
[Detailed explanation text]`;

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

  const httpServer = createServer(app);
  console.log('Routes registered successfully');
  return httpServer;
}